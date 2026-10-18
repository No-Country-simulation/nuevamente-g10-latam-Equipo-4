import asyncio
import hashlib
import hmac
import json
import os
from contextlib import asynccontextmanager
from fastapi import BackgroundTasks, Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from . import providers
from .dreamer import Dreamer
from .learning import generate, attempt
from .models import Generation, Attempt, Consent, GroupInput, MessageInput, Rollback, Experience
from .rag import ingest
from .store import Store, uid, now

store = Store()
dreamer = Dreamer(store)
work = asyncio.Semaphore(1)
AGENTS = [
    {"id": "nilo", "name": "Nilo", "role": "Tutor", "description": "Uma ideia de cada vez, com clareza.", "color": "#74D8F7"},
    {"id": "lumi", "name": "Lumi", "role": "Exploradora", "description": "Conexões curiosas, limites explícitos.", "color": "#85E7B8"},
    {"id": "prisma", "name": "Prisma", "role": "Revisor", "description": "Toda afirmação precisa de evidência.", "color": "#F4B46A"},
    {"id": "fio", "name": "Fio", "role": "Criador", "description": "Conhecimento em formatos para praticar.", "color": "#FA8C83"},
    {"id": "soma", "name": "Soma", "role": "Coach", "description": "Aprender com continuidade e sem pressão.", "color": "#C5A7F5"},
]

def identity(authorization: str = Header(default=""), x_atlas_tenant: str = Header(default="")):
    token = os.getenv("ATLAS_INTERNAL_TOKEN", "")
    if not token or not hmac.compare_digest(authorization, "Bearer " + token):
        raise HTTPException(401, "Acesso interno não autorizado.")
    if not x_atlas_tenant or len(x_atlas_tenant) > 100:
        raise HTTPException(400, "Workspace ausente ou inválido.")
    return x_atlas_tenant

async def limited(function, *args):
    if work.locked():
        raise HTTPException(429, "Há uma tarefa em andamento. Aguarde a conclusão e tente novamente.")
    async with work:
        return await run_in_threadpool(function, *args)

def background_cycle(tenant, cycle_id, epoch=None):
    if epoch is not None and epoch != dreamer.epochs.get(tenant, 0):
        return
    try:
        dreamer.cycle(tenant, cycle_id)
    except Exception:
        # The cycle itself persists a safe failure; never log provider responses/keys.
        pass

async def dream_schedule():
    while True:
        await asyncio.sleep(max(60, int(os.getenv("DREAMER_INTERVAL_SECONDS", "3600"))))
        tenant = os.getenv("ATLAS_TENANT_ID", "local-workspace")
        state = dreamer.status(tenant)
        if state["consent"] and state["events"] >= 3 and providers.llm_ready() and os.getenv("TYPESAFE_API_KEY"):
            await run_in_threadpool(background_cycle, tenant, uid("dream"))

@asynccontextmanager
async def lifespan(app):
    if os.getenv("ATLAS_APP_MODE", "local") != "local":
        raise RuntimeError("Autenticação pública ainda não implementada. Use modo local, somente em loopback.")
    if not os.getenv("ATLAS_INTERNAL_TOKEN"):
        raise RuntimeError("ATLAS_INTERNAL_TOKEN precisa ser configurado no servidor.")
    tenant = os.getenv("ATLAS_TENANT_ID", "local-workspace")
    if os.getenv("ATLAS_SEED_DEMO", "1") == "1" and not store.documents(tenant):
        sample = """# Primeiros passos em redes na OCI

Uma Virtual Cloud Network (VCN) é uma rede virtual privada configurável na Oracle Cloud Infrastructure. Sub-redes organizam recursos dentro da VCN. Uma sub-rede pública pode possuir acesso por Internet Gateway quando rotas e regras de segurança permitem.

## Acesso e segurança
Security Lists definem regras de entrada e saída de tráfego. Para administração por SSH, a porta TCP 22 deve ser restrita a origens autorizadas. Uma regra com origem 0.0.0.0/0 permite origens de qualquer endereço IPv4 e não é uma boa restrição para acesso administrativo.

## Recursos privados
Um NAT Gateway permite conexões de saída para a internet a partir de recursos em sub-redes privadas, sem permitir conexões iniciadas diretamente pela internet. Rotas e regras continuam necessárias.

## Guardar materiais de estudo
OCI Object Storage armazena documentos e pacotes JSON em buckets. Bibliotecas privadas precisam de controle de acesso. Nesta amostra de estudo, os arquivos só serão enviados à OCI quando o serviço e as credenciais estiverem configurados.

Fonte demonstrativa escrita pela equipe Atlas, não um PDF oficial da Oracle. Confira a documentação oficial antes de operar infraestrutura real.
"""
        await run_in_threadpool(ingest, store, tenant, "Primeiros passos na OCI.md", sample.encode())
    scheduler = asyncio.create_task(dream_schedule())
    yield
    scheduler.cancel()
    try:
        await scheduler
    except asyncio.CancelledError:
        pass

