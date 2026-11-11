import os
import tempfile
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from atlas import main, providers
from atlas.jobs import Jobs
from atlas.store import Store

class JobHttpTests(unittest.TestCase):
    def test_runner_header_cannot_replace_persisted_job_tenant(self):
        observed=[]
        class Dreamer:
            def cycle(self,tenant,job_id):
                observed.append((tenant,providers.internal_headers()['x-atlas-tenant']))
                return {'status':'completed'}
        with tempfile.TemporaryDirectory() as directory:
            jobs=Jobs(Store(directory))
            alice=jobs.enqueue('alice','a');bob=jobs.enqueue('bob','b')
            env={'ATLAS_JOB_RUNNER_TOKEN':'runner-secret-123456789012345','ATLAS_INTERNAL_TOKEN':'internal-secret'}
            with patch.dict(os.environ,env),patch.object(main,'jobs',jobs),patch.object(main,'dreamer',Dreamer()):
                client=TestClient(main.app)
                url=f"/v1/internal/jobs/{alice['id']}/run"
                self.assertEqual(client.post(url,headers={'Authorization':'Bearer wrong'}).status_code,401)
                headers={'Authorization':'Bearer '+env['ATLAS_JOB_RUNNER_TOKEN'],'x-atlas-tenant':'bob'}
                self.assertEqual(client.post(url,headers=headers).json()['status'],'completed')
                headers['x-atlas-tenant']='alice'
                self.assertEqual(client.post(f"/v1/internal/jobs/{bob['id']}/run",headers=headers).json()['status'],'completed')
            self.assertEqual(observed,[('alice','alice'),('bob','bob')])
