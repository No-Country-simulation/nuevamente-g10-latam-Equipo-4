import json
import threading
from typing import Literal
from pydantic import Field
from . import providers
from .learning import active_policy, remote_content
from .models import StrictModel, Generation
from .store import uid, now

from .replay import Policy, BASELINE, compare

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
            worlds = db.execute("SELECT COUNT(*) FROM dream_worlds WHERE tenant=?", (tenant,)).fetchone()[0]
            revision = db.execute("SELECT COALESCE((SELECT version FROM memory_revisions WHERE tenant=?),0)", (tenant,)).fetchone()[0]
        active = next((p for p in policies if p["status"] == "active"), None)
        enabled = bool(consent and consent[0])
        return {"algorithm": "history_replay_v1", "worlds": worlds, "consent": enabled, "revision": revision, "events": count, "active_version": active["version"] if active else 0, "active_policy": json.loads(active["instruction"]) if active and enabled else None, "policies": policies, "cycles": cycles}

    def consent(self, tenant, enabled):
        with self.state_lock, self.store.db() as db:
            db.execute("INSERT INTO memory_revisions VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET version=version+1", (tenant,))
            if not enabled:
                db.execute("UPDATE jobs SET status='cancelled' WHERE tenant=? AND status IN ('queued','running')", (tenant,))
                self.epochs[tenant] = self.epochs.get(tenant, 0) + 1
                db.execute("UPDATE cycles SET status='cancelled',reason='Consentimento revogado; ciclo cancelado.' WHERE tenant=? AND status IN ('queued','evaluating')", (tenant,))
            db.execute("INSERT INTO consent VALUES(?,?) ON CONFLICT(tenant) DO UPDATE SET enabled=excluded.enabled", (tenant, int(enabled)))
        return self.status(tenant)

    def forget(self, tenant):
        with self.state_lock, self.store.db() as db:
            db.execute("INSERT INTO memory_revisions VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET version=version+1", (tenant,))
            self.epochs[tenant] = self.epochs.get(tenant, 0) + 1
            for table in ("jobs", "memory_events", "policies", "cycles", "consent", "conversations", "replay_cases", "dream_worlds"):
                db.execute(f"DELETE FROM {table} WHERE tenant=?", (tenant,))
        return self.status(tenant)

    def rollback(self, tenant, version):
        with self.state_lock, self.store.db() as db:
            if version and not db.execute("SELECT 1 FROM policies WHERE tenant=? AND version=? AND status IN ('active','archived')", (tenant, version)).fetchone():
                raise ValueError("Versão não foi aprovada ou não pertence ao workspace.")
            self.epochs[tenant] = self.epochs.get(tenant, 0) + 1
            db.execute("INSERT INTO memory_revisions VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET version=version+1", (tenant,))
            db.execute("UPDATE cycles SET status='cancelled',reason='Rollback solicitado; ciclo cancelado.' WHERE tenant=? AND status IN ('queued','evaluating')", (tenant,))
            db.execute("UPDATE jobs SET status='cancelled' WHERE tenant=? AND status IN ('queued','running')", (tenant,))
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
                rows = db.execute("SELECT payload FROM dream_worlds WHERE tenant=? ORDER BY rowid DESC LIMIT 20", (tenant,)).fetchall()
            worlds = [json.loads(row["payload"]) for row in rows]
            if len(worlds) < 3:
                return self.record(tenant, cycle_id, "awaiting_events", "São necessários três mundos com pelo menos duas alternativas reais avaliadas. O simulador não inventa experiências.")
            # Most recent third is held out; proposer sees only the training pool.
            split = max(1, len(worlds) // 3)
            heldout, train = worlds[:split], worlds[split:]
            baseline = active_policy(self.store, tenant) or BASELINE
            baseline = Policy.model_validate(baseline).model_dump()
            self.record(tenant, cycle_id, "evaluating", "Consolidando histórico e avaliando políticas em simulador; nenhum replay chama o agente ou o judge.")
            if self.status(tenant)["revision"] != revision:
                raise ValueError("Revisão da memória mudou; dreaming cancelado.")
            proposed = providers.complete("Você é o desenvolvedor de políticas Dream-RSI do Atlas. Consolide as experiências e proponha uma política tipada de exploração. O modelo, o avaliador e preferred_method/step_size/question_first são fixos; copie esses três campos da baseline e altere somente exploration. Não altere segurança, ferramentas, permissões ou código. Use somente os mundos de treinamento fornecidos.", json.dumps({"events": events, "training_worlds": train, "baseline": baseline, "schema": Policy.model_json_schema(), "objective": "max observed grounded score - 0.03 * observed attempts; W=1"}, ensure_ascii=False), agent_id="soma", purpose="dreamer_policy")
            candidate = Policy.model_validate(proposed).model_dump()
            if any(candidate[key] != baseline[key] for key in ("preferred_method", "step_size", "question_first")):
                return self.record(tenant, cycle_id, "rejected", "O candidato mudou uma preferência sem contrafactual observado; baseline preservada.")
            if self.status(tenant)["revision"] != revision or epoch != self.epochs.get(tenant, 0):
                raise ValueError("Consentimento ou memória mudou durante proposta.")
            training = compare(train, baseline["exploration"], candidate["exploration"])
            validation = compare(heldout, baseline["exploration"], candidate["exploration"])
            before, after = validation["baseline"], validation["candidate"]
            valid = training["covered"] and validation["covered"] and training["no_regression"] and validation["no_regression"] and training["no_quality_regression"] and validation["no_quality_regression"]
            consent_still_enabled = self.status(tenant)["consent"]
            promote = valid and consent_still_enabled and after > before + 0.01
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
                return self.record(tenant, cycle_id, "promoted" if promote else "rejected", "Melhoria observada no replay; política pedagógica promovida." if promote else "O candidato não melhorou todos os critérios; baseline preservada.", {"baseline": before, "candidate": after, "training": training, "heldout": validation, "worlds": len(worlds), "version": version, "algorithm": "history_replay_v1", "rubric": "grounding_and_pedagogical_utility_v1", "learning_efficacy": "not_measured"})
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
