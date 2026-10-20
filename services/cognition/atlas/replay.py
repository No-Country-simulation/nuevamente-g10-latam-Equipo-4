"""Bounded adaptation of Dream-RSI section 3. Replay never invokes providers.

A recorded tree is revealed progressively. Unknown children are unsupported,
not synthetic evidence. W=1; no parallelism bonus on the 4 GB deployment.
"""
from typing import Literal
from pydantic import Field
from .models import StrictModel

class Exploration(StrictModel):
    branching: Literal["breadth_first", "depth_first", "best_leaf"] = "depth_first"
    max_rounds: int = Field(default=2, ge=1, le=2)
    stop_score: float = Field(default=0.85, ge=0.5, le=1.0)

class Policy(StrictModel):
    preferred_method: Literal["socratic", "feynman", "first_principles", "warburg"]
    step_size: Literal["short", "medium"]
    question_first: bool
    exploration: Exploration = Field(default_factory=Exploration)

BASELINE = Policy(preferred_method="feynman", step_size="short", question_first=False).model_dump()

def choose_parent(observed, policy):
    if not observed or policy.branching == "breadth_first":
        return "root"
    parents = {node["parent"] for node in observed}
    leaves = [node for node in observed if node["id"] not in parents]
    if policy.branching == "best_leaf":
        return max(leaves, key=lambda node: node["score"])["id"]
    return leaves[-1]["id"]

def simulate(world, raw_policy):
    """Same bounded decision interface as online rollout; outcomes stay hidden."""
    policy = Exploration.model_validate(raw_policy)
    recorded = world["nodes"]
    observed, covered = [], True
    for _ in range(policy.max_rounds):
        if observed and max(n["score"] for n in observed) >= policy.stop_score:
            break
        if len(observed) == len(recorded):
            break
        parent = choose_parent(observed, policy)
        seen = {n["id"] for n in observed}
        child = next((n for n in recorded if n["parent"] == parent and n["id"] not in seen), None)
        if child is None:
            covered = False
            break
        # Score/provenance are recorded by the fixed online evaluator, not a dream.
        if child.get("verdict") != "supported" or not isinstance(child.get("score"), (int, float)) or not 0 <= child["score"] <= 1:
            raise ValueError("Replay world has no grounded evaluator outcome")
        observed.append(child)
    best = max((n["score"] for n in observed), default=0)
    return {"utility": best - 0.03 * sum(n.get("requests", 1) for n in observed), "best_score": best, "attempts": len(observed), "covered": covered, "visited": [n["id"] for n in observed]}

def compare(worlds, baseline, candidate):
    pairs = [(simulate(w, baseline), simulate(w, candidate)) for w in worlds]
    before = sum(a["utility"] for a, _ in pairs) / len(pairs)
    after = sum(b["utility"] for _, b in pairs) / len(pairs)
    return {"baseline": before, "candidate": after, "no_regression": all(b["utility"] >= a["utility"] for a, b in pairs), "no_quality_regression": all(b["best_score"] >= a["best_score"] for a,b in pairs), "covered": all(a["covered"] and b["covered"] for a,b in pairs), "cases": len(pairs)}
