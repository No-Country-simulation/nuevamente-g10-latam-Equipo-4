import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matchBaseline} from './ratchet.mjs';
const old={file:'old.ts',name:'hotspot',fingerprint:'same-body',cyclomatic:20};
test('a newly copied hotspot cannot inherit an unchanged legacy allowance',()=>{
  const copy={...old,file:'new.ts',name:'copy'};
  const matches=matchBaseline([copy,{...old}],[old]);
  assert.equal(matches.get(copy),undefined);
});
test('one unique relocation preserves the original measured baseline',()=>{
  const moved={...old,file:'moved.ts',name:'renamed'};
  assert.equal(matchBaseline([moved],[old]).get(moved),old);
});
test('ambiguous fingerprints are not silently matched to a convenient allowance',()=>{
  const item={...old,file:'new.ts'};
  assert.equal(matchBaseline([item],[old,{...old,file:'other.ts'}]).has(item),false);
});
