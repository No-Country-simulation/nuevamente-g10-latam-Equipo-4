import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock,patch
import httpx
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from atlas.vector_index import QdrantIndex
from atlas.projections import MongoProjection,FIELDS
from atlas.providers import ProviderError
from atlas.store import Store
from atlas.rag import ingest
from atlas.reindex import reindex

class OptionalServiceTests(unittest.TestCase):
    def test_qdrant_writes_only_reference_payloads_and_filters_every_query(self):
        calls=[]
        def handler(req):
            payload=json.loads(req.content) if req.content else None;calls.append((req,payload))
            if req.method=='GET':return httpx.Response(404,json={})
            if req.url.path.endswith('/points/query'):
                return httpx.Response(200,json={'result':{'points':[{'score':0.9,'payload':{'tenant':'alice','doc_id':'doc_a','section_id':'sec_a','model':'model_v1'}}]}})
            return httpx.Response(200,json={'result':{'status':'completed'}})
        with patch.dict(os.environ,{'QDRANT_URL':'https://vectors.example.test'}):
            index=QdrantIndex(httpx.MockTransport(handler));self.addCleanup(index.close)
            collection=index.upsert('alice',[{'id':'sec_a','doc_id':'doc_a','text':'private text'}],[[0.5]*32],'model_v1')
            rows=[{'id':'sec_a','doc_id':'doc_a','vector':json.dumps({'collection':collection})}]
            self.assertEqual(index.search('alice',rows,[0.5]*32,'model_v1'),[('sec_a',0.9)])
        write=next(body for req,body in calls if req.url.path.endswith('/points'))
        self.assertNotIn('private text',json.dumps(write))
        query=calls[-1][1]
        self.assertEqual(query['filter']['must'],[{'key':'tenant','match':{'value':'alice'}},{'key':'doc_id','match':{'any':['doc_a']}},{'key':'model','match':{'value':'model_v1'}}])
    def test_qdrant_rejects_out_of_scope_result_and_unsafe_remote_url(self):
        def handler(req):return httpx.Response(200,json={'result':{'points':[{'score':1,'payload':{'tenant':'bob','doc_id':'doc_a','section_id':'sec_a','model':'m'}}]}})
        with patch.dict(os.environ,{'QDRANT_URL':'https://vectors.example.test'}):
            index=QdrantIndex(httpx.MockTransport(handler));self.addCleanup(index.close)
            with self.assertRaises(ProviderError):index.search('alice',[{'id':'sec_a','doc_id':'doc_a','vector':json.dumps({'collection':'atlas_test'})}],[1]*32,'m')
        with patch.dict(os.environ,{'QDRANT_URL':'http://vectors.example.test'}):
            with self.assertRaises(ProviderError):QdrantIndex()
    def test_qdrant_error_has_no_lexical_fallback(self):
        with patch.dict(os.environ,{'QDRANT_URL':'https://vectors.example.test'}):
            index=QdrantIndex(httpx.MockTransport(lambda req:httpx.Response(503,json={'error':'unavailable'})));self.addCleanup(index.close)
            with self.assertRaises(ProviderError):index.collection('m',32)
    def test_mongo_queries_are_tenant_scoped_projected_paginated_and_indexed(self):
        client=MagicMock();collection=client['atlas']['document_metadata']
        collection.find.return_value.sort.return_value.limit.return_value=[]
        with patch.dict(os.environ,{'MONGODB_DATABASE':'atlas'}):
            projection=MongoProjection(client)
            metadata={key:1 for key in FIELDS}|{'id':'doc_a','text':'private text','secret':'never project'}
            projection.put('alice',metadata);projection.list('alice','doc_0',999)
        update=collection.update_one.call_args
        self.assertEqual(update.args[0],{'tenant':'alice','id':'doc_a'})
        self.assertNotIn('text',update.args[1]['$set']);self.assertNotIn('secret',update.args[1]['$set'])
        collection.create_index.assert_called_once_with([('tenant',1),('id',1)],unique=True)
        self.assertEqual(collection.find.call_args.args[0],{'tenant':'alice','id':{'$gt':'doc_0'}})
        collection.find.return_value.sort.return_value.limit.assert_called_once_with(100)
    def test_failed_qdrant_reindex_preserves_canonical_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp,patch.dict(os.environ,{'MEMORY_SERVICE_URL':'','STORAGE_PROVIDER':'local','VECTOR_BACKEND':'sqlite','EMBEDDING_API_KEY':'','MONGODB_URI':''}):
            store=Store(tmp);ingest(store,'alice','study.md',b'# Networks\n\nA virtual network connects private resources.')
            with store.db() as db:before=db.execute('SELECT vector FROM passages').fetchall()[0][0]
            with patch.dict(os.environ,{'VECTOR_BACKEND':'qdrant','EMBEDDING_API_KEY':'test','EMBEDDING_BASE_URL':'https://example.test','EMBEDDING_MODEL':'test'}),patch('atlas.reindex.providers.embed',return_value=[[1.0]*32]),patch('atlas.reindex.vector_index.QdrantIndex') as index:
                index.return_value.upsert.side_effect=ProviderError('offline')
                with self.assertRaises(ProviderError):reindex(store,'alice')
            with store.db() as db:self.assertEqual(before,db.execute('SELECT vector FROM passages').fetchone()[0])
