"""
train_qlora_vlm.py
-------------------------------------------------------------------------------
SatQuery AI — SIH26167: Vision-Language Model Fine-Tuning Pipeline
Low-Resource QLoRA Fine-Tuning on Single GPU (~15GB VRAM: Colab T4 / Kaggle P100)

Target Model: Qwen/Qwen2-VL-2B-Instruct
Target Task:  Single-Image Remote Sensing VQA (Vegetation & LULC classification)
Dataset:      BigEarthNet.txt (arXiv:2603.29630) Stratified Subset (~3,500 samples)
-------------------------------------------------------------------------------
"""

import os
import json
import torch
from dataclasses import dataclass
from typing import Dict, List, Any
from PIL import Image

from transformers import (
    Qwen2VLForConditionalGeneration,
    AutoProcessor,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig
)
from peft import (
    LoraConfig,
    get_peft_model,
    prepare_model_for_kbit_training
)
from torch.utils.data import Dataset

# -----------------------------------------------------------------------------
# 1. Configuration & Hyperparameters (Tuned for 15GB VRAM)
# -----------------------------------------------------------------------------
MODEL_ID = "Qwen/Qwen2-VL-2B-Instruct"
OUTPUT_DIR = "./satquery_qlora_adapter"
TRAIN_FILE = "data_subset/train_vqa.jsonl"
VAL_FILE = "data_subset/val_vqa.jsonl"

# Image resolution constraints (Crucial for VRAM control)
# 28x28 patches: min 256x256, max 384x384 avoids OOM on satellite crops
MIN_PIXELS = 256 * 28 * 28
MAX_PIXELS = 384 * 28 * 28
MAX_SEQ_LENGTH = 512

BATCH_SIZE = 2
GRAD_ACCUMULATION = 8   # Effective batch size = 16
LEARNING_RATE = 2e-4
NUM_EPOCHS = 3

# -----------------------------------------------------------------------------
# 2. Dataset Definition
# -----------------------------------------------------------------------------
class BigEarthNetVQADataset(Dataset):
    def __init__(self, jsonl_path: str, processor: AutoProcessor, is_train: bool = True):
        self.processor = processor
        self.samples = []
        
        if os.path.exists(jsonl_path):
            with open(jsonl_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        self.samples.append(json.loads(line))
        else:
            print(f"[!] Warning: {jsonl_path} not found. Creating placeholder dummy records.")
            for i in range(20):
                self.samples.append({
                    "id": f"dummy_{i}",
                    "image": None,
                    "question": "What is the primary land cover visible in this scene?",
                    "answer": "Broad-leaved forest with dense canopy."
                })

        print(f"[+] Loaded {len(self.samples)} samples from {jsonl_path}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        image_path = item.get("image")
        
        # Load image if exists, else construct standard 256x256 satellite crop
        if image_path and os.path.exists(image_path):
            try:
                image = Image.open(image_path).convert("RGB")
            except Exception:
                image = Image.new("RGB", (256, 256), color=(30, 80, 40))
        else:
            # Fallback synthetic patch (forest green)
            image = Image.new("RGB", (256, 256), color=(35, 85, 45))

        question = item.get("question", "What land cover class is shown here?")
        answer = item.get("answer", "Broad-leaved forest")

        # Format Qwen2-VL chat format
        conversation = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": question}
                ]
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": answer}
                ]
            }
        ]

        text_prompt = self.processor.apply_chat_template(
            conversation, add_generation_prompt=False, tokenize=False
        )

        inputs = self.processor(
            text=[text_prompt],
            images=[image],
            padding=False,
            return_tensors="pt"
        )

        # Flatten batch dimension
        input_ids = inputs["input_ids"][0]
        attention_mask = inputs["attention_mask"][0]
        pixel_values = inputs["pixel_values"]
        image_grid_thw = inputs["image_grid_thw"]

        # Mask user question tokens from loss computation (train ONLY on assistant answer)
        labels = input_ids.clone()
        
        # Assistant token delimiter in Qwen2-VL template: "<|im_start|>assistant\n"
        assistant_token_id = self.processor.tokenizer.convert_tokens_to_ids("<|im_start|>")
        token_indices = (input_ids == assistant_token_id).nonzero(as_tuple=True)[0]
        
        if len(token_indices) > 1:
            assistant_start_idx = token_indices[-1].item()
            # Mask everything prior to assistant start with -100
            labels[:assistant_start_idx + 2] = -100
        else:
            # Fallback: mask first 60% of sequence
            split_point = int(len(labels) * 0.6)
            labels[:split_point] = -100

        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "pixel_values": pixel_values,
            "image_grid_thw": image_grid_thw,
            "labels": labels
        }

