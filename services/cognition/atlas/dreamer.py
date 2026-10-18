import json
import threading
from typing import Literal
from pydantic import Field
from . import providers
from .learning import active_policy, remote_content
from .models import StrictModel, Generation
from .store import uid, now

class Policy(StrictModel):
    preferred_method: Literal["socratic", "feynman", "first_principles", "warburg"]
    step_size: Literal["short", "medium"]
    question_first: bool

class Dreamer:
    """Independent memory domain; proposals cannot modify code, tools or permissions."""
    def __init__(self, store):
        self.store, self.lock = store, threading.Lock()
        self.state_lock = threading.RLock()
        self.epochs = {}

    def status(self, tenant):
        with self.store.db() as db:
            consent = db.execute("SELECT enabled FROM consent WHERE tenant=?", (tenant,)).fetchone()
            count = db.execute("SELECT COUNT(*) FROM memory_events WHERE tenant=?", (tenant,)).fetchone()[0]
            policies = [dict(row) for row in db.execute("SELECT version,instruction,status FROM policies WHERE tenant=? ORDER BY version DESC", (tenant,)).fetchall()]
            cycles = [dict(row) for row in db.execute("SELECT id,status,reason,created_at FROM cycles WHERE tenant=? ORDER BY created_at DESC LIMIT 10", (tenant,)).fetchall()]
            revision = db.execute("SELECT COALESCE((SELECT version FROM memory_revisions WHERE tenant=?),0)", (tenant,)).fetchone()[0]
        active = next((p for p in policies if p["status"] == "active"), None)
        enabled = bool(consent and consent[0])
        return {"consent": enabled, "revision": revision, "events": count, "active_version": active["version"] if active else 0, "active_policy": json.loads(active["instruction"]) if active and enabled else None, "policies": policies, "cycles": cycles}

    def consent(self, tenant, enabled):
        with self.state_lock, self.store.db() as db:
            db.execute("INSERT INTO memory_revisions VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET version=version+1", (tenant,))
            if not enabled:
                self.epochs[tenant] = self.epochs.get(tenant, 0) + 1
                db.execute("UPDATE cycles SET status='cancelled',reason='Consentimento revogado; ciclo cancelado.' WHERE tenant=? AND status IN ('queued','evaluating')", (tenant,))
            db.execute("INSERT INTO consent VALUES(?,?) ON CONFLICT(tenant) DO UPDATE SET enabled=excluded.enabled", (tenant, int(enabled)))
        return self.status(tenant)

    def forget(self, tenant):
        with self.state_lock, self.store.db() as db:
            db.execute("INSERT INTO memory_revisions VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET version=version+1", (tenant,))
            self.epochs[tenant] = self.epochs.get(tenant, 0) + 1
            for table in ("memory_events", "policies", "cycles", "consent", "conversations", "replay_cases"):
                db.execute(f"DELETE FROM {table} WHERE tenant=?", (tenant,))
        return self.status(tenant)

    def rollback(self, tenant, version):
        with self.state_lock, self.store.db() as db:
            if version and not db.execute("SELECT 1 FROM policies WHERE tenant=? AND version=? AND status IN ('active','archived')", (tenant, version)).fetchone():
                raise ValueError("Versão não foi aprovada ou não pertence ao workspace.")
            self.epochs[tenant] = self.epochs.get(tenant, 0) + 1
            db.execute("INSERT INTO memory_revisions VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET version=version+1", (tenant,))
            db.execute("UPDATE cycles SET status='cancelled',reason='Rollback solicitado; ciclo cancelado.' WHERE tenant=? AND status IN ('queued','evaluating')", (tenant,))
            db.execute("UPDATE policies SET status='archived' WHERE tenant=? AND status='active'", (tenant,))
            db.execute("UPDATE policies SET status='active' WHERE tenant=? AND version=?", (tenant, version))
        return self.status(tenant)

    def cycle(self, tenant, cycle_id=None):
        cycle_id = cycle_id or uid("dream")
        if not self.lock.acquire(blocking=False):
            return self.record(tenant, cycle_id, "cancelled", "Outro ciclo já está em execução; esta solicitação foi cancelada.")
        epoch = self.epochs.get(tenant, 0)
        try:
            state = self.status(tenant)
            revision = state["revision"]
            if not state["consent"]:
                return self.record(tenant, cycle_id, "awaiting_consent", "Ative a memória individual antes de consolidar experiências.")
            if state["events"] < 3:
                return self.record(tenant, cycle_id, "awaiting_events", "Ainda não há três experiências consentidas para propor uma revisão.")
            if not providers.llm_ready() or not __import__('os').getenv("TYPESAFE_API_KEY"):
                return self.record(tenant, cycle_id, "awaiting_evaluation", "Memórias preservadas. Configure geração e Typesafe para comparar baseline/candidato; nenhuma melhoria foi promovida sem avaliação.")
            with self.store.db() as db:
                recent = db.execute("SELECT created_at FROM cycles WHERE tenant=? AND status IN ('promoted','rejected','failed') ORDER BY created_at DESC LIMIT 1", (tenant,)).fetchone()
                if recent and recent[0][:10] == now()[:10]:
                    return self.record(tenant, cycle_id, "awaiting_evaluation", "Limite de um replay remoto por workspace/dia atingido.")
                events = [dict(row) for row in db.execute("SELECT kind,payload FROM memory_events WHERE tenant=? ORDER BY created_at DESC LIMIT 20", (tenant,)).fetchall()]
                cases = db.execute("SELECT payload,input FROM replay_cases WHERE tenant=? ORDER BY rowid DESC LIMIT 3", (tenant,)).fetchall()
            cases = [row for row in cases if json.loads(row["payload"])["status"] == "ready"]
            if len(cases) < 3:
                return self.record(tenant, cycle_id, "awaiting_events", "São necessários três materiais com fontes para o replay de regressão.")
            self.record(tenant, cycle_id, "evaluating", "Comparando três casos baseline/candidato; nenhuma política ativa foi modificada.")
            if self.status(tenant)["revision"] != revision:
                raise ValueError("Revisão da memória mudou; replay cancelado.")
            proposed = providers.complete("Proponha somente preferências pedagógicas. Não altere segurança, ferramentas ou permissões. Retorne JSON no schema fornecido.", json.dumps({"events": events, "schema": Policy.model_json_schema()}, ensure_ascii=False))
            candidate = Policy.model_validate(proposed).model_dump()
            baseline = active_policy(self.store, tenant)
            scores, valid = [], True
            for row in cases:
                payload = json.loads(row["payload"])
                request = Generation.model_validate_json(row["input"])
                citations = [c for item in payload["conteudo_adaptado"]["itens"] for c in item["citations"]]
                evidence = "\n".join(f"EVIDENCE {c['section_id']} | {c['excerpt']}" for c in citations)
                allowed = {c['section_id'] for c in citations}
                results = []
                for policy in (baseline, candidate):
                    state_now = self.status(tenant)
                    if not state_now["consent"] or state_now["revision"] != revision or epoch != self.epochs.get(tenant, 0):
                        raise ValueError("Consentimento revogado; replay interrompido.")
                    content = remote_content(request, evidence, policy)
                    if self.status(tenant)["revision"] != revision:
                        raise ValueError("Memória mudou durante geração; avaliação cancelada.")
                    if any(cid not in allowed for item in content.items for cid in item.evidence_ids):
                        raise ValueError("O replay retornou citações não autorizadas.")
                    verdict = providers.judge(request.goal, evidence, content.model_dump_json())
                    results.append(verdict)
                valid = valid and all(r["verdict"] == "supported" and isinstance(r.get("score"), (float, int)) for r in results)
                scores.append([results[0].get("score") or 0, results[1].get("score") or 0])
            before = sum(p[0] for p in scores) / len(scores)
            after = sum(p[1] for p in scores) / len(scores)
            consent_still_enabled = self.status(tenant)["consent"]
            promote = valid and consent_still_enabled and after > before + 0.05 and all(b >= a for a,b in scores)
            with self.state_lock, self.store.db() as db:
                db.execute("BEGIN IMMEDIATE")
                current_revision = db.execute("SELECT version FROM memory_revisions WHERE tenant=?", (tenant,)).fetchone()
                if epoch != self.epochs.get(tenant, 0) or not current_revision or current_revision[0] != revision:
                    return {"id": cycle_id, "status": "cancelled", "reason": "Memória desativada ou apagada durante o ciclo."}
                version = db.execute("SELECT COALESCE(MAX(version),0)+1 FROM policies WHERE tenant=?", (tenant,)).fetchone()[0]
                if promote:
                    db.execute("UPDATE policies SET status='archived' WHERE tenant=? AND status='active'", (tenant,))
                db.execute("INSERT INTO policies VALUES(?,?,?,?,?)", (tenant, version, json.dumps(candidate), "active" if promote else "rejected", now()))
            with self.state_lock:
                if epoch != self.epochs.get(tenant, 0):
                    return {"id": cycle_id, "status": "cancelled", "reason": "Memória apagada durante o ciclo."}
                return self.record(tenant, cycle_id, "promoted" if promote else "rejected", "Melhoria observada no replay; política pedagógica promovida." if promote else "O candidato não melhorou todos os critérios; baseline preservada.", {"baseline": before, "candidate": after, "cases": 3, "version": version, "rubric": "grounding_and_pedagogical_utility_v1"})
        except Exception:
            with self.state_lock:
                if epoch == self.epochs.get(tenant, 0):
                    self.record(tenant, cycle_id, "failed", "O replay não pôde concluir. Política anterior preservada; consulte a configuração dos provedores.")
            raise
        finally:
            self.lock.release()

    def record(self, tenant, cycle_id, status, reason, metrics=None):
        with self.store.db() as db:
            db.execute("INSERT INTO cycles VALUES(?,?,?,?,?,?) ON CONFLICT(tenant,id) DO UPDATE SET status=excluded.status,reason=excluded.reason,metrics=excluded.metrics", (tenant, cycle_id, status, reason, json.dumps(metrics or {}), now()))
        return {"id": cycle_id, "status": status, "reason": reason, "metrics": metrics or {}, "created_at": now()}
