/// <reference types="node" />
import test from 'node:test';
import assert from 'node:assert';
import { sessionGate } from '../src/auth/gate.js';
import { tenantStore } from '../src/auth/tenant.js';

test('sessionGate - Security & Internal Routes', async (t) => {
  await t.test('deve retornar 401 para rota interna sem token ou com token inválido', () => {
    process.env.ATLAS_REQUIRE_LOGIN = '1';
    process.env.ATLAS_INTERNAL_TOKEN = 'test-internal-token-123';

    const req: any = {
      path: '/v1/internal/judge',
      headers: { authorization: 'Bearer token-errado' },
      get: (name: string) => (name.toLowerCase() === 'authorization' ? req.headers.authorization : undefined)
    };

    let statusCode: number | undefined;
    let jsonBody: any;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        jsonBody = body;
        return res;
      }
    };

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    sessionGate(req, res, next);

    assert.strictEqual(statusCode, 401);
    assert.deepStrictEqual(jsonBody, { message: 'Token interno inválido ou ausente.' });
    assert.strictEqual(nextCalled, false);
  });

  await t.test('deve retornar 400 para rota interna com token válido mas tenant fora do formato', () => {
    process.env.ATLAS_REQUIRE_LOGIN = '1';
    process.env.ATLAS_INTERNAL_TOKEN = 'test-internal-token-123';

    const req: any = {
      path: '/v1/internal/judge',
      headers: {
        authorization: 'Bearer test-internal-token-123',
        'x-atlas-tenant': 'workspace-invalido-hacker'
      },
      get: (name: string) => (name.toLowerCase() === 'authorization' ? req.headers.authorization : undefined)
    };

    let statusCode: number | undefined;
    let jsonBody: any;
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        jsonBody = body;
        return res;
      }
    };

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    sessionGate(req, res, next);

    assert.strictEqual(statusCode, 400);
    assert.deepStrictEqual(jsonBody, { message: 'Formato de tenant inválido.' });
    assert.strictEqual(nextCalled, false);
  });

  await t.test('deve passar e definir o tenant correto no store para rota interna com token válido e tenant válido', () => {
    process.env.ATLAS_REQUIRE_LOGIN = '1';
    process.env.ATLAS_INTERNAL_TOKEN = 'test-internal-token-123';
    const validTenant = 'usr_1234567890abcdef1234';

    const req: any = {
      path: '/v1/internal/judge',
      headers: {
        authorization: 'Bearer test-internal-token-123',
        'x-atlas-tenant': validTenant
      },
      get: (name: string) => (name.toLowerCase() === 'authorization' ? req.headers.authorization : undefined)
    };

    const res: any = {
      status: () => res,
      json: () => res
    };

    let capturedTenant: string | undefined;
    const next = () => {
      capturedTenant = tenantStore.getStore();
    };

    sessionGate(req, res, next);

    assert.strictEqual(capturedTenant, validTenant);
  });

  await t.test('deve permitir acesso livre à rota /v1/internal/agent-tool sem exigir sessão', () => {
    process.env.ATLAS_REQUIRE_LOGIN = '1';

    const req: any = {
      path: '/v1/internal/agent-tool',
      headers: {},
      get: () => undefined
    };

    const res: any = {
      status: () => res,
      json: () => res
    };

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    sessionGate(req, res, next);

    assert.strictEqual(nextCalled, true);
  });
});

test('connections aliases require administrative role without changing resource IDs', async () => {
  const {accounts}=await import('../src/auth/accounts.js');
  const previousLogin=process.env.ATLAS_REQUIRE_LOGIN;
  const validate=accounts.validate.bind(accounts), isAdmin=accounts.isAdmin.bind(accounts);
  process.env.ATLAS_REQUIRE_LOGIN='1';
  accounts.validate=()=>({id:'usr_1234567890abcdef1234',email:'admin@example.test',name:'User'});
  accounts.isAdmin=()=>false;
  try {
    for(const path of ['/v1/connections/SecretID','/V1/Connections/SecretID']){
      let status=0;let passed=false;
      const res:any={status:(code:number)=>{status=code;return res;},json:()=>res};
      sessionGate({path,get:()=> 'session',headers:{}} as any,res,()=>{passed=true;});
      assert.equal(status,403);assert.equal(passed,false);
    }
  } finally {
    accounts.validate=validate;accounts.isAdmin=isAdmin;
    if(previousLogin===undefined)delete process.env.ATLAS_REQUIRE_LOGIN;else process.env.ATLAS_REQUIRE_LOGIN=previousLogin;
  }
});
