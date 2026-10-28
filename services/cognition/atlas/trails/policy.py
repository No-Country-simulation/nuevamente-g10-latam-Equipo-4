"""Pure path rules: no SDK, SQLite or web framework imports."""
from ..errors import ConflictError

FORMATS = ("tutorial", "flashcards", "quiz", "summary")
TITLES = ("Compreender a fonte", "Relembrar as ideias", "Praticar com evidências", "Sintetizar o aprendizado")


def steps(goal):
    return [{"id": f"step_{index + 1}", "title": title, "format": form,
             "goal": f"{title}: {goal}"[:2000], "status": "pending", "package_id": None,
             "completion_evidence": None}
            for index, (title, form) in enumerate(zip(TITLES, FORMATS))]


def available_steps(items):
    unlocked = True
    result = []
    for item in items:
        result.append(item | {"unlocked": unlocked})
        unlocked = unlocked and item["status"] == "completed"
    return result


def selected_step(trail, step_id):
    for step in available_steps(trail["steps"]):
        if step["id"] == step_id:
            if not step["unlocked"]:
                raise ConflictError("Conclua a etapa anterior para continuar.")
            return step
    raise LookupError("Etapa não encontrada.")


def compatible(trail, step, package, original_input):
    expected = {doc["id"]: doc["hash"] for doc in trail["document_refs"]}
    actual = {doc["id"]: doc["hash"] for doc in package["document_refs"]}
    checks = (package["status"] == "ready", actual == expected,
              original_input["format"] == step["format"],
              original_input["profile"] == trail["profile"],
              original_input["agent_id"] == trail["agent_id"],
              original_input["goal"] == step["goal"])
    if not all(checks):
        raise ValueError("O material não corresponde à etapa, às fontes, ao perfil ou ao tutor desta trilha.")