app = FastAPI(title="Atlas Cognition & Dreamer", version="0.1.0", lifespan=lifespan)

@app.exception_handler(ValueError)
async def validation_error(request, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc)[:500]})

@app.exception_handler(LookupError)
async def missing(request, exc):
    return JSONResponse(status_code=404, content={"detail": str(exc)})

@app.exception_handler(providers.ProviderError)
async def provider_failed(request, exc):
    return JSONResponse(status_code=503, content={"detail": str(exc)})

@app.exception_handler(Exception)
async def internal_error(request, exc):
    return JSONResponse(status_code=500, content={"detail": "Não foi possível concluir a operação. Seus dados anteriores foram preservados."})

@app.get("/health")
def health():
    return {"status": "ok", "service": "cognition"}

@app.get("/v1/bootstrap")
def bootstrap(tenant=Depends(identity)):
    return {"agents": AGENTS, "documents": store.documents(tenant), "progress": store.progress(tenant), "groups": store.groups(tenant), "capabilities": {"llm": "remote" if providers.llm_ready() else "extractive_demo", "embeddings": "remote" if os.getenv("EMBEDDING_API_KEY") else "local_hash_demo", "web_search": bool(os.getenv("FIRECRAWL_API_KEY")), "storage": os.getenv("STORAGE_PROVIDER", "local"), "deployment": "local"}}

@app.get("/v1/documents")
def documents(tenant=Depends(identity)):
    return store.documents(tenant)

@app.post("/v1/documents", status_code=201)
async def upload(file: UploadFile = File(), tenant=Depends(identity)):
    data = await file.read(10 * 1024**2 + 1)
    return await limited(ingest, store, tenant, file.filename or "documento.txt", data)

@app.get("/v1/documents/{doc_id}/source")
def source(doc_id: str, tenant=Depends(identity)):
    return store.source(tenant, doc_id)

@app.post("/v1/generations")
async def generation(request: Generation, tenant=Depends(identity)):
    return await limited(generate, store, tenant, request)

@app.post("/v1/chat")
async def chat(request: Generation, tenant=Depends(identity)):
    epoch = dreamer.epochs.get(tenant, 0)
    snapshot = store.memory_state(tenant)
    consent = snapshot["enabled"]
    with store.db() as db:
        rows = db.execute("SELECT agent_id,role,text FROM conversations WHERE tenant=? AND (? OR agent_id=?) ORDER BY created_at DESC LIMIT 8", (tenant, int(consent), request.agent_id)).fetchall()
    request.conversation_context = "\n".join(f"{r['agent_id']} / {r['role']}: {r['text']}" for r in reversed(rows))[-8000:]
    result = await limited(generate, store, tenant, request, snapshot)
    with dreamer.state_lock, store.db() as db:
        if epoch != dreamer.epochs.get(tenant, 0):
            return result
        for role, text in (("user", request.goal), ("assistant", result["conteudo_adaptado"]["introducao_contextualizada"])):
            db.execute("INSERT INTO conversations VALUES(?,?,?,?,?,?)", (tenant, uid("turn"), request.agent_id, role, text[:2000], now()))
        db.execute("DELETE FROM conversations WHERE tenant=? AND id NOT IN (SELECT id FROM conversations WHERE tenant=? ORDER BY created_at DESC LIMIT 100)", (tenant, tenant))
    return result

