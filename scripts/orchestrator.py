"""
orchestrator.py
-------------------------------------------------------------------------------
SatQuery AI — SIH26167: Multi-Model Intent Classifier & Routing Orchestrator

Architecture:
  Incoming Query
       │
       ▼
  ┌────────────────────────────────────────────────────────┐
  │         Lightweight Intent Classifier (Orchestrator)   │
  │  - Rules & Keyword Latency: < 2ms                      │
  │  - Classifies query into 1 of 4 benchmark tasks        │
  │  - Computes confidence & fallback detection            │
  └────────────────────────┬───────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┬─────────────────┐
         ▼                 ▼                 ▼                 ▼
   [CAPTIONING]      [VQA_SINGLE]       [CDVQA]          [GROUNDING]
    VRSBench          RSVQA              Change-Det       BigEarthNet.txt
    Adapter           Adapter            Adapter          Adapter
         │                 │                 │                 │
         └─────────────────┴────────┬────────┴─────────────────┘
                                    │
                                    ▼
         Shared Qwen2-VL-2B Backbone (4-bit NF4 quantized, 15GB VRAM)
         Dynamic runtime adapter swap: model.set_adapter(task_adapter)
-------------------------------------------------------------------------------
"""

import time
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass

@dataclass
class RoutingDecision:
    task_type: str
    adapter_name: str
    confidence: float
    reasoning: str
    is_fallback: boolean
    latency_ms: float
    benchmark_name: str

class QueryOrchestrator:
    """
    Lightweight intent classifier that routes queries to specialized LoRA adapters
    prior to invoking any vision processing.
    """
    def __init__(self):
        self.routes = {
            "GROUNDING_REFEXP": {
                "adapter": "lora_grounding_adapter",
                "benchmark": "BigEarthNet.txt Referring Expression",
                "keywords": ["locate", "where is", "find the", "bounding box", "bbox", "detect the", "pinpoint", "coordinates", "highlight the area"]
            },
            "CHANGE_DETECTION_VQA": {
                "adapter": "lora_cdvqa_adapter",
                "benchmark": "CDVQA (Multitemporal Change VQA)",
                "keywords": ["change", "since", "between", "compared", "before and after", "cleared", "decrease", "increase", "loss", "gain", "receded", "expansion", "burn scar"]
            },
            "CAPTIONING": {
                "adapter": "lora_captioning_adapter",
                "benchmark": "VRSBench Dense Captioning",
                "keywords": ["describe", "summary", "overview", "caption", "tell me about this scene", "what does this image show", "detailed description"]
            },
            "VQA_SINGLE": {
                "adapter": "lora_rsvqa_adapter",
                "benchmark": "RSVQA (Single-Image VQA)",
                "keywords": ["what is", "is there", "are there", "what type", "identify", "classify", "how many", "dominant land cover", "water present", "forest density"]
            }
        }

    def route_query(self, query: str) -> RoutingDecision:
        t0 = time.perf_counter()
        q = query.lower().strip()

        # Score matching weights
        scores = {}
        matched_kw = {}

        for task, config in self.routes.items():
            matches = [kw for kw in config["keywords"] if kw in q]
            # Weight longer keyword matches higher
            score = sum(len(kw.split()) for kw in matches)
            scores[task] = score
            matched_kw[task] = matches

        best_task = max(scores, key=scores.get)
        best_score = scores[best_task]

        elapsed_ms = (time.perf_counter() - t0) * 1000

        # Fallback threshold: if no keywords matched or ambiguous
        if best_score == 0:
            return RoutingDecision(
                task_type="VQA_SINGLE",
                adapter_name="lora_rsvqa_adapter",
                confidence=0.55,
                reasoning="Ambiguous or conversational intent; routed to general VQA fallback in best-effort mode.",
                is_fallback=True,
                latency_ms=round(elapsed_ms, 2),
                benchmark_name="RSVQA (General Fallback)"
            )

        # Confidence heuristic based on match strength
        confidence = min(0.98, 0.75 + (best_score * 0.08))
        cfg = self.routes[best_task]

        return RoutingDecision(
            task_type=best_task,
            adapter_name=cfg["adapter"],
            confidence=round(confidence, 2),
            reasoning=f"Matched domain triggers: {', '.join(matched_kw[best_task])}.",
            is_fallback=False,
            latency_ms=round(elapsed_ms, 2),
            benchmark_name=cfg["benchmark"]
        )

# -----------------------------------------------------------------------------
# Evaluation Harness: Separating Routing Accuracy from Model Answer Accuracy
# -----------------------------------------------------------------------------
def evaluate_routing_benchmark(orchestrator: QueryOrchestrator) -> Dict[str, Any]:
    test_cases = [
        # Referring Expression Grounding
        ("Locate the river bend and return its bounding box.", "GROUNDING_REFEXP"),
        ("Where is the newly cleared deforested parcel?", "GROUNDING_REFEXP"),
        ("Find the water reservoir in the scene.", "GROUNDING_REFEXP"),
        # Change Detection VQA
        ("What changed here since March 2021?", "CHANGE_DETECTION_VQA"),
        ("How much vegetation canopy was lost between the two observations?", "CHANGE_DETECTION_VQA"),
        ("Did the lake recede compared to baseline?", "CHANGE_DETECTION_VQA"),
        # Dense Captioning
        ("Describe this entire satellite scene in detail.", "CAPTIONING"),
        ("Give a dense summary overview of the terrain.", "CAPTIONING"),
        # Single-Image VQA
        ("What is the dominant land cover class?", "VQA_SINGLE"),
        ("Is there any surface water or wetland present in this image?", "VQA_SINGLE"),
        ("What type of conifer forest is shown here?", "VQA_SINGLE"),
    ]

    total = len(test_cases)
    correct = 0
    latencies = []

    print("=" * 65)
    print("SatQuery AI — Orchestrator Routing Evaluation Harness")
    print("=" * 65)

    for query, expected_task in test_cases:
        decision = orchestrator.route_query(query)
        is_match = decision.task_type == expected_task
        if is_match:
            correct += 1
        latencies.append(decision.latency_ms)

        mark = "✓" if is_match else "✗"
        print(f"[{mark}] Query: '{query}'")
        print(f"    Expected: {expected_task:<22} | Routed: {decision.task_type:<22} ({decision.confidence*100:.0f}% conf)")

    accuracy = (correct / total) * 100
    avg_latency = sum(latencies) / len(latencies)

    print("-" * 65)
    print(f"Overall Routing Accuracy:  {accuracy:.1f}% ({correct}/{total})")
    print(f"Average Routing Latency:   {avg_latency:.2f} ms")
    print("=" * 65)

    return {"accuracy": accuracy, "avg_latency_ms": avg_latency}

if __name__ == "__main__":
    orch = QueryOrchestrator()
    evaluate_routing_benchmark(orch)
