import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path
from . import providers
from .store import now, uid

STOP = set("a o as os de da do das dos e em um uma para por com que qual quais como na no nas nos se ao aos eu voce me este esta esse isso sobre the is to of and or in on".split())

def tokens(text):
    text = unicodedata.normalize("NFKD", text.lower()).encode("ascii", "ignore").decode()
    return [word for word in re.findall(r"[a-z0-9]{2,}", text) if word not in STOP]

def local_vector(text):
    result = [0.0] * 256
    for word in tokens(text):
        index = int.from_bytes(hashlib.sha256(word.encode()).digest()[:4], "big") % len(result)
        result[index] += 1
    norm = math.sqrt(sum(x*x for x in result)) or 1
    return [x / norm for x in result]

def cosine(a, b):
    if len(a) != len(b):
        raise providers.ProviderError("O modelo de embedding mudou. Reindexe a biblioteca antes de consultar.")
    denominator = math.sqrt(sum(x*x for x in a) * sum(x*x for x in b))
    return sum(x*y for x, y in zip(a, b)) / denominator if denominator else 0.0

def parse(filename, data):
    suffix = Path(filename).suffix.lower()
    if suffix not in (".pdf", ".md", ".txt") or not data or len(data) > 10 * 1024**2:
        raise ValueError("Envie PDF, Markdown ou TXT de até 10 MiB.")
    if suffix == ".pdf":
        if not data.startswith(b"%PDF-"):
            raise ValueError("O arquivo não contém um PDF válido.")
        with tempfile.NamedTemporaryFile(suffix=".pdf") as file:
            file.write(data); file.flush()
            try:
                result = subprocess.run([sys.executable, "-m", "atlas.extract", file.name], capture_output=True, timeout=20)
                if result.returncode:
                    raise ValueError("Não foi possível ler o PDF. Limite: 100 páginas; sem senha.")
                pages = json.loads(result.stdout)
            except subprocess.TimeoutExpired as exc:
                raise ValueError("O PDF excedeu o tempo seguro de leitura.") from exc
        mime = "application/pdf"
    else:
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValueError("Use um documento de texto UTF-8.") from exc
        if "\x00" in text or data.startswith(b"%PDF-"):
            raise ValueError("O conteúdo não corresponde a texto UTF-8.")
        pages, mime = [{"number": 1, "text": text}], "text/markdown" if suffix == ".md" else "text/plain"
    size = sum(len(page["text"]) for page in pages)
    if not size or not any(page["text"].strip() for page in pages):
        raise ValueError("Não encontrei texto selecionável. Use PDF textual ou envie uma transcrição; OCR ainda não está disponível.")
    if size > 300_000:
        raise ValueError("Texto acima de 300 mil caracteres.")
    return pages, mime

def ingest(store, tenant, filename, data):
    pages, mime = parse(filename, data)
    digest = hashlib.sha256(data).hexdigest()
    with store.db() as db:
        existing = db.execute("SELECT * FROM documents WHERE tenant=? AND hash=?", (tenant, digest)).fetchone()
        if existing:
            return store.document_meta(existing)
    doc_id = uid("doc")
    filename = Path(filename.replace("\\", "/")).name[:150]
    passages = []
    for page in pages:
        paragraphs = [s.strip() for s in re.split(r"\n\s*\n", page["text"]) if s.strip()]
        for paragraph in paragraphs:
            # Sections remain variable length; this size cap is a safety fallback.
            for offset in range(0, len(paragraph), 1800):
                passages.append({"id": uid("sec"), "page": page["number"], "text": paragraph[offset:offset+1800]})
    if len(passages) > 512:
        raise ValueError("Documento acima de 512 segmentos. Divida-o em volumes menores.")
    vectors = []
    for start in range(0, len(passages), 16):
        batch = [s["text"] for s in passages[start:start+16]]
        remote = providers.embed(batch)
        vectors.extend(remote or [local_vector(text) for text in batch])
    embedding_id = f"remote:{os.getenv('EMBEDDING_BASE_URL')}:{os.getenv('EMBEDDING_MODEL')}" if os.getenv("EMBEDDING_API_KEY") else "local_hash_demo_v1"
    receipt = store.blob(tenant, f"documents/{doc_id}/original{Path(filename).suffix.lower()}", data)
    with store.db() as db:
        db.execute("INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?)", (tenant, doc_id, Path(filename).stem, filename, mime, json.dumps(pages, ensure_ascii=False), digest, now(), json.dumps(receipt)))
        for passage, vector in zip(passages, vectors):
            db.execute("INSERT INTO passages VALUES(?,?,?,?,?,?)", (tenant, doc_id, passage["id"], passage["page"], passage["text"], json.dumps({"model": embedding_id, "values": vector})))
            db.execute("INSERT INTO passages_fts VALUES(?,?,?,?)", (tenant, doc_id, passage["id"], passage["text"]))
    return next(doc for doc in store.documents(tenant) if doc["id"] == doc_id)

