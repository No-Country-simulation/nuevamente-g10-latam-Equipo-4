import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from atlas.store import Store
from atlas.rag import ingest, parse, retrieve
from atlas.learning import generate, attempt, active_policy
from atlas.models import Generation, Attempt, RemoteContent
from atlas.dreamer import Dreamer
from atlas.reindex import reindex

class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {key:"" for key in ('LLM_BASE_URL','LLM_API_KEY','LLM_MODEL','EVE_URL','TYPESAFE_API_KEY','EMBEDDING_API_KEY','MEMORY_SERVICE_URL')} | {"STORAGE_PROVIDER":"local"})
        self.env.start()
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.addCleanup(self.env.stop)
        self.store=Store(self.tmp.name)
        self.doc=ingest(self.store,'alice','Redes.md',b'# Redes\n\nUma VCN possui sub-redes privadas.\n\nNAT Gateway permite conexoes de saida e preserva a rede privada.')

    def package(self, format='tutorial'):
        return generate(self.store,'alice',Generation(document_ids=[self.doc['id']],goal='Entender os principais conceitos deste documento',format=format))

    def test_upload_deduplicates_only_inside_owner_and_cannot_read_other_sources(self):
        source=self.store.source('alice',self.doc['id'])
        with self.assertRaises(LookupError): self.store.source('bob',self.doc['id'])
        with self.assertRaises(LookupError): retrieve(self.store,'bob',[self.doc['id']],'VCN','hybrid')
        again=ingest(self.store,'alice','renamed.md',b'# Redes\n\nUma VCN possui sub-redes privadas.\n\nNAT Gateway permite conexoes de saida e preserva a rede privada.')
        self.assertEqual(again['id'],self.doc['id']);self.assertIn('VCN',source['pages'][0]['text'])

    def test_rejects_invalid_binary_empty_and_oversize_uploads(self):
        for filename,data in [('x.pdf',b'not PDF'),('x.exe',b'script'),('x.txt',b'\x00binary'),('x.md',b' '),('x.txt',b'x'*(10*1024**2+1))]:
            with self.subTest(filename=filename),self.assertRaises(ValueError):parse(filename,data)

    def test_unrelated_question_abstains_instead_of_inventing_evidence(self):
        result=generate(self.store,'alice',Generation(document_ids=[self.doc['id']],goal='Quem ganhou Wimbledon?'))
        self.assertEqual(result['status'],'abstained');self.assertEqual(result['conteudo_adaptado']['itens'],[])
        self.assertEqual(result['quality']['judge_verdict'],'insufficient_evidence')

    def test_lm_does_not_silently_truncate_whole_document(self):
        with patch.dict(os.environ,{'LM_CONTEXT_CHAR_BUDGET':'60'}):
            citations,context,mode=retrieve(self.store,'alice',[self.doc['id']],'Entender documento','lm')
        self.assertEqual(mode,'hybrid');self.assertTrue(citations);self.assertIn('EVIDENCE',context)

    def test_quiz_has_server_side_answers_and_idempotent_xp_even_with_different_event(self):
        package=self.package('quiz');item=package['conteudo_adaptado']['itens'][0]
        serialized=json.dumps(package);self.assertNotIn('correct_index',serialized);self.assertNotIn('"correct"',serialized)
        answers=json.loads(self.store.package('alice',package['id'])['answers'])
        submission=Attempt(item_id=item['id'],option_id=answers[item['id']]['correct'],event_id='first')
        self.assertEqual(attempt(self.store,'alice',package['id'],submission)['xp_awarded'],15)
        submission.event_id='second'
        self.assertEqual(attempt(self.store,'alice',package['id'],submission)['xp_awarded'],0)
        self.assertEqual(self.store.progress('alice')['xp'],15)
        with self.assertRaises(LookupError): attempt(self.store,'bob',package['id'],submission)

    def test_all_formats_keep_canonical_page_and_explicit_local_mode(self):
        for format in ('tutorial','flashcards','quiz','summary'):
            result=self.package(format)
            self.assertEqual(result['mode'],'extractive_demo');self.assertEqual(result['storage']['provider'],'local')
            self.assertEqual(result['quality']['judge_verdict'],'not_evaluated')
            for item in result['conteudo_adaptado']['itens']:
                self.assertEqual(item['citations'][0]['page'],1)
                self.assertIn(item['citations'][0]['excerpt'],self.store.source('alice',self.doc['id'])['pages'][0]['text'])

    def test_dreamer_requires_consent_and_real_evaluation_before_promotion(self):
        dream=Dreamer(self.store);self.package()
        self.assertEqual(dream.status('alice')['events'],0)
        self.assertEqual(dream.cycle('alice')['status'],'awaiting_consent')
        dream.consent('alice',True)
        for _ in range(3):self.package()
        self.assertEqual(dream.status('alice')['events'],3)
        self.assertEqual(dream.cycle('alice')['status'],'awaiting_evaluation')
        self.assertEqual(dream.status('alice')['active_version'],0)
        self.assertEqual(dream.status('bob')['events'],0)
        dream.forget('alice');self.assertEqual(dream.status('alice')['events'],0)
        self.assertTrue(self.store.documents('alice'))

    def test_dreamer_promotes_only_evaluated_improvement_and_can_rollback(self):
        dream=Dreamer(self.store);dream.consent('alice',True)
        for _ in range(3):self.package()
        candidate={'preferred_method':'socratic','step_size':'short','question_first':True}
        def content(request,evidence,policy):
            section=evidence.split('EVIDENCE ')[1].split(' | ')[0]
            return RemoteContent(title='Redes',introduction='Teste',items=[{'title':'Fonte','body':'candidato' if policy else 'baseline','evidence_ids':[section]}])
        def judge(question,evidence,answer):return {'verdict':'supported','score':1.0 if 'candidato' in answer else 0.33}
        with patch('atlas.providers.llm_ready',return_value=True),patch.dict(os.environ,{'TYPESAFE_API_KEY':'test-only-not-real'}),patch('atlas.dreamer.providers.complete',return_value=candidate),patch('atlas.dreamer.remote_content',side_effect=content),patch('atlas.dreamer.providers.judge',side_effect=judge):
            result=dream.cycle('alice')
        self.assertEqual(result['status'],'promoted');self.assertEqual(active_policy(self.store,'alice'),candidate)
        dream.consent('alice',False);self.assertIsNone(active_policy(self.store,'alice'))
        dream.consent('alice',True);dream.rollback('alice',0);self.assertIsNone(active_policy(self.store,'alice'))

    def test_forgetting_during_dream_does_not_recreate_deleted_memory(self):
        dream=Dreamer(self.store);dream.consent('alice',True)
        for _ in range(3):self.package()
        def erase(system,prompt):
            dream.forget('alice')
            return {'preferred_method':'socratic','step_size':'short','question_first':True}
        with patch('atlas.providers.llm_ready',return_value=True),patch.dict(os.environ,{'TYPESAFE_API_KEY':'test-only-not-real'}),patch('atlas.dreamer.providers.complete',side_effect=erase):
            with self.assertRaises(ValueError):dream.cycle('alice')
        state=dream.status('alice');self.assertEqual(state['events'],0);self.assertEqual(state['policies'],[]);self.assertEqual(state['cycles'],[])

    def test_stale_experiences_cannot_return_after_erase_and_new_consent(self):
        dream=Dreamer(self.store);dream.consent('alice',True)
        snapshot=self.store.memory_state('alice')
        dream.forget('alice');dream.consent('alice',True)
        stored=self.store.event('alice','attempt',{'correct':True},snapshot['revision'])
        self.assertFalse(stored);self.assertEqual(dream.status('alice')['events'],0)

    def test_material_created_before_consent_is_not_a_replay_case(self):
        for _ in range(3):self.package()
        dream=Dreamer(self.store);dream.consent('alice',True)
        for _ in range(3):self.store.event('alice','attempt',{'correct':False})
        with patch('atlas.providers.llm_ready',return_value=True),patch.dict(os.environ,{'TYPESAFE_API_KEY':'test-only'}),patch('atlas.dreamer.providers.complete') as remote:
            self.assertEqual(dream.cycle('alice')['status'],'awaiting_events');remote.assert_not_called()

    def test_competing_cycle_reaches_terminal_state(self):
        dream=Dreamer(self.store);dream.lock.acquire()
        try:
            dream.record('alice','queued-test','queued','Teste')
            self.assertEqual(dream.cycle('alice','queued-test')['status'],'cancelled')
        finally:dream.lock.release()
        self.assertEqual(dream.status('alice')['cycles'][0]['status'],'cancelled')

    def test_judge_never_claims_it_evaluated_a_truncated_answer(self):
        from atlas.providers import judge,ProviderError
        with patch.dict(os.environ,{'TYPESAFE_API_KEY':'test-only'}),patch('atlas.providers.httpx.post') as remote:
            with self.assertRaises(ProviderError):judge('objetivo','fonte','x'*18001)
            remote.assert_not_called()

    def test_reindex_preserves_sources_and_is_atomic_on_provider_failure(self):
        ingest(self.store,'alice','Longo.md','\n\n'.join(f'Conceito {i}: redes privadas e conectividade.' for i in range(20)).encode())
        ingest(self.store,'bob','Outro.md',b'Material privado de outro workspace.')
        def rows(tenant):
            with self.store.db() as db:
                return [tuple(row) for row in db.execute('SELECT id,text,vector FROM passages WHERE tenant=? ORDER BY id',(tenant,))]
        before=rows('alice');other=rows('bob');source=self.store.source('alice',self.doc['id'])
        calls=0
        def fail_second_batch(texts):
            nonlocal calls
            calls+=1
            if calls==2:raise RuntimeError('provider unavailable')
            return [[0.5]*32 for _ in texts]
        with patch.dict(os.environ,{'EMBEDDING_API_KEY':'test-only','EMBEDDING_BASE_URL':'https://example.com/v1','EMBEDDING_MODEL':'test'}),patch('atlas.reindex.providers.embed',side_effect=fail_second_batch):
            with self.assertRaises(RuntimeError):reindex(self.store,'alice')
        self.assertEqual(rows('alice'),before)
        with patch.dict(os.environ,{'EMBEDDING_API_KEY':'test-only','EMBEDDING_BASE_URL':'https://example.com/v1','EMBEDDING_MODEL':'test'}),patch('atlas.reindex.providers.embed',side_effect=lambda texts:[[0.5]*32 for _ in texts]):
            self.assertEqual(reindex(self.store,'alice'),len(before))
        after=rows('alice')
        self.assertEqual([(r[0],r[1]) for r in after],[(r[0],r[1]) for r in before])
        self.assertEqual(json.loads(after[0][2])['model'],'remote:https://example.com/v1:test')
        self.assertEqual(rows('bob'),other);self.assertEqual(self.store.source('alice',self.doc['id']),source)

if __name__=='__main__':unittest.main()
