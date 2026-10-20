import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from atlas.replay import Exploration, simulate, compare, BASELINE
from atlas.store import Store
from atlas.dreamer import Dreamer
from atlas.jobs import Jobs
from atlas import providers

WORLD={"nodes":[{"id":"a","parent":"root","score":0.66,"verdict":"supported","requests":2},{"id":"b","parent":"a","score":0.66,"verdict":"supported","requests":2}]}
class ReplayAndJobsTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.env=patch.dict(os.environ,{"MEMORY_SERVICE_URL":"","STORAGE_PROVIDER":"local","TYPESAFE_API_KEY":"","EVE_URL":"","ATLAS_AGENT_RUNTIME":"eve"});self.env.start();self.addCleanup(self.env.stop)
        self.store=Store(self.tmp.name);self.dream=Dreamer(self.store);self.jobs=Jobs(self.store)
    def test_replay_reads_recorded_outcomes_without_agent_or_judge_execution(self):
        with patch('atlas.providers.complete') as generate,patch('atlas.providers.judge') as judge:
            baseline=simulate(WORLD,BASELINE['exploration'])
            candidate=simulate(WORLD,{"branching":"depth_first","max_rounds":1,"stop_score":0.5})
        self.assertEqual(baseline['visited'],['a','b']);self.assertEqual(candidate['visited'],['a'])
        self.assertGreater(candidate['utility'],baseline['utility']);generate.assert_not_called();judge.assert_not_called()
    def test_unrecorded_branch_is_uncovered_and_not_invented(self):
        result=simulate(WORLD,{"branching":"breadth_first","max_rounds":2,"stop_score":1})
        self.assertFalse(result['covered']);self.assertEqual(result['visited'],['a'])
    def test_efficiency_cannot_hide_a_quality_regression(self):
        world={"nodes":[{**WORLD['nodes'][0],"score":0.5},{**WORLD['nodes'][1],"score":1}]}
        report=compare([world],BASELINE['exploration'],{"branching":"depth_first","max_rounds":1,"stop_score":0.5})
        self.assertFalse(report['no_quality_regression'])
    def test_job_deduplication_lease_recovery_and_terminal_status(self):
        self.dream.consent('alice',True)
        first=self.jobs.enqueue('alice','request-1');second=self.jobs.enqueue('alice','request-1')
        self.assertEqual(first['id'],second['id'])
        claimed=self.jobs.claim(clock=10);self.assertEqual(claimed['attempts'],1)
        self.assertIsNone(self.jobs.claim(clock=11))
        # A new worker object sees the same durable state after lease expiration.
        recovered=Jobs(self.store).claim(clock=1211);self.assertEqual(recovered['id'],first['id']);self.assertEqual(recovered['attempts'],2)
        self.jobs.finish(recovered,'completed',{"status":"awaiting_events"});self.assertIsNone(self.jobs.claim(clock=2000))
    def test_revocation_and_forget_invalidate_old_jobs_and_writers(self):
        self.dream.consent('alice',True)
        first=self.jobs.enqueue('alice','x');claimed=self.jobs.claim(clock=0)
        self.dream.forget('alice');self.dream.consent('alice',True)
        self.jobs.finish(claimed,'completed',{"status":"promoted"})
        with self.store.db() as db:self.assertEqual(db.execute('SELECT COUNT(*) FROM jobs').fetchone()[0],0)
        self.assertEqual(self.dream.status('alice')['cycles'],[])
        second=self.jobs.enqueue('alice','x');self.assertNotEqual(first['id'],second['id'])
    def test_wrong_tenant_cannot_claim_a_job(self):
        job=self.jobs.enqueue('alice','x')
        self.assertIsNone(self.jobs.claim(job['id'],'bob'))
    def test_expired_workers_cannot_overwrite_newer_attempt(self):
        self.dream.consent('alice',True);job=self.jobs.enqueue('alice','x')
        old=self.jobs.claim(clock=0);new=self.jobs.claim(clock=1201)
        self.jobs.finish(old,'completed',{"stale":True})
        with self.store.db() as db:self.assertEqual(db.execute('SELECT attempts,status FROM jobs').fetchone()['status'],'running')
        self.jobs.finish(new,'completed',{"fresh":True})
    def test_eve_is_primary_and_direct_mode_requires_explicit_selection(self):
        with patch.dict(os.environ,{"LLM_BASE_URL":"https://example.test/v1","LLM_API_KEY":"test","LLM_MODEL":"test"}):
            self.assertFalse(providers.llm_ready())
            with patch.dict(os.environ,{"ATLAS_AGENT_RUNTIME":"direct"}):self.assertTrue(providers.llm_ready())
    def test_factory_provider_preserves_persona_purpose_and_returns_only_typed_data(self):
        with patch.dict(os.environ,{"EVE_URL":"http://127.0.0.1:2000","ATLAS_INTERNAL_TOKEN":"test-internal-not-real"}),patch('atlas.providers.httpx.post') as post:
            post.return_value.json.return_value={"data":{"ok":True},"execution":{"runtime":"eve","agent_id":"soma"}}
            self.assertEqual(providers.complete('s','p',agent_id='soma',purpose='dreamer_policy'),{"ok":True})
            sent=post.call_args.kwargs['json'];self.assertEqual(sent['agent_id'],'soma');self.assertEqual(sent['purpose'],'dreamer_policy')
    def test_trigger_sends_ids_not_documents_and_reuses_job_id(self):
        with patch.dict(os.environ,{"TRIGGER_SECRET_KEY":"test-not-real"}),patch('atlas.providers.httpx.post') as post:
            post.return_value.json.return_value={"id":"run_test"}
            providers.dispatch_job({"id":"dream_test","tenant":"alice","private_document":"never send"})
            payload=post.call_args.kwargs['json']
            self.assertEqual(payload,{"payload":{"job_id":"dream_test","tenant":"alice"},"options":{"idempotencyKey":"dream_test"}})
    def test_relevance_evaluation_rejects_foreign_ids(self):
        with patch.dict(os.environ,{"TYPESAFE_API_KEY":"test","ATLAS_INTERNAL_TOKEN":"test"}),patch('atlas.providers.httpx.post') as post:
            post.return_value.json.return_value={"source":"typesafe","scores":[{"id":"foreign","score":1}]}
            with self.assertRaises(providers.ProviderError):providers.rank_evidence('q',[{"id":"allowed","text":"t"}])
