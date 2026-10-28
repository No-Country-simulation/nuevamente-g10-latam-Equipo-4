"""Community commands. No HTTP/framework dependency and no invented members."""
from ..store import uid, now


def create_group(store, tenant, request):
    group_id = uid("group")
    with store.db() as db:
        db.execute("INSERT INTO groups VALUES(?,?,?,?,?)", (tenant, group_id, request.name, request.topic, now()))
    return next(group for group in store.groups(tenant) if group["id"] == group_id)


def messages(store, tenant, group_id):
    store.group_exists(tenant, group_id)
    with store.db() as db:
        rows = db.execute("SELECT id,group_id,text,created_at FROM (SELECT * FROM messages WHERE tenant=? AND group_id=? ORDER BY created_at DESC LIMIT 100) ORDER BY created_at", (tenant, group_id)).fetchall()
    return [dict(row) | {"author": "Você"} for row in rows]


def send_message(store, tenant, group_id, request):
    store.group_exists(tenant, group_id)
    result = {"id": uid("msg"), "group_id": group_id, "text": request.text, "created_at": now(), "author": "Você"}
    with store.db() as db:
        db.execute("INSERT INTO messages VALUES(?,?,?,?,?)", (tenant, result["id"], group_id, request.text, result["created_at"]))
    return result
