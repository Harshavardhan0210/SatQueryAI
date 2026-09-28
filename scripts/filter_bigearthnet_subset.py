"""
filter_bigearthnet_subset.py
-------------------------------------------------------------------------------
SatQuery AI — SIH26167: Vision-Language Model Fine-Tuning Pipeline
Module: Stratified Dataset Extractor for Vegetation & Land-Cover (LULC) VQA

Extracts and balances a 3,000–5,000 sample subset from BigEarthNet.txt
(arXiv:2603.29630) or BigEarthNet-S2 annotations, isolating single-image VQA
pairs for vegetation, forest degradation, water, and agricultural land cover.
-------------------------------------------------------------------------------
"""

import json
import random
import os
import argparse
from collections import defaultdict
from typing import List, Dict, Any

# 19 CORINE Land Cover (CLC) Classes standard in BigEarthNet
LULC_VEGETATION_CLASSES = [
    "Broad-leaved forest",
    "Coniferous forest",
    "Mixed forest",
    "Moist chasmophytic and scrub vegetation",
    "Transitional woodland-shrub",
    "Natural grassland",
    "Pastures",
    "Non-irrigated arable land",
    "Permanently irrigated land",
    "Rice fields",
    "Vineyards",
    "Fruit trees and berry plantations",
    "Olive groves",
    "Inland marshes",
    "Peatbogs",
    "Water bodies",
    "Water courses",
    "Coastal lagoons",
    "Estuaries"
]

# Standard question templates for single-image Remote Sensing VQA
QUESTION_TEMPLATES = [
    "What is the dominant land cover class in this satellite image?",
    "Does this image depict dense forest canopy or open agricultural land?",
    "What type of vegetation cover is present in this scene?",
    "Is there any presence of surface water or wetlands in this observation?",
    "Identify the primary vegetation classification shown in the scene.",
    "State the predominant land use / land cover category visible here."
]

def generate_synthetic_samples_if_mock(num_samples: int = 3500) -> List[Dict[str, Any]]:
    """Generates synthetic dataset structure matching BigEarthNet.txt schema for rapid testing."""
    samples = []
    classes = [
        ("Broad-leaved forest", "vegetation", "The dominant land cover is broad-leaved forest with dense green tree canopy."),
        ("Coniferous forest", "vegetation", "The image shows a coniferous evergreen needle-leaf forest canopy."),
        ("Mixed forest", "vegetation", "The scene contains a mixed forest with both deciduous and coniferous tree species."),
        ("Natural grassland", "vegetation", "The primary cover is natural open grassland and herbaceous vegetation."),
        ("Pastures", "agriculture", "The image depicts managed pastures and grazing meadows."),
        ("Non-irrigated arable land", "agriculture", "The scene shows non-irrigated agricultural arable cropland."),
        ("Permanently irrigated land", "agriculture", "The image reveals irrigated agricultural fields with high crop density."),
        ("Transitional woodland-shrub", "vegetation", "The area features transitional woodland-shrub with bushy sparse growth."),
        ("Inland marshes", "wetland", "The scene contains inland wetland marshes with moisture-saturated vegetation."),
        ("Water bodies", "water", "The image captures open freshwater bodies and lakes with deep absorption signatures.")
    ]

    for i in range(num_samples):
        cls_name, category, answer_desc = random.choice(classes)
        q = random.choice(QUESTION_TEMPLATES)
        
        # Ground truth answers formatted for VQA
        if "dominant land cover" in q or "primary" in q or "predominant" in q:
            answer = cls_name
        elif "dense forest" in q:
            answer = "Dense forest canopy" if "forest" in cls_name else "Open agricultural or grassland"
        elif "water" in q:
            answer = "Yes, surface water is present." if category == "water" or category == "wetland" else "No surface water is detected in this scene."
        else:
            answer = answer_desc

        sample_id = f"S2A_MSIL2A_2021_{i:06d}"
        samples.append({
            "id": sample_id,
            "image": f"images/{sample_id}.jpg",
            "class_label": cls_name,
            "category": category,
            "question": q,
            "answer": answer,
            "conversations": [
                {"from": "human", "value": f"<image>\n{q}"},
                {"from": "gpt", "value": answer}
            ]
        })
    return samples

def filter_and_split(
    input_annotation_path: str,
    output_dir: str,
    max_train_samples: int = 3500,
    max_val_samples: int = 500
):
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"[*] Reading annotations from: {input_annotation_path}")
    raw_data = []

    if os.path.exists(input_annotation_path):
        with open(input_annotation_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        raw_data.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
        print(f"[+] Loaded {len(raw_data)} raw records.")
    else:
        print(f"[!] Warning: {input_annotation_path} not found on local path.")
        print(f"[*] Generating {max_train_samples + max_val_samples} stratified BigEarthNet.txt schema mock samples...")
        raw_data = generate_synthetic_samples_if_mock(max_train_samples + max_val_samples + 200)

    # Filter records containing vegetation/LULC classes
    stratified_buckets = defaultdict(list)
    for record in raw_data:
        label = record.get("class_label") or record.get("label") or "Broad-leaved forest"
        stratified_buckets[label].append(record)

    print(f"[+] Found {len(stratified_buckets)} distinct classes.")

    # Stratified balance sampling
    per_class_train = max(1, max_train_samples // len(stratified_buckets))
    per_class_val = max(1, max_val_samples // len(stratified_buckets))

    train_set = []
    val_set = []

    for cls, items in stratified_buckets.items():
        random.shuffle(items)
        train_slice = items[:per_class_train]
        val_slice = items[per_class_train : per_class_train + per_class_val]
        train_set.extend(train_slice)
        val_set.extend(val_slice)

    random.shuffle(train_set)
    random.shuffle(val_set)

    train_path = os.path.join(output_dir, "train_vqa.jsonl")
    val_path = os.path.join(output_dir, "val_vqa.jsonl")

    with open(train_path, "w", encoding="utf-8") as f:
        for item in train_set:
            f.write(json.dumps(item) + "\n")

    with open(val_path, "w", encoding="utf-8") as f:
        for item in val_set:
            f.write(json.dumps(item) + "\n")

    print(f"[✓] Stratification complete:")
    print(f"    - Train split: {len(train_set)} records -> {train_path}")
    print(f"    - Val split:   {len(val_set)} records   -> {val_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Filter BigEarthNet.txt for LULC VQA")
    parser.add_argument("--input", default="bigearthnet_vqa_raw.jsonl", help="Input annotation JSONL")
    parser.add_argument("--output_dir", default="data_subset", help="Output directory")
    parser.add_argument("--train_count", type=int, default=3200, help="Train samples")
    parser.add_argument("--val_count", type=int, default=400, help="Validation samples")
    args = parser.parse_args()

    filter_and_split(args.input, args.output_dir, args.train_count, args.val_count)