def retrieve(store, tenant, document_ids, query, mode):
    sources = [store.source(tenant, doc_id) for doc_id in dict.fromkeys(document_ids)]
    placeholders = ",".join("?" for _ in document_ids)
    with store.db() as db:
        rows = [dict(row) for row in db.execute(f"SELECT * FROM passages WHERE tenant=? AND doc_id IN ({placeholders})", [tenant, *document_ids]).fetchall()]
    if not rows:
        return [], "", mode
    query_vector = (providers.embed([query]) or [local_vector(query)])[0]
    expected_model = f"remote:{os.getenv('EMBEDDING_BASE_URL')}:{os.getenv('EMBEDDING_MODEL')}" if os.getenv("EMBEDDING_API_KEY") else "local_hash_demo_v1"
    scored = []
    words = set(tokens(query))
    overview = bool(re.search(r"documento|material|principais|resum|fonte|vis[aã]o geral", query.lower()))
    for row in rows:
        vector = json.loads(row["vector"])
        if vector["model"] != expected_model:
            raise providers.ProviderError("A configuração de embeddings mudou. Reindexe as fontes para usar o novo modelo.")
        value = cosine(query_vector, vector["values"])
        if expected_model == "local_hash_demo_v1" and not overview and not words.intersection(tokens(row["text"])):
            value = 0
        scored.append((row, value))
    scored.sort(key=lambda pair: pair[1], reverse=True)
    ranks = {row["id"]: 1 / (60 + rank) for rank, (row, score) in enumerate(scored, 1) if score > 0 or overview}
    if mode == "hybrid" and words:
        # FTS expression is built from normalized terms, never raw user syntax.
        expression = " OR ".join('"' + word + '"' for word in sorted(words)[:32])
        with store.db() as db:
            hits = db.execute(f"SELECT id FROM passages_fts WHERE passages_fts MATCH ? AND tenant=? AND doc_id IN ({placeholders}) ORDER BY rank LIMIT 32", [expression, tenant, *document_ids]).fetchall()
        for rank, row in enumerate(hits, 1):
            ranks[row["id"]] = ranks.get(row["id"], 0) + 1 / (60 + rank)
    selected = sorted([row for row in rows if row["id"] in ranks], key=lambda row: ranks[row["id"]], reverse=True)[:6]
    full = "\n\n".join(f"DOCUMENT {source['id']} — PAGE {p['number']}\n{p['text']}" for source in sources for p in source["pages"])
    context_budget = int(os.getenv("LM_CONTEXT_CHAR_BUDGET", "24000"))
    citation_map = "\n\nAVAILABLE CITATION IDS:\n" + "\n".join(f"{r['id']} | {r['doc_id']} p.{r['page']} | {r['text'][:100]}" for r in selected)
    if mode == "lm" and len(full + citation_map) > context_budget:
        mode = "hybrid"
    if mode != "lm":
        full = "\n\n".join(f"EVIDENCE {row['id']} | DOCUMENT {row['doc_id']} PAGE {row['page']}\n{row['text']}" for row in selected)
    else:
        full += citation_map
    titles = {source["id"]: source["title"] for source in sources}
    citations = [{"document_id": row["doc_id"], "document_title": titles[row["doc_id"]], "page": row["page"], "section_id": row["id"], "excerpt": row["text"], "excerpt_hash": hashlib.sha256(row["text"].encode()).hexdigest()} for row in selected]
    return citations, full, mode
