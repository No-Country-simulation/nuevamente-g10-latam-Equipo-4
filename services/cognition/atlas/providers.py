import json
import math
import os
from contextvars import ContextVar
from urllib.parse import urlsplit
import httpx

class ProviderError(RuntimeError):
    status_code = 503

class ProviderBusy(ProviderError):
    status_code = 429

_execution = ContextVar("atlas_generation_execution", default=None)

def runtime_mode():
    mode = os.getenv("ATLAS_AGENT_RUNTIME", "eve")
    if mode not in ("eve", "direct", "extractive"):
        raise ProviderError("ATLAS_AGENT_RUNTIME deve ser eve, direct ou extractive.")
    return mode

def llm_ready():
    mode = runtime_mode()
    return bool(os.getenv("EVE_URL")) if mode == "eve" else bool(mode == "direct" and os.getenv("LLM_BASE_URL") and os.getenv("LLM_API_KEY") and os.getenv("LLM_MODEL"))

def last_execution():
    return _execution.get()

def safe_base(value):
    url = urlsplit(value)
    if url.scheme != "https" or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ProviderError("O endpoint externo deve ser HTTPS sem credenciais na URL.")
    return value.rstrip("/")

def complete(system, prompt, *, agent_id="nilo", purpose="learning"):
    _execution.set(None)
    if not llm_ready():
        raise ProviderError("Configure o provedor de geração no servidor para usar LLM.")
    if runtime_mode() == "eve":
        try:
            response = httpx.post(os.getenv("ATLAS_API_URL", "http://127.0.0.1:4000") + "/v1/internal/generate", json={"system": system, "prompt": prompt, "agent_id": agent_id, "purpose": purpose}, headers={"Authorization": "Bearer " + os.environ["ATLAS_INTERNAL_TOKEN"]}, timeout=100)
            response.raise_for_status()
            result = response.json()
            _execution.set(result["execution"])
            return result["data"]
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 429:
                raise ProviderBusy("Um agente já está trabalhando. Aguarde a conclusão e tente novamente.") from exc
            raise ProviderError("O runtime Eve não concluiu a geração. Verifique sua configuração no servidor.") from exc
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            raise ProviderError("O runtime Eve não concluiu a geração. Verifique sua configuração no servidor.") from exc
    base = safe_base(os.environ["LLM_BASE_URL"])
    headers = {"Authorization": "Bearer " + os.environ["LLM_API_KEY"]}
    payload = {"model": os.environ["LLM_MODEL"], "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}], "temperature": 0.2, "max_tokens": 2500, "response_format": {"type": "json_object"}}
    try:
        response = httpx.post(base + "/chat/completions", json=payload, headers=headers, timeout=60, follow_redirects=False)
        response.raise_for_status()
        result = json.loads(response.json()["choices"][0]["message"]["content"])
        _execution.set({"runtime": "direct", "agent_id": agent_id, "purpose": purpose})
        return result
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


def rank_evidence(question, passages):
    """One bounded TypeSafe decision batch after retrieval; never fabricate scores."""
    if not passages or not os.getenv("TYPESAFE_API_KEY"):
        return passages
    try:
        response = httpx.post(os.getenv("ATLAS_API_URL", "http://127.0.0.1:4000") + "/v1/internal/evidence", json={"question":question,"passages":[{"id":p["id"],"text":p["text"]} for p in passages]}, headers={"Authorization":"Bearer " + os.environ["ATLAS_INTERNAL_TOKEN"]}, timeout=35, follow_redirects=False)
        response.raise_for_status()
        result=response.json()
        if result["source"] != "typesafe":
            return passages
        allowed={p["id"] for p in passages}
        scores={s["id"]:s["score"] for s in result["scores"]}
        if set(scores)!=allowed or any(not isinstance(s,(int,float)) or not math.isfinite(s) or not 0<=s<=1 for s in scores.values()):
            raise ValueError("Invalid evidence decision")
        return sorted((p for p in passages if scores[p["id"]]>0),key=lambda p:scores[p["id"]],reverse=True)
    except (httpx.HTTPError,ValueError,KeyError) as exc:
        raise ProviderError("A avaliação de relevância das fontes não concluiu; não foi anunciado suporte fictício.") from exc


def dispatch_job(job):
    """Trigger.dev's official triggerTask HTTP contract; payload contains IDs only."""
    secret = os.getenv("TRIGGER_SECRET_KEY", "")
    if not secret:
        raise ProviderError("Configure TRIGGER_SECRET_KEY e publique a task atlas-dreamer antes de escolher runner trigger.")
    base = safe_base(os.getenv("TRIGGER_API_URL", "https://api.trigger.dev"))
    try:
        response = httpx.post(base + "/api/v1/tasks/atlas-dreamer/trigger", headers={"Authorization":"Bearer " + secret}, json={"payload":{"job_id":job["id"],"tenant":job["tenant"]},"options":{"idempotencyKey":job["id"]}}, timeout=15, follow_redirects=False)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data.get("id"), str):
            raise ValueError("Invalid Trigger receipt")
        return {"id":data["id"],"provider":"trigger"}
    except (httpx.HTTPError,ValueError) as exc:
        raise ProviderError("O job continua salvo localmente, mas o despacho Trigger não concluiu. Tente novamente com a mesma chave de idempotência.") from exc
