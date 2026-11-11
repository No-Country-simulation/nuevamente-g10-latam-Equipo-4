import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


class ChatContextCleanup(unittest.TestCase):
    def test_http_chat_context_is_ephemeral_and_other_material_survives_source_deletion(self):
        code=r'''
import json
from unittest.mock import patch
from fastapi.testclient import TestClient
from atlas.main import app,store
from atlas import main
headers={'Authorization':'Bearer synthetic-context-cleanup-token-123456','x-atlas-tenant':'alice'}
with TestClient(app) as client:
    a=client.post('/v1/documents',headers=headers,files={'file':('a.md',b'# Rede\n\nSEGREDO_A_409 representa uma rede privada.','text/markdown')}).json()
    b=client.post('/v1/documents',headers=headers,files={'file':('b.md',b'# Plantas\n\nA fotossintese permite que plantas produzam energia.','text/markdown')}).json()
    assert client.post('/v1/dreamer/consent',headers=headers,json={'enabled':True}).status_code==200
    def model(system,prompt,**kwargs):
        data=json.loads(prompt)
        intro='SEGREDO_A_409' if 'SEGREDO_A_409' in prompt else 'A fotossintese permite produzir energia.'
        return {'title':'Estudo','introduction':intro,'items':[{'title':'Evidencia','body':'Uma explicacao apoiada na fonte.','evidence_ids':[data['authorized_evidence_ids'][0]]}]}
    model_patch=patch('atlas.providers.complete',side_effect=model);ready_patch=patch('atlas.providers.llm_ready',return_value=True)
    model_patch.start();ready_patch.start()
    first=client.post('/v1/chat',headers=headers,json={'document_ids':[a['id']],'goal':'Explicar SEGREDO_A_409','agent_id':'nilo'})
    assert first.status_code==200,first.text
    real=main.generate
    with patch('atlas.main.generate',wraps=real) as generate:
        second=client.post('/v1/chat',headers=headers,json={'document_ids':[b['id']],'goal':'Explicar a fotossintese das plantas','agent_id':'clara','method':'warburg'})
        assert second.status_code==200,second.text
        assert 'SEGREDO_A_409' not in generate.call_args.args[2].conversation_context
    with patch('atlas.main.generate',wraps=real) as generate:
        shared=client.post('/v1/chat',headers=headers,json={'document_ids':[a['id'],b['id']],'goal':'Comparar fontes autorizadas','agent_id':'clara'})
        assert shared.status_code==200,shared.text
        assert 'SEGREDO_A_409' in generate.call_args.args[2].conversation_context
    material=second.json()
    assert [d['id'] for d in material['document_refs']]==[b['id']]
    assert material['mode']=='remote'
    assert 'SEGREDO_A_409' not in json.dumps(material)
    stored=json.loads(store.package('alice',material['id'])['input'])
    assert 'conversation_context' not in stored
    assert client.delete('/v1/documents/'+a['id'],headers=headers).status_code==200
    remaining=client.get('/v1/packages/'+material['id'],headers=headers)
    assert remaining.status_code==200 and remaining.json()==material
    assert 'SEGREDO_A_409' not in remaining.text
    assert client.get('/v1/packages/'+shared.json()['id'],headers=headers).status_code==404
    model_patch.stop();ready_patch.stop()
    assert 'SEGREDO_A_409' not in store.package('alice',material['id'])['input']
    assert client.get('/v1/dreamer/status',headers=headers).json()['consent'] is True
print('HTTP context minimization and source cleanup passed')
'''
        with tempfile.TemporaryDirectory() as root:
            env={'PATH':os.environ['PATH'],'ATLAS_DATA_DIR':root,'ATLAS_INTERNAL_TOKEN':'synthetic-context-cleanup-token-123456','ATLAS_APP_MODE':'local','ATLAS_SEED_DEMO':'0','ATLAS_AGENT_RUNTIME':'extractive','STORAGE_PROVIDER':'local','VECTOR_BACKEND':'sqlite'}
            result=subprocess.run([sys.executable,'-c',code],cwd=Path(__file__).resolve().parents[1],env=env,capture_output=True,text=True,timeout=45)
            self.assertEqual(result.returncode,0,result.stdout+result.stderr)