@app.post("/v1/quiz/{package_id}/attempt")
def submit(package_id: str, request: Attempt, tenant=Depends(identity)):
    return attempt(store, tenant, package_id, request)

@app.get("/v1/progress")
def progress(tenant=Depends(identity)):
    return store.progress(tenant)

@app.get("/v1/groups")
def groups(tenant=Depends(identity)):
    return store.groups(tenant)

@app.post("/v1/groups", status_code=201)
def create_group(request: GroupInput, tenant=Depends(identity)):
    group_id = uid("group")
    with store.db() as db:
        db.execute("INSERT INTO groups VALUES(?,?,?,?,?)", (tenant, group_id, request.name, request.topic, now()))
    return next(group for group in store.groups(tenant) if group["id"] == group_id)

@app.get("/v1/groups/{group_id}/messages")
def messages(group_id: str, tenant=Depends(identity)):
    store.group_exists(tenant, group_id)
    with store.db() as db:
        rows = db.execute("SELECT id,group_id,text,created_at FROM (SELECT * FROM messages WHERE tenant=? AND group_id=? ORDER BY created_at DESC LIMIT 100) ORDER BY created_at", (tenant, group_id)).fetchall()
    return [dict(row) | {"author": "Você"} for row in rows]

@app.post("/v1/groups/{group_id}/messages", status_code=201)
def message(group_id: str, request: MessageInput, tenant=Depends(identity)):
    store.group_exists(tenant, group_id)
    result = {"id": uid("msg"), "group_id": group_id, "text": request.text, "created_at": now(), "author": "Você"}
    with store.db() as db:
        db.execute("INSERT INTO messages VALUES(?,?,?,?,?)", (tenant, result["id"], group_id, request.text, result["created_at"]))
    return result

@app.get("/v1/dreamer/status")
def dream_status(tenant=Depends(identity)):
    return dreamer.status(tenant)

@app.post("/v1/dreamer/consent")
def dream_consent(request: Consent, tenant=Depends(identity)):
    return dreamer.consent(tenant, request.enabled)

@app.post("/v1/dreamer/experiences", status_code=201)
def experience(request: Experience, tenant=Depends(identity)):
    if not dreamer.status(tenant)["consent"]:
        raise HTTPException(403, "Memória sem consentimento.")
    replay = request.payload.get("replay")
    if replay:
        Generation.model_validate(replay["input"])
        package = replay["package"]
        if not isinstance(package.get("id"), str) or not package.get("conteudo_adaptado", {}).get("itens"):
            raise ValueError("Caso de replay inválido.")
    stored = store.event(tenant, request.kind, request.payload, request.revision)
    if not stored:
        raise HTTPException(403, "Consentimento revogado antes da gravação.")
    return {"stored": True}

@app.delete("/v1/dreamer/memory")
def forget(tenant=Depends(identity)):
    return dreamer.forget(tenant)

@app.post("/v1/dreamer/rollback")
def rollback(request: Rollback, tenant=Depends(identity)):
    return dreamer.rollback(tenant, request.version)

@app.post("/v1/dreamer/cycles", status_code=202)
def cycle(background: BackgroundTasks, tenant=Depends(identity)):
    cycle_id = uid("dream")
    if not providers.llm_ready() or not os.getenv("TYPESAFE_API_KEY"):
        return dreamer.cycle(tenant, cycle_id)
    with dreamer.state_lock:
        epoch = dreamer.epochs.get(tenant, 0)
        result = dreamer.record(tenant, cycle_id, "queued", "Ciclo enfileirado; acompanhe a avaliação pelo painel.")
    background.add_task(background_cycle, tenant, cycle_id, epoch)
    return result
