import json
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from atlas import credentials, providers
from atlas.store import Store
from atlas.rag import ingest
from atlas.learning import generate
from atlas.models import Generation

class LocalPlanTests(unittest.TestCase):
    def test_actual_generation_uses_only_loopback_broker_and_keeps_backend_validation(self):
        calls=[]
        class Handler(BaseHTTPRequestHandler):
            def log_message(self,*args): pass
            def do_POST(self):
                payload=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                calls.append((self.path,self.headers['Authorization'],payload))
                prompt=json.loads(payload['messages'][1]['content'])
                result={'title':'Redes','introduction':'Uma rede conecta recursos.', 'items':[{'title':'VCN','body':'Uma VCN permite organizar sub-redes.', 'evidence_ids':[prompt['authorized_evidence_ids'][0]]}]}
                body=json.dumps({'choices':[{'message':{'content':json.dumps(result)}}]}).encode()
                self.send_response(200);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        env={'ATLAS_AGENT_RUNTIME':'direct','ATLAS_LOCAL_CHATGPT_PLAN':'1','LLM_BASE_URL':f'http://127.0.0.1:{server.server_port}/v1','LLM_API_KEY':'synthetic-broker-capability','LLM_MODEL':'test-model','STORAGE_PROVIDER':'local'}
        try:
            with tempfile.TemporaryDirectory() as root,patch.dict(os.environ,env,clear=True):
                store=Store(root);doc=ingest(store,'test','redes.md',b'# Redes\n\nUma VCN permite organizar sub-redes e regras de acesso.')
                result=generate(store,'test',Generation(document_ids=[doc['id']],goal='Explicar VCN e sub-redes'))
                self.assertEqual(result['mode'],'remote');self.assertEqual(result['status'],'ready')
                self.assertEqual(result['conteudo_adaptado']['itens'][0]['citations'][0]['document_id'],doc['id'])
                self.assertEqual(result['quality']['judge_verdict'],'not_evaluated')
                self.assertEqual(len(calls),1);self.assertEqual(calls[0][0],'/v1/chat/completions')
                self.assertEqual(calls[0][1],'Bearer synthetic-broker-capability');self.assertEqual(calls[0][2]['max_tokens'],2500)
        finally:server.shutdown();server.server_close();thread.join()

    def test_plan_rejects_external_or_missing_broker_and_never_falls_back_to_paid_key(self):
        env={'ATLAS_AGENT_RUNTIME':'direct','ATLAS_LOCAL_CHATGPT_PLAN':'1','LLM_MODEL':'test-model','LLM_API_KEY':'synthetic-capability','OPENROUTER_API_KEY':'synthetic-paid-key'}
        with patch.dict(os.environ,env,clear=True):
            for url in ['https://api.openai.com/v1','http://localhost:1234/v1','http://127.0.0.1:1234/other','http://user@127.0.0.1:1234/v1','']:
                os.environ['LLM_BASE_URL']=url
                with self.assertRaises(credentials.CredentialError):providers.llm_ready()
            os.environ['LLM_BASE_URL']='http://127.0.0.1:1234/v1';os.environ['LLM_API_KEY']=''
            with self.assertRaises(credentials.CredentialError):providers.llm_ready()
        with self.assertRaises(providers.ProviderError):providers.safe_base('http://127.0.0.1:1234/v1')
