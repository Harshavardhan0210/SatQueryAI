"""
evaluate_rsvqa.py
-------------------------------------------------------------------------------
SatQuery AI — SIH26167: Evaluation Script
Single-Image Remote Sensing VQA Accuracy & Qualitative Benchmark
-------------------------------------------------------------------------------
"""

import os
import json
import torch
from PIL import Image
from transformers import (
    Qwen2VLForConditionalGeneration,
    AutoProcessor,
    BitsAndBytesConfig
)
from peft import PeftModel
from collections import defaultdict

BASE_MODEL = "Qwen/Qwen2-VL-2B-Instruct"
ADAPTER_PATH = "./satquery_qlora_adapter"
VAL_FILE = "data_subset/val_vqa.jsonl"

def normalize_text(s: str) -> str:
    """Basic lowercasing, punctuation stripping for robust VQA matching."""
    s = s.lower().strip()
    for char in [".", ",", "!", "?", "\n", "\t"]:
        s = s.replace(char, "")
    return " ".join(s.split())

def evaluate():
    print(f"[*] Loading quantized base model: {BASE_MODEL}")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16
    )

    processor = AutoProcessor.from_pretrained(BASE_MODEL)
    base_model = Qwen2VLForConditionalGeneration.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        torch_dtype=torch.float16
    )

    if os.path.exists(ADAPTER_PATH):
        print(f"[*] Attaching trained LoRA adapter from: {ADAPTER_PATH}")
        model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
    else:
        print("[!] Adapter directory not found, running zero-shot base model evaluation.")
        model = base_model

    model.eval()

    # Load validation set
    val_records = []
    if os.path.exists(VAL_FILE):
        with open(VAL_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    val_records.append(json.loads(line))
    else:
        print(f"[!] Validation file {VAL_FILE} not found. Running benchmark on mock samples.")
        val_records = [
            {
                "id": "sample_001",
                "image": None,
                "question": "What is the dominant land cover class in this satellite image?",
                "answer": "Broad-leaved forest",
                "category": "vegetation"
            },
            {
                "id": "sample_002",
                "image": None,
                "question": "What type of vegetation cover is present in this scene?",
                "answer": "Coniferous forest",
                "category": "vegetation"
            },
            {
                "id": "sample_003",
                "image": None,
                "question": "Is there any presence of surface water or wetlands in this observation?",
                "answer": "No surface water is detected in this scene.",
                "category": "water"
            }
        ]

    total = len(val_records)
    correct = 0
    category_stats = defaultdict(lambda: {"correct": 0, "total": 0})
    qualitative_results = []

    print(f"[🚀] Commencing RSVQA Evaluation on {total} samples...")

    with torch.no_grad():
        for idx, item in enumerate(val_records):
            img_path = item.get("image")
            if img_path and os.path.exists(img_path):
                img = Image.open(img_path).convert("RGB")
            else:
                img = Image.new("RGB", (256, 256), color=(25, 75, 35))

            q = item.get("question", "What is the dominant land cover class?")
            gt = item.get("answer", "")
            cat = item.get("category", "general")

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": img},
                        {"type": "text", "text": q}
                    ]
                }
            ]

            prompt = processor.apply_chat_template(messages, add_generation_prompt=True, tokenize=False)
            inputs = processor(text=[prompt], images=[img], return_tensors="pt").to("cuda")

            generated_ids = model.generate(
                **inputs,
                max_new_tokens=64,
                do_sample=False,
                temperature=0.0
            )

            # Slice away input prompt tokens
            trimmed_ids = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            pred = processor.batch_decode(trimmed_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0].strip()

            # Normalized match
            norm_gt = normalize_text(gt)
            norm_pred = normalize_text(pred)

            is_match = (norm_gt in norm_pred) or (norm_pred in norm_gt)
            if is_match:
                correct += 1
                category_stats[cat]["correct"] += 1
            category_stats[cat]["total"] += 1

            if idx < 6:
                qualitative_results.append({
                    "id": item.get("id"),
                    "question": q,
                    "ground_truth": gt,
                    "prediction": pred,
                    "match": is_match
                })

            if (idx + 1) % 50 == 0 or idx == total - 1:
                print(f"    Processed {idx + 1}/{total} | Running Accuracy: {(correct / (idx + 1)) * 100:.2f}%")

    overall_acc = (correct / total) * 100 if total > 0 else 0
    print("\n" + "=" * 60)
    print("SatQuery AI — RSVQA Benchmark Results (Single-Image VQA)")
    print("=" * 60)
    print(f"Overall Accuracy: {overall_acc:.2f}% ({correct}/{total})")
    print("\nPer-Category Accuracy Breakdown:")
    for c, s in category_stats.items():
        cat_acc = (s["correct"] / s["total"]) * 100 if s["total"] > 0 else 0
        print(f"  - {c.capitalize():<15}: {cat_acc:.2f}% ({s['correct']}/{s['total']})")

    print("\nQualitative Inference Examples:")
    for i, ex in enumerate(qualitative_results, 1):
        print(f"  [{i}] ID: {ex['id']}")
        print(f"      Q:  {ex['question']}")
        print(f"      GT: {ex['ground_truth']}")
        print(f"      AI: {ex['prediction']} {'[✓ CORRECT]' if ex['match'] else '[✗ MISMATCH]'}")
        print()

if __name__ == "__main__":
    evaluate()
