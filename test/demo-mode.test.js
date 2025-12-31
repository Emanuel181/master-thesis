import test from 'node:test';
import assert from 'node:assert/strict';

import { DEMO_ROUTE_PREFIX, isDemoRequest, validateRequestMode } from '../lib/demo-mode.js';

const demoPath = `${DEMO_ROUTE_PREFIX}/hello`;
const prodUrl = 'https://example.com/api';

function makeRequest(url = prodUrl, headers = {}) {
  return new Request(url, { headers });
}

test('isDemoRequest returns true when referer is under /demo', () => {
  const req = makeRequest(prodUrl, { referer: `https://example.com${demoPath}` });
  assert.equal(isDemoRequest(req), true);
});

test('isDemoRequest returns true when demo header is set', () => {
  const req = makeRequest(prodUrl, { 'x-vulniq-demo-mode': 'true' });
  assert.equal(isDemoRequest(req), true);
});

test('isDemoRequest fails closed on invalid referer', () => {
  const req = makeRequest(prodUrl, { referer: 'not-a-url' });
  assert.equal(isDemoRequest(req), false);
});

test('validateRequestMode blocks demo by default', () => {
  const req = makeRequest(prodUrl, { referer: `https://example.com${demoPath}` });
  const result = validateRequestMode(req);
  assert.equal(result.allowed, false);
  assert.equal(result.isDemoMode, true);
  assert.ok(result.blockResponse instanceof Response);
  assert.equal(result.blockResponse.status, 403);
});

test('validateRequestMode allows when allowDemo=true', () => {
  const req = makeRequest(prodUrl, { referer: `https://example.com${demoPath}` });
  const result = validateRequestMode(req, { allowDemo: true });
  assert.equal(result.allowed, true);
  assert.equal(result.isDemoMode, true);
});
