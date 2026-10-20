"""SQLite-backed bounded jobs; the same IDs can be invoked by an external runner."""
import json
import time
from .store import uid, now

class Jobs:
    def __init__(self, store):
        self.store = store

    def enqueue(self, tenant, key):
        with self.store.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT COALESCE((SELECT version FROM memory_revisions WHERE tenant=?),0)", (tenant,)).fetchone()
            revision = row[0]
            key = f"{revision}:{key}"
            existing = db.execute("SELECT * FROM jobs WHERE tenant=? AND dedup=?", (tenant,key)).fetchone()
            if existing:
                return dict(existing)
            if db.execute("SELECT COUNT(*) FROM jobs WHERE status IN ('queued','running')").fetchone()[0] >= 8:
                raise ValueError("Fila de dreaming cheia; aguarde a conclusão.")
            job_id = uid("dream")
            db.execute("INSERT INTO jobs VALUES(?,?,?,?,?,'queued',0,0,?,NULL)", (tenant,job_id,key,revision,"dreamer",now()))
            # Preserve status polling in the existing beginner-facing UI.
            db.execute("INSERT INTO cycles VALUES(?,?,'queued',?,'{}',?)", (tenant,job_id,"Ciclo persistido; aguardando worker.",now()))
            return dict(db.execute("SELECT * FROM jobs WHERE tenant=? AND id=?", (tenant,job_id)).fetchone())

    def claim(self, job_id=None, tenant=None, clock=None):
        clock = time.time() if clock is None else clock
        with self.store.db() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("UPDATE jobs SET status='failed' WHERE status='running' AND lease_until<? AND attempts>=3", (clock,))
            row = db.execute("SELECT * FROM jobs WHERE (status='queued' OR (status='running' AND lease_until<?)) AND attempts<3 AND (? IS NULL OR id=?) AND (? IS NULL OR tenant=?) ORDER BY created_at LIMIT 1", (clock,job_id,job_id,tenant,tenant)).fetchone()
            if not row:
                return None
            revision = db.execute("SELECT COALESCE((SELECT version FROM memory_revisions WHERE tenant=?),0)", (row['tenant'],)).fetchone()[0]
            if revision != row['revision']:
                db.execute("UPDATE jobs SET status='cancelled' WHERE tenant=? AND id=?", (row['tenant'],row['id']))
                return None
            db.execute("UPDATE jobs SET status='running',attempts=attempts+1,lease_until=? WHERE tenant=? AND id=?", (clock+1200,row['tenant'],row['id']))
            return dict(db.execute("SELECT * FROM jobs WHERE tenant=? AND id=?", (row['tenant'],row['id'])).fetchone())

    def execute(self, dreamer, job):
        if not job:
            return None
        tenant = job['tenant']
        try:
            if self.store.memory_state(tenant)['revision'] != job['revision']:
                return self.finish(job, 'cancelled', {"status":"cancelled"})
            result = dreamer.cycle(tenant,job['id'])
            return self.finish(job,'completed',result)
        except Exception:
            # A daily provider budget is also enforced by Dreamer. Retry is bounded.
            return self.finish(job,'queued' if job['attempts']<3 else 'failed',{"status":"retry_pending" if job['attempts']<3 else "failed"})

    def finish(self, job, status, result):
        with self.store.db() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("UPDATE jobs SET status=?,lease_until=0,result=? WHERE tenant=? AND id=? AND status='running' AND attempts=? AND revision=(SELECT COALESCE((SELECT version FROM memory_revisions WHERE tenant=?),0))", (status,json.dumps(result),job['tenant'],job['id'],job['attempts'],job['tenant']))
        return result