@dataclass
class QwenDataCollator:
    processor: AutoProcessor

    def __call__(self, batch: List[Dict[str, Any]]) -> Dict[str, torch.Tensor]:
        input_ids = [item["input_ids"] for item in batch]
        labels = [item["labels"] for item in batch]
        attention_mask = [item["attention_mask"] for item in batch]

        # Dynamic pad to max length in current batch
        input_ids = torch.nn.utils.rnn.pad_sequence(
            input_ids, batch_first=True, padding_value=self.processor.tokenizer.pad_token_id
        )
        labels = torch.nn.utils.rnn.pad_sequence(
            labels, batch_first=True, padding_value=-100
        )
        attention_mask = torch.nn.utils.rnn.pad_sequence(
            attention_mask, batch_first=True, padding_value=0
        )

        # Concat pixel values along batch
        pixel_values = torch.cat([item["pixel_values"] for item in batch], dim=0)
        image_grid_thw = torch.cat([item["image_grid_thw"] for item in batch], dim=0)

        # Truncate if exceeds MAX_SEQ_LENGTH
        if input_ids.shape[1] > MAX_SEQ_LENGTH:
            input_ids = input_ids[:, :MAX_SEQ_LENGTH]
            labels = labels[:, :MAX_SEQ_LENGTH]
            attention_mask = attention_mask[:, :MAX_SEQ_LENGTH]

        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "pixel_values": pixel_values,
            "image_grid_thw": image_grid_thw,
            "labels": labels
        }

# -----------------------------------------------------------------------------
# 3. Model Loading & 4-Bit QLoRA Setup
# -----------------------------------------------------------------------------
def setup_model_and_processor():
    print(f"[*] Initializing QLoRA 4-bit configuration for: {MODEL_ID}")

    # 4-bit NF4 Quantization (BitsAndBytes)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    processor = AutoProcessor.from_pretrained(
        MODEL_ID,
        min_pixels=MIN_PIXELS,
        max_pixels=MAX_PIXELS
    )

    model = Qwen2VLForConditionalGeneration.from_pretrained(
        MODEL_ID,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.float16,
        low_cpu_mem_usage=True
    )

    # Enable gradient checkpointing for 15GB VRAM
    model = prepare_model_for_kbit_training(model, use_gradient_checkpointing=True)

    # FREEZE Vision Encoder: Only adapt Language Model & cross-attention
    print("[*] Freezing visual encoder backbone (zero grad)...")
    for param in model.visual.parameters():
        param.requires_grad = False

    # LoRA Adapter Configuration
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        target_modules=[
            "q_proj",
            "k_proj",
            "v_proj",
            "o_proj",
            "gate_proj",
            "up_proj",
            "down_proj"
        ],
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    return model, processor

# -----------------------------------------------------------------------------
# 4. Training Loop
# -----------------------------------------------------------------------------
def run_training():
    model, processor = setup_model_and_processor()

    train_dataset = BigEarthNetVQADataset(TRAIN_FILE, processor, is_train=True)
    val_dataset = BigEarthNetVQADataset(VAL_FILE, processor, is_train=False)
    data_collator = QwenDataCollator(processor)

    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRAD_ACCUMULATION,
        learning_rate=LEARNING_RATE,
        num_train_epochs=NUM_EPOCHS,
        warmup_ratio=0.05,
        lr_scheduler_type="cosine",
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=100,
        save_strategy="steps",
        save_steps=100,
        save_total_limit=2,
        fp16=True,                          # Turing T4 compatible
        bf16=False,
        optim="paged_adamw_8bit",           # Saves ~1.2 GB optimizer VRAM
        gradient_checkpointing=True,
        report_to="none",
        remove_unused_columns=False,
        dataloader_num_workers=2
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=data_collator
    )

    print("[🚀] Launching SatQuery AI QLoRA Fine-Tuning...")
    trainer.train()

    print(f"[✓] Training complete. Saving LoRA adapter to: {OUTPUT_DIR}")
    model.save_pretrained(OUTPUT_DIR)
    processor.save_pretrained(OUTPUT_DIR)
    print("[✓] Weights and processor saved successfully.")

if __name__ == "__main__":
    run_training()
