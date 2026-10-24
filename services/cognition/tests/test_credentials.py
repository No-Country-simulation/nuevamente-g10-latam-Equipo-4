import base64
import json
import os
import tempfile
import unittest
import sys
from pathlib import Path
from unittest.mock import patch
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from atlas import credentials, providers
from atlas.metadata import learning_metadata
from atlas.models import Generation

class CredentialTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.path=Path(self.temp.name)/'providers.enc'
        self.key=os.urandom(32)
        self.env=patch.dict(os.environ,{'ATLAS_TENANT_ID':'unit','ATLAS_CREDENTIALS_FILE':str(self.path),'ATLAS_CREDENTIAL_MASTER_KEY':base64.b64encode(self.key).decode(),'ATLAS_AGENT_RUNTIME':'direct'},clear=True)
        self.env.start()
    def tearDown(self):
        self.env.stop();self.temp.cleanup()
    def write(self,model='model-one'):
        iv=os.urandom(12)
        value={'version':1,'tenant':'unit','profiles':{'generation':{'key':'unit-private-key','model':model,'base_url':'https://api.example/v1','provider':'openai'},'embeddings':{'key':'embedding-private-key','model':model,'base_url':'https://api.example/v1'}}}
        encrypted=AESGCM(self.key).encrypt(iv,json.dumps(value).encode(),b'atlas-credentials:v1:unit')
        self.path.write_text(json.dumps({'version':1,'iv':base64.b64encode(iv).decode(),'data':base64.b64encode(encrypted[:-16]).decode(),'tag':base64.b64encode(encrypted[-16:]).decode()}))
    def test_profile_is_used_by_actual_generation_adapter_without_exporting_key(self):
        self.write()
        response=unittest.mock.Mock();response.json.return_value={'choices':[{'message':{'content':'{"title":"ok"}'}}]}
        with patch('atlas.providers.httpx.post',return_value=response) as post:
            self.assertEqual(providers.complete('system','prompt'),{'title':'ok'})
            self.assertEqual(post.call_args.kwargs['headers']['Authorization'],'Bearer unit-private-key')
            self.assertEqual(post.call_args.kwargs['json']['model'],'model-one')
    def test_snapshot_prevents_mixed_embedding_models_during_rotation(self):
        self.write()
        def operation():
            first=credentials.embedding_id();self.write('model-two')
            self.assertEqual(credentials.embedding_id(),first)
        credentials.scoped(operation)
        self.assertIn('model-two',credentials.embedding_id())
    def test_wrong_tenant_and_missing_master_never_fallback_to_environment(self):
        self.write()
        with patch.dict(os.environ,{'ATLAS_TENANT_ID':'other','LLM_API_KEY':'fallback'}):
            with self.assertRaises(credentials.CredentialError):credentials.connection('generation')
        with patch.dict(os.environ,{'ATLAS_CREDENTIAL_MASTER_KEY':''}):
            with self.assertRaises(credentials.CredentialError):credentials.connection('generation')
    def test_secret_file_priority_and_default_without_embedding_provider(self):
        secret=Path(self.temp.name)/'secret';secret.write_text('file-value\n')
        with patch.dict(os.environ,{'TYPESAFE_API_KEY_FILE':str(secret),'TYPESAFE_API_KEY':'env-value'}):self.assertEqual(credentials.connection('decision')['key'],'file-value')
        self.assertEqual(credentials.embedding_id(),'local_hash_demo_v1')
        self.assertIsNone(providers.embed(['texto']))
    def test_educational_metadata_is_grounded_and_estimation_is_labeled(self):
        request=Generation(document_ids=['doc_'+'a'*20],goal='Entender VCN',format='quiz')
        package={'conteudo_adaptado':{'introducao_contextualizada':'Texto','itens':[{'body':'Pergunta sobre VCN'}]}}
        result=learning_metadata(request,package,[{'excerpt':'# Rede VCN\nUma VCN usa NAT.'}])
        self.assertIn('VCN',result['conceitos_chave']);self.assertGreaterEqual(result['tempo_estimado_estudo_minutos'],1)
        self.assertEqual(result['pre_requisitos'],[]);self.assertEqual(result['pre_requisitos_status'],'nao_inferidos')
        self.assertIn('heuristica',result['estimativa_metodo'])
