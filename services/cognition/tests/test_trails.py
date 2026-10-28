import json
import os
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from atlas.store import Store
from atlas.rag import ingest
from atlas.learning import generate, attempt
from atlas.models import Generation, Attempt
from atlas.trails import service
from atlas.trails.http import TrailInput
from atlas.progression import progress
from atlas.dreamer import Dreamer
from atlas.errors import ConflictError


class TrailTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"ATLAS_AGENT_RUNTIME": "extractive", "ATLAS_TENANT_ID": "alice"}, clear=True)
        self.env.start()
        self.store = Store(self.temp.name)
        self.doc = ingest(self.store, "alice", "Redes.md", b"# Redes\n\nUma VCN conecta sub-redes. NAT permite conexoes de saida.")
        self.trail = service.create(self.store, "alice", TrailInput(document_ids=[self.doc["id"]], goal="Entender os principais conceitos deste documento"))

    def tearDown(self):
        self.env.stop()
        self.temp.cleanup()

    def prepare(self, step):
        request = Generation(**service.generation_input(self.store, "alice", self.trail["id"], step))
        package = generate(self.store, "alice", request)
        service.attach(self.store, "alice", self.trail["id"], step, package["id"])
        return package

    def test_progression_requires_material_prerequisites_and_verified_quiz(self):
        trail_id = self.trail["id"]
        with self.assertRaises(ValueError):
            service.complete(self.store, "alice", trail_id, "step_1")
        with self.assertRaises(ValueError):
            service.generation_input(self.store, "alice", trail_id, "step_2")
        for step in ("step_1", "step_2"):
            self.prepare(step)
            service.complete(self.store, "alice", trail_id, step)
        quiz = self.prepare("step_3")
        with self.assertRaises(ValueError):
            service.complete(self.store, "alice", trail_id, "step_3")
        answers = json.loads(self.store.package("alice", quiz["id"])["answers"])
        for item_id, answer in answers.items():
            attempt(self.store, "alice", quiz["id"], Attempt(item_id=item_id, option_id=answer["correct"], event_id=item_id))
        completed = service.complete(self.store, "alice", trail_id, "step_3")
        self.assertEqual(completed["steps"][2]["completion_evidence"], "server_verified_quiz")
        self.assertTrue(completed["steps"][3]["unlocked"])
        self.assertEqual(service.complete(self.store, "alice", trail_id, "step_3"), completed)

    def test_tenant_sources_and_material_contracts_cannot_be_forged(self):
        with self.assertRaises(LookupError):
            service.get(self.store, "bob", self.trail["id"])
        with self.assertRaises(LookupError):
            service.create(self.store, "bob", TrailInput(document_ids=[self.doc["id"]], goal="Objetivo"))
        wrong = generate(self.store, "alice", Generation(document_ids=[self.doc["id"]], goal="Outro objetivo", format="quiz"))
        with self.assertRaises(ValueError):
            service.attach(self.store, "alice", self.trail["id"], "step_1", wrong["id"])
        with self.store.db() as db:
            db.execute("UPDATE documents SET hash='changed' WHERE tenant='alice'")
        with self.assertRaises(ValueError):
            self.prepare("step_1")

    def test_trail_survives_restart_and_reads_never_advance_it(self):
        self.prepare("step_1")
        restarted = Store(self.temp.name)
        self.assertEqual(service.get(restarted, "alice", self.trail["id"])["completed_steps"], 0)
        self.assertEqual(len(service.list_trails(restarted, "alice")), 1)
        self.assertEqual(service.list_trails(restarted, "bob"), [])

    def test_same_quiz_event_replays_and_changed_payload_conflicts(self):
        dreamer = Dreamer(self.store)
        dreamer.consent("alice", True)
        quiz = generate(self.store, "alice", Generation(document_ids=[self.doc["id"]], goal="Principais conceitos do documento", format="quiz"))
        item_id, answer = next(iter(json.loads(self.store.package("alice", quiz["id"])["answers"]).items()))
        submission = Attempt(item_id=item_id, option_id=answer["correct"], event_id="event-one")
        first = attempt(self.store, "alice", quiz["id"], submission)
        self.assertEqual(attempt(self.store, "alice", quiz["id"], submission), first)
        self.assertEqual(self.store.progress("alice")["xp"], 15)
        self.assertEqual(dreamer.status("alice")["events"], 2)
        changed = submission.model_copy(update={"option_id": "option_2" if submission.option_id != "option_2" else "option_1"})
        with self.assertRaises(ConflictError):
            attempt(self.store, "alice", quiz["id"], changed)

    def test_concurrent_correct_answers_reward_once(self):
        quiz = generate(self.store, "alice", Generation(document_ids=[self.doc["id"]], goal="Principais conceitos do documento", format="quiz"))
        item_id, answer = next(iter(json.loads(self.store.package("alice", quiz["id"])["answers"]).items()))
        def submit(index):
            return attempt(self.store, "alice", quiz["id"], Attempt(item_id=item_id, option_id=answer["correct"], event_id=f"parallel-{index}"))
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(submit, range(12)))
        self.assertEqual(sum(result["xp_awarded"] for result in results), 15)
        self.assertEqual(self.store.progress("alice")["xp"], 15)

    def test_level_boundaries_are_server_calculated(self):
        self.assertEqual(progress(99, 1)["level"], 1)
        self.assertEqual(progress(100, 2)["level"], 2)
        self.assertEqual(progress(400, 3)["level_percent"], 0)
        self.assertEqual(progress(225, 5)["level_percent"], 41.67)

    def test_duplicate_upload_skips_parser_and_section_rag_does_not_load_full_sources(self):
        from atlas.rag import retrieve
        with patch('atlas.rag.parse', side_effect=AssertionError('duplicate must not parse')):
            duplicate = ingest(self.store, "alice", "Redes.md", b"# Redes\n\nUma VCN conecta sub-redes. NAT permite conexoes de saida.")
        self.assertEqual(duplicate["id"], self.doc["id"])
        with patch.object(self.store, 'source', side_effect=AssertionError('sections must not load full source')):
            citations, evidence, mode = retrieve(self.store, 'alice', [self.doc['id']], 'principais conceitos do documento', 'hybrid')
        self.assertTrue(citations)
        self.assertEqual(mode, 'hybrid')

    def test_dedup_still_validates_file_signature_and_accepts_markdown_alias(self):
        from atlas.rag import validate_upload, parse
        with patch('atlas.rag.parse', side_effect=AssertionError('signature must fail before parser')):
            with self.assertRaises(ValueError):
                ingest(self.store, 'alice', 'Fake.pdf', b"# Redes\n\nUma VCN conecta sub-redes. NAT permite conexoes de saida.")
        with self.assertRaises(ValueError):
            validate_upload('Fake.txt', b'%PDF-fake')
        self.assertEqual(parse('Note.markdown', b'# Example\n\nText.')[1], 'text/markdown')
