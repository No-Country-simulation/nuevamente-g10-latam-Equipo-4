import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {boundaryViolations} from './boundaries.mjs';
const require=createRequire(resolve('apps/api/package.json'));
const ts=require('typescript');
const file='apps/web/components/example.tsx';
test('boundary gate rejects static, dynamic, require and relative private imports',()=>{
  const cases=["import x from '@/lib/server/proxy'", "export {x} from '@/lib/server/private'", "const x=import('@/lib/server/secret')", "const x=require('node:fs')", "import x = require('@invokta/core')", "import x from '../lib/server/private'", "import x from '../../api/src/context'"];
  for(const source of cases)assert.equal(boundaryViolations(ts,file,source).length,1,source);
});
test('boundary gate permits public contracts, UI modules and trusted server adapters',()=>{
  assert.deepEqual(boundaryViolations(ts,file,"import type {Trail} from '@atlas/contracts'; import {post} from '@/lib/api'"),[]);
  assert.deepEqual(boundaryViolations(ts,'apps/web/lib/server/proxy.ts',"import {readFile} from 'node:fs'"),[]);
});

test('desktop renderer can import SDK types but cannot run trusted SDK, Electron or private modules',()=>{
  const renderer='integrations/chatgpt-desktop/renderer/main.tsx';
  assert.deepEqual(boundaryViolations(ts,renderer,"import type {SessionState} from '@siwc/local'; import {ChatGPTConnectionCard} from '@siwc/react'"),[]);
  for(const source of ["import {createChatGPT} from '@siwc/local'", "import type {SessionState} from '@siwc/local'; const x=require('@siwc/local')", "import {ipcRenderer} from 'electron'", "import x from '../src/main.mjs'", "const x=import('node:fs')"])
    assert.equal(boundaryViolations(ts,renderer,source).length,1,source);
});
