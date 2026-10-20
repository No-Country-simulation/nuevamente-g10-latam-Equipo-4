import assert from 'node:assert/strict';

// Runs against the local Next server and Nest gateway; rejects before any state change.
const origin = new URL(process.env.ATLAS_WEB_URL || 'http://127.0.0.1:3000').origin;
const base = `${origin}/api/atlas`;
const json = {'Origin': origin, 'Content-Type': 'application/json'};
const cases = [
  ['unsupported method', '/bootstrap', {method: 'PUT'}, 405],
  ['internal route', '/internal/judge', {}, 404],
  ['cross-origin write', '/generations', {method: 'POST', headers: {...json, Origin: 'https://invalid.example'}, body: '{}'}, 403],
  ['invalid generation on same origin', '/generations', {method: 'POST', headers: json, body: '{}'}, 400],
  ['JSON upload', '/documents', {method: 'POST', headers: json, body: '{}'}, 415],
  ['malformed multipart', '/documents', {method: 'POST', headers: {...json, 'Content-Type': 'multipart/form-data; boundary=invalid'}, body: 'broken'}, 400],
  ['oversized JSON', '/generations', {method: 'POST', headers: json, body: JSON.stringify({goal: 'x'.repeat(65_536)})}, 413],
];
for (const [name, path, options, expected] of cases) {
  const response = await fetch(`${base}${path}`, options);
  assert.equal(response.status, expected, name);
  console.log(`PASS ${name}: ${response.status}`);
}
const form = new FormData();
form.append('file', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]), 'oversize.txt');
const response = await fetch(`${base}/documents`, {method: 'POST', headers: {Origin: origin}, body: form});
assert.equal(response.status, 413, 'actual file size must be limited to 10 MiB');
console.log('PASS actual file limit: 413');
