"""
grounding_diagnostics.py
-------------------------------------------------------------------------------
SatQuery AI — SIH26167: Grounding Failure Diagnosis & Perturbation Audit

DIAGNOSIS OF PROBLEM 1:
Why does a fine-tuned VLM output generic captions instead of answering the query?
1. Prompt Template Leakage / Truncation:
   The question string was either truncated by max_seq_length or not wrapped
   in model-specific user turn delimiters (<|im_start|>user ... <|im_end|>).
2. Training Loss Masking Defect:
   During causal LM fine-tuning, if target labels did not mask the input
   tokens (-100 for question + image tokens), the loss penalized the model for
   generating questions instead of only answers. The model defaulted to general
   captioning frequencies present in pre-training.
3. Lack of Question-Perturbation Sensitivity:
   The model learned an image-only shortcut where image tokens dominate the
   cross-attention, ignoring text tokens entirely.

This script implements:
- Answer Invariance Detection: Flags answers that do not change when the question changes.
- Strict Delimited Prompt Formatter.
- Grounding Sensitivity Score Calculation.
-------------------------------------------------------------------------------
"""

import json
import os
from typing import List, Dict, Tuple
from collections import defaultdict

# Pairs of distinct questions tested on the identical image
CONTRASTIVE_PAIRS = [
    (
        "What is the dominant land cover class in this image?",
        "Is there any surface water or wetland present in this scene?"
    ),
    (
        "Quantify the canopy degradation or vegetation loss.",
        "Are there any urban buildings or roads visible?"
    ),
    (
        "Describe the landscape terrain morphology.",
        "State whether this is an agricultural crop field."
    )
]

def strict_grounded_prompt(task_type: str, question: str, image_token: str = "<image>") -> str:
    """
    Strictly structured prompt enforcing question conditioning over generic image captioning.
    Delimits task intent and explicitly commands direct answer generation.
    """
    return (
        f"<|im_start|>system\n"
        f"You are a specialized satellite analysis assistant for the [{task_type}] task.\n"
        f"CRITICAL CONSTRAINT: You must answer ONLY the specific [QUESTION] below.\n"
        f"Do NOT provide a general caption or unprompted scene summary.<|im_end|>\n"
        f"<|im_start|>user\n"
        f"[IMAGE CONTEXT]\n{image_token}\n\n"
        f"[QUESTION]\n{question.strip()}\n\n"
        f"[DIRECT ANSWER REQUIRED]<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )

def compute_jaccard_similarity(str1: str, str2: str) -> float:
    set1 = set(str1.lower().split())
    set2 = set(str2.lower().split())
    if not set1 or not set2:
        return 0.0
    return len(set1 & set2) / len(set1 | set2)

def evaluate_grounding_invariance(predictions_log: List[Dict[str, str]]) -> Dict[str, float]:
    """
    Audits a batch of model inference outputs for grounding failure.
    If the model produces almost identical answers to two completely different questions
    for the same image, it has suffered grounding collapse.
    """
    total_pairs = len(predictions_log)
    grounding_failures = 0
    invariance_scores = []

    for item in predictions_log:
        q1 = item["question_1"]
        ans1 = item["answer_1"]
        q2 = item["question_2"]
        ans2 = item["answer_2"]

        # If questions are orthogonal but answers have high text similarity (> 0.65)
        sim = compute_jaccard_similarity(ans1, ans2)
        invariance_scores.append(sim)

        # High similarity indicates answer invariance (ignoring query)
        if sim > 0.65:
            grounding_failures += 1

    failure_rate = (grounding_failures / total_pairs) * 100 if total_pairs > 0 else 0
    avg_invariance = sum(invariance_scores) / len(invariance_scores) if invariance_scores else 0
    sensitivity_score = max(0.0, 1.0 - avg_invariance)

    print("=" * 65)
    print("SatQuery AI — Grounding Sensitivity & Invariance Audit")
    print("=" * 65)
    print(f"Total Evaluated Image Pairs:    {total_pairs}")
    print(f"Grounding Failure Count:        {grounding_failures}")
    print(f"Grounding Failure Rate:         {failure_rate:.1f}% (target: < 5%)")
    print(f"Mean Answer Invariance:         {avg_invariance:.3f} (0 = independent, 1 = identical)")
    print(f"Query Grounding Sensitivity:    {sensitivity_score:.3f} / 1.000")
    print("-" * 65)

    if failure_rate > 20:
        print("⚠️ DIAGNOSIS: SEVERE GROUNDING COLLAPSE DETECTED.")
        print("  Recommendation: Retrain with strict prompt templates and verify causal loss masking (-100).")
    else:
        print("✓ DIAGNOSIS: Model is properly conditioned on query syntax.")

    return {
        "failure_rate": failure_rate,
        "avg_invariance": avg_invariance,
        "sensitivity_score": sensitivity_score
    }

if __name__ == "__main__":
    # Example diagnostic run on synthetic evaluation outputs
    sample_log = [
        {
            "image_id": "S2A_001",
            "question_1": "What is the dominant land cover class in this image?",
            "answer_1": "Broad-leaved forest canopy.",
            "question_2": "Is there any surface water or wetland present in this scene?",
            "answer_2": "No surface water is detected in this scene."
        },
        {
            "image_id": "S2A_002",
            "question_1": "What is the dominant land cover class in this image?",
            "answer_1": "A high-resolution satellite view of natural vegetation with agricultural parcels.",
            "question_2": "Is there any surface water or wetland present in this scene?",
            "answer_2": "A high-resolution satellite view of natural vegetation with agricultural parcels."  # Failure!
        }
    ]
    evaluate_grounding_invariance(sample_log)
