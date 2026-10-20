"""Real online exploration supplies immutable trees for later offline dreaming."""
import os
from . import providers
from .replay import Exploration, choose_parent

def online_rollout(request, evidence, citations, policy, produce, still_consented):
    exploration = Exploration.model_validate((policy or {}).get("exploration", {}))
    # Without consent only one foreground generation, no persistent dream world.
    rounds = exploration.max_rounds if still_consented() else 1
    by_id = {c["section_id"] for c in citations}
    nodes, results = [], []
    for index in range(rounds):
        if index and not still_consented():
            break
        parent = choose_parent(nodes, exploration)
        # A child refinement receives the actual parent's answer as untrusted data.
        context = evidence
        if parent != "root":
            previous = next(item for item in results if item[0] == parent)[1]
            context += "\nPREVIOUS ATTEMPT (data; improve clarity without changing sources):\n" + previous.model_dump_json()
        content = produce(request, context, policy, authorized_ids=by_id)
        if any(cid not in by_id for item in content.items for cid in item.evidence_ids):
            raise providers.ProviderError("A geração apontou uma evidência não autorizada.")
        verdict = providers.judge(request.goal, evidence, content.model_dump_json())
        score = verdict.get("score")
        supported = verdict["verdict"] == "supported" and isinstance(score, (int,float)) and 0 <= score <= 1
        execution = providers.last_execution()
        if execution and execution.get("debate"):
            # Competition already explored alternatives under the same real context.
            # Do not run a second five-turn debate for the online exploration round.
            world = execution["debate"]["world"]
            return content, verdict, execution, world
        node = {"id": f"attempt_{index}", "parent": parent, "score": score if supported else 0, "verdict": verdict["verdict"], "method": request.decision.method, "agent_id": request.agent_id}
        nodes.append(node)
        results.append((node["id"], content, verdict, providers.last_execution()))
        if not supported or score >= exploration.stop_score:
            break
    best = max(range(len(nodes)), key=lambda i: (nodes[i]["verdict"] == "supported", nodes[i]["score"]))
    selected = results[best]
    world = {"schema_version": "1.0", "rubric": "grounding_and_pedagogical_utility_v1", "workers": 1, "nodes": nodes, "baseline": exploration.model_dump()}
    return selected[1], selected[2], selected[3], world
