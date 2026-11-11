import io
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from pypdf import PdfWriter
from pypdf.generic import NameObject,DictionaryObject,DecodedStreamObject
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from atlas.store import Store
from atlas.rag import ingest,parse,validate_upload
from atlas.learning import generate
from atlas.models import Generation

class SchemaUploads(unittest.TestCase):
    def test_pdf_above_previous_limit_is_actually_parsed(self):
        writer=PdfWriter();page=writer.add_blank_page(400,400)
        font=DictionaryObject({NameObject('/Type'):NameObject('/Font'),NameObject('/Subtype'):NameObject('/Type1'),NameObject('/BaseFont'):NameObject('/Helvetica')})
        page[NameObject('/Resources')]=DictionaryObject({NameObject('/Font'):DictionaryObject({NameObject('/F1'):font})})
        stream=DecodedStreamObject();stream.set_data(b'BT /F1 12 Tf 20 200 Td (Redes privadas permitem estudar infraestrutura.) Tj ET')
        page[NameObject('/Contents')]=writer._add_object(stream)
        padding=DecodedStreamObject();padding.set_data(b'x'*(11*1024**2));writer._add_object(padding)
        output=io.BytesIO();writer.write(output)
        data=output.getvalue()
        self.assertGreater(len(data),10*1024**2)
        pages,mime=parse('grande.pdf',data)
        self.assertEqual(mime,'application/pdf')
        self.assertIn('Redes privadas',pages[0]['text'])

    def test_exact_file_boundary_and_one_byte_over(self):
        self.assertEqual(validate_upload('x.pdf',b'%PDF-'+b' '*(80*1024**2-5)),'.pdf')
        with self.assertRaises(ValueError):validate_upload('x.pdf',b'%PDF-'+b' '*(80*1024**2-4))

    def test_links_are_tenant_scoped_and_survive_migration_restart(self):
        with tempfile.TemporaryDirectory() as root,patch.dict(os.environ,{'ATLAS_AGENT_RUNTIME':'extractive','STORAGE_PROVIDER':'local'},clear=True):
            store=Store(root)
            doc=ingest(store,'alice','x.md',b'# Redes\n\nUma rede privada possui sub-redes com regras de acesso.')
            material=generate(store,'alice',Generation(document_ids=[doc['id']],goal='Explicar redes privadas'))
            reopened=Store(root)
            with reopened.db() as db:
                self.assertEqual(tuple(db.execute('SELECT tenant,package_id,document_id FROM package_sources').fetchone()),('alice',material['id'],doc['id']))
                self.assertEqual(db.execute('SELECT COUNT(*) FROM schema_migrations').fetchone()[0],4)
                db.execute('DELETE FROM packages WHERE tenant=? AND id=?',('alice',material['id']))
                self.assertEqual(db.execute('SELECT COUNT(*) FROM package_sources').fetchone()[0],0)

    def test_legacy_orphans_are_inventoried_and_quarantined_until_valid_repair(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as root,patch.dict(os.environ,{'ATLAS_AGENT_RUNTIME':'extractive','STORAGE_PROVIDER':'local'},clear=True):
            store=Store(root)
            a=ingest(store,'alice','a.md',b'# Redes\n\nUma rede privada possui regras para restringir acesso.')
            b=ingest(store,'bob','b.md',b'# Dados\n\nUma fonte privada pertence a outro workspace.')
            material=generate(store,'alice',Generation(document_ids=[a['id']],goal='Explicar redes privadas'))
            with sqlite3.connect(Path(root)/'atlas.sqlite3') as db:
                for name in ('package_sources_insert','package_sources_update','package_integrity_repaired','package_source_shape_insert','package_source_shape_update'):
                    db.execute(f'DROP TRIGGER {name}')
                db.execute('DROP TABLE package_sources');db.execute('DROP TABLE package_integrity_issues');db.execute('DROP TABLE schema_migrations')
                legacy={'document_ids':[b['id'],'doc_'+'f'*20]}
                db.execute('UPDATE packages SET input=? WHERE tenant=? AND id=?',(json.dumps(legacy),'alice',material['id']))
            reopened=Store(root)
            with self.assertRaises(LookupError):reopened.package('alice',material['id'])
            from atlas.documents.service import remove
            from atlas.dreamer import Dreamer
            from atlas.providers import ProviderError
            with self.assertRaises(ProviderError):remove(reopened,Dreamer(reopened),'alice',a['id'])
            self.assertEqual(reopened.source('alice',a['id'])['id'],a['id'])
            self.assertTrue((Path(root)/'objects'/material['storage']['object_key']).exists())

            with reopened.db() as db:
                self.assertEqual(db.execute('SELECT COUNT(*) FROM package_integrity_issues').fetchone()[0],2)
                self.assertEqual(db.execute('SELECT COUNT(*) FROM package_sources').fetchone()[0],0)
                db.execute('UPDATE packages SET input=? WHERE tenant=? AND id=?',(json.dumps({'document_ids':[a['id']]}),'alice',material['id']))
            self.assertEqual(reopened.package('alice',material['id'])['id'],material['id'])
            with self.assertRaises(sqlite3.IntegrityError),reopened.db() as db:
                db.execute('UPDATE packages SET input=? WHERE tenant=? AND id=?',(json.dumps({'document_ids':[b['id']]}),'alice',material['id']))
            with reopened.db() as db:
                self.assertEqual(db.execute('SELECT document_id FROM package_sources').fetchone()[0],a['id'])
                self.assertEqual(db.execute('SELECT COUNT(*) FROM package_integrity_issues').fetchone()[0],0)


    def test_legacy_without_document_refs_is_not_declared_consistent(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as root:
            with sqlite3.connect(Path(root)/'atlas.sqlite3') as db:
                db.execute('CREATE TABLE packages(tenant TEXT,id TEXT,payload TEXT,answers TEXT,input TEXT,PRIMARY KEY(tenant,id))')
                db.executemany('INSERT INTO packages VALUES(?,?,?,?,?)',[('alice','missing','{}','{}','{}'),('alice','empty','{}','{}','{"document_ids":[]}')])
            store=Store(root)
            with store.db() as db:
                self.assertEqual(db.execute('SELECT COUNT(*) FROM package_integrity_issues').fetchone()[0],2)
            for package_id in ('missing','empty'):
                with self.assertRaises(LookupError):store.package('alice',package_id)


    def test_legacy_null_and_nontext_refs_are_quarantined_and_cannot_be_reintroduced(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as root:
            with sqlite3.connect(Path(root)/'atlas.sqlite3') as db:
                db.execute('CREATE TABLE packages(tenant TEXT,id TEXT,payload TEXT,answers TEXT,input TEXT,PRIMARY KEY(tenant,id))')
                for index, value in enumerate([None, 42, False, {}, [], ""]):
                    db.execute('INSERT INTO packages VALUES(?,?,?,?,?)',('alice',str(index),'{}','{}',json.dumps({'document_ids':[value]})))
            store=Store(root)
            with store.db() as db:
                self.assertEqual(db.execute('SELECT COUNT(DISTINCT package_id) FROM package_integrity_issues').fetchone()[0],6)
            for index in range(6):
                with self.assertRaises(LookupError):store.package('alice',str(index))
                with self.assertRaises(sqlite3.IntegrityError),store.db() as db:
                    db.execute('UPDATE packages SET input=? WHERE tenant=? AND id=?',('{"document_ids":[null]}','alice',str(index)))
            reopened=Store(root)
            with reopened.db() as db:
                self.assertEqual(db.execute('SELECT COUNT(DISTINCT package_id) FROM package_integrity_issues').fetchone()[0],6)
