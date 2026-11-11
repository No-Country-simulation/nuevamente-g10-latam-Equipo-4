"""Reuse conversational facts only when every source is in the current study."""
import json

def context(store, tenant, document_ids, agent_id, shared):
    with store.db() as db:
        rows = db.execute('''SELECT agent_id,role,text FROM conversations c
            WHERE c.tenant=? AND (? OR c.agent_id=?)
            AND EXISTS(SELECT 1 FROM conversation_sources s WHERE s.tenant=c.tenant AND s.turn_id=c.id)
            AND NOT EXISTS(SELECT 1 FROM conversation_sources s WHERE s.tenant=c.tenant AND s.turn_id=c.id
                AND s.document_id NOT IN(SELECT value FROM json_each(?)))
            ORDER BY created_at DESC LIMIT 8''', (tenant,int(shared),agent_id,json.dumps(document_ids))).fetchall()
    return '\n'.join(f"{r['agent_id']} / {r['role']}: {r['text']}" for r in reversed(rows))[-8000:]


def append(db, tenant, turn_id, document_ids):
    db.executemany('INSERT INTO conversation_sources VALUES(?,?,?)',[(tenant,turn_id,doc_id) for doc_id in set(document_ids)])
