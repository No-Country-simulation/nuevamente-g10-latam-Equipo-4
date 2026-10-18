import json
import math
import os
from urllib.parse import urlsplit
import httpx

class ProviderError(RuntimeError):
    pass

def llm_ready():
    return bool(os.getenv("EVE_URL") or (os.getenv("LLM_BASE_URL") and os.getenv("LLM_API_KEY") and os.getenv("LLM_MODEL")))

def safe_base(value):
    url = urlsplit(value)
    if url.scheme != "https" or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ProviderError("O endpoint externo deve ser HTTPS sem credenciais na URL.")
    return value.rstrip("/")

def complete(system, prompt):
    if not llm_ready():
        raise ProviderError("Configure o provedor de geração no servidor para usar LLM.")
    if os.getenv("EVE_URL"):
        try:
            response = httpx.post(os.getenv("ATLAS_API_URL", "http://127.0.0.1:4000") + "/v1/internal/generate", json={"system": system, "prompt": prompt}, headers={"Authorization": "Bearer " + os.environ["ATLAS_INTERNAL_TOKEN"]}, timeout=100)
            response.raise_for_status()
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise ProviderError("O runtime Eve não concluiu a geração. Verifique sua configuração no servidor.") from exc
    base = safe_base(os.environ["LLM_BASE_URL"])
    headers = {"Authorization": "Bearer " + os.environ["LLM_API_KEY"]}
    payload = {"model": os.environ["LLM_MODEL"], "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}], "temperature": 0.2, "max_tokens": 2500, "response_format": {"type": "json_object"}}
    try:
        response = httpx.post(base + "/chat/completions", json=payload, headers=headers, timeout=60, follow_redirects=False)
        response.raise_for_status()
        return json.loads(response.json()["choices"][0]["message"]["content"])
    except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
        raise ProviderError("A geração remota falhou ou retornou um formato inválido. Seus documentos foram preservados.") from exc

def embed(texts):
    if not os.getenv("EMBEDDING_API_KEY"):
        return None
    base = safe_base(os.environ["EMBEDDING_BASE_URL"])
    try:
        response = httpx.post(base + "/embeddings", json={"model": os.environ["EMBEDDING_MODEL"], "input": texts}, headers={"Authorization": "Bearer " + os.environ["EMBEDDING_API_KEY"]}, timeout=40, follow_redirects=False)
        response.raise_for_status()
        records = sorted(response.json()["data"], key=lambda item: item["index"])
        vectors = [item["embedding"] for item in records]
        if len(vectors) != len(texts) or not vectors:
            raise ValueError("Invalid embedding count")
        dimension = len(vectors[0])
        if not 32 <= dimension <= 4096 or any(len(v) != dimension or any(not isinstance(x, (int, float)) or not math.isfinite(x) for x in v) for v in vectors):
            raise ValueError("Invalid embedding shape")
        return vectors
    except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
        raise ProviderError("Falha no provedor de embeddings; nenhuma indexação foi anunciada como concluída.") from exc

def judge(question, evidence, answer):
    """Use Nest's verified TypeSafe SDK adapter, not an invented native API payload."""
    if not os.getenv("TYPESAFE_API_KEY"):
        return {"verdict": "not_evaluated", "score": None}
    if len(evidence) > 28000 or len(answer) > 18000:
        raise ProviderError("A resposta excedeu o orçamento de avaliação integral. Nenhum trecho foi cortado ou publicado como verificado.")
    try:
        response = httpx.post(os.getenv("ATLAS_API_URL", "http://127.0.0.1:4000") + "/v1/internal/judge", json={"question": question, "evidence": evidence, "answer": answer}, headers={"Authorization": "Bearer " + os.environ["ATLAS_INTERNAL_TOKEN"]}, timeout=35)
        response.raise_for_status()
        result = response.json()
        if result.get("verdict") not in ("supported", "contradicted", "insufficient_evidence", "not_evaluated"):
            raise ValueError("Invalid judge result")
        return result
    except (httpx.HTTPError, ValueError) as exc:
        raise ProviderError("A avaliação Typesafe está indisponível; o material não foi publicado como verificado.") from exc
