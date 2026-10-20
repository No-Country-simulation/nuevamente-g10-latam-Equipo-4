"""The same checked-in persona catalog is consumed by Nest, Eve and bootstrap."""
import json
import os
from pathlib import Path

def load_catalog():
    configured = os.getenv("ATLAS_AGENT_CATALOG")
    candidates = [Path(configured)] if configured else [parent / "packages/contracts/agents.json" for parent in Path(__file__).resolve().parents]
    for path in candidates:
        if path.is_file():
            return json.loads(path.read_text())
    raise RuntimeError("Catálogo de agentes ausente. Verifique o pacote contracts na instalação.")

CATALOG = load_catalog()
AGENTS = [{key: item[key] for key in ("id", "name", "role", "description", "color")} for item in CATALOG["agents"]]
PERSONAS = {item["id"]: f"{item['name']}, {item['persona']}: {item['instruction']}" for item in CATALOG["agents"]}
