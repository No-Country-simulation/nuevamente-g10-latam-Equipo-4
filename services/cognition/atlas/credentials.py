"""Shared encrypted provider configuration. Never return keys to HTTP clients."""
import base64
import json
import os
from pathlib import Path
from contextvars import ContextVar

_snapshot=ContextVar("atlas_provider_snapshot",default=None)
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class CredentialError(RuntimeError):
    pass

def secret(name):
    file = os.getenv(name + '_FILE')
    if file:
        try:
            data = Path(file).read_bytes()
            if len(data)>16384: raise ValueError()
            return data.decode().strip()
        except Exception:
            raise CredentialError('Segredo gerenciado indisponível no servidor.') from None
    return os.getenv(name, '')

def profiles():
    cached=_snapshot.get()
    if cached is not None: return cached
    path=Path(os.getenv('ATLAS_CREDENTIALS_FILE') or Path(os.getenv('ATLAS_DATA_DIR','data'))/'credentials/providers.enc')
    if not path.exists(): return {}
    try:
        raw=path.read_bytes()
        if len(raw)>65536: raise ValueError()
        envelope=json.loads(raw)
        if envelope['version']!=1: raise ValueError()
        key=base64.b64decode(secret('ATLAS_CREDENTIAL_MASTER_KEY'),validate=True)
        if len(key)!=32: raise ValueError()
        tenant=os.getenv('ATLAS_TENANT_ID','local-workspace')
        payload=AESGCM(key).decrypt(base64.b64decode(envelope['iv']),base64.b64decode(envelope['data'])+base64.b64decode(envelope['tag']),('atlas-credentials:v1:'+tenant).encode())
        value=json.loads(payload)
        if value['tenant']!=tenant or value['version']!=1: raise ValueError()
        return value['profiles']
    except Exception:
        raise CredentialError('Cofre indisponível. Verifique a chave mestra e o volume no servidor.') from None

def connection(slot):
    profile=profiles().get(slot)
    if profile: return profile
    if slot in ('decision','search'):
        return {'key':secret('TYPESAFE_API_KEY' if slot=='decision' else 'FIRECRAWL_API_KEY')}
    if slot=='generation' and os.getenv('ATLAS_AGENT_RUNTIME','eve')=='eve':
        provider=os.getenv('EVE_MODEL_PROVIDER','gateway')
        variable={'gateway':'AI_GATEWAY_API_KEY','openai':'ATLAS_OPENAI_API_KEY','openrouter':'OPENROUTER_API_KEY','anthropic':'ANTHROPIC_API_KEY','chatgpt_local':'ATLAS_UNUSED_KEY'}.get(provider,'AI_GATEWAY_API_KEY')
        return {'provider':provider,'key':secret(variable),'model':os.getenv('EVE_MODEL',''),'base_url':''}
    prefix='EMBEDDING' if slot=='embeddings' else 'LLM'
    return {'provider':'compatible','key':secret(prefix+'_API_KEY'),'base_url':os.getenv(prefix+'_BASE_URL',''),'model':os.getenv(prefix+'_MODEL','')}

def configured(slot):
    value=connection(slot)
    return bool(value.get('key')) and (slot not in ('generation','embeddings') or bool(value.get('model')))

def embedding_id():
    value=connection('embeddings')
    return f"remote:{value['base_url']}:{value['model']}" if value.get('key') else 'local_hash_demo_v1'


def scoped(function, *args):
    """Keep an ingestion/generation on one provider configuration until it ends."""
    snapshot=profiles()
    # Snapshot env/file-backed secrets too; mounted secret rotation cannot mix a batch.
    for slot in ('generation','embeddings','decision','search'):
        if slot not in snapshot:
            snapshot[slot]=connection(slot)
    token=_snapshot.set(snapshot)
    try:
        return function(*args)
    finally:
        _snapshot.reset(token)
