import test from 'node:test';
import assert from 'node:assert/strict';

import { isSameOrigin, validateS3Key, readJsonBody } from '../lib/api-security.js';

function makeReq(headers = {}, jsonImpl) {
  return {
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
    async json() {
      if (!jsonImpl) throw new Error('no json');
      return await jsonImpl();
    },
  };
}

test('isSameOrigin: allows missing Origin (non-browser clients)', () => {
  const req = makeReq({ host: 'example.com' });
  assert.equal(isSameOrigin(req), true);
});

test('isSameOrigin: rejects invalid Origin', () => {
  const req = makeReq({ host: 'example.com', origin: 'not-a-url' });
  assert.equal(isSameOrigin(req), false);
});

test('isSameOrigin: rejects mismatched origin/host', () => {
  const req = makeReq({ host: 'good.com', origin: 'https://evil.com' });
  assert.equal(isSameOrigin(req), false);
});

test('isSameOrigin: accepts matched origin/host', () => {
  const req = makeReq({ host: 'good.com', origin: 'https://good.com' });
  assert.equal(isSameOrigin(req), true);
});

test('readJsonBody: returns ok=false on invalid JSON', async () => {
  const req = makeReq({ host: 'x' });
  const res = await readJsonBody(req);
  assert.equal(res.ok, false);
});

test('validateS3Key: rejects traversal and backslashes', () => {
  const bad1 = validateS3Key('users/abc/../secret', { requiredPrefix: 'users/abc/' });
  assert.equal(bad1.ok, false);
  const bad2 = validateS3Key('users/abc\\evil', { requiredPrefix: 'users/abc/' });
  assert.equal(bad2.ok, false);
});

test('validateS3Key: rejects wrong prefix as Access denied', () => {
  const res = validateS3Key('users/other/file.png', { requiredPrefix: 'users/me/' });
  assert.equal(res.ok, false);
  assert.equal(res.error, 'Access denied');
});

test('validateS3Key: accepts safe key', () => {
  const res = validateS3Key('users/me/profile/avatar-1.png', { requiredPrefix: 'users/me/' });
  assert.equal(res.ok, true);
});

test('validateS3Key: rejects unsafe characters', () => {
  const res = validateS3Key('users/me/space here.png', { requiredPrefix: 'users/me/' });
  assert.equal(res.ok, false);
});

