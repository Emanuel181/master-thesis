/**
 * Integration / isolation tests for demo vs prod separation
 * Run with: node --test test/isolation.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// S3 environment isolation tests
// ---------------------------------------------------------------------------
import { getS3Config, assertKeyPrefix } from '../lib/s3-env.js';

test('S3: prod config returns prod bucket and prefix', () => {
    const cfg = getS3Config('prod');
    assert.ok(cfg.bucket, 'bucket should be defined');
    assert.equal(cfg.prefix, 'users/', 'prod prefix should be users/');
});

test('S3: demo config returns demo prefix', () => {
    const cfg = getS3Config('demo');
    assert.equal(cfg.prefix, 'demo/', 'demo prefix should be demo/');
});

test('S3: assertKeyPrefix throws for wrong prefix (prod)', () => {
    assert.throws(
        () => assertKeyPrefix('prod', 'demo/some/key'),
        /does not start with required prefix/
    );
});

test('S3: assertKeyPrefix throws for wrong prefix (demo)', () => {
    assert.throws(
        () => assertKeyPrefix('demo', 'users/some/key'),
        /does not start with required prefix/
    );
});

test('S3: assertKeyPrefix passes for correct prefix (prod)', () => {
    assert.doesNotThrow(() => assertKeyPrefix('prod', 'users/abc/file.pdf'));
});

test('S3: assertKeyPrefix passes for correct prefix (demo)', () => {
    assert.doesNotThrow(() => assertKeyPrefix('demo', 'demo/users/abc/file.pdf'));
});

// ---------------------------------------------------------------------------
// Demo-mode detection tests
// ---------------------------------------------------------------------------
import { isDemoRequest, validateRequestMode, DEMO_ROUTE_PREFIX } from '../lib/demo-mode.js';

function makeRequest(url, headers = {}) {
    return new Request(url, { headers });
}

test('isDemoRequest: true when referer under /demo', () => {
    const req = makeRequest('https://example.com/api/test', {
        referer: 'https://example.com/demo/home',
    });
    assert.equal(isDemoRequest(req), true);
});

test('isDemoRequest: true when x-vulniq-demo-mode header is set', () => {
    const req = makeRequest('https://example.com/api/test', {
        'x-vulniq-demo-mode': 'true',
    });
    assert.equal(isDemoRequest(req), true);
});

test('isDemoRequest: false for prod request', () => {
    const req = makeRequest('https://example.com/api/test', {
        referer: 'https://example.com/dashboard',
    });
    assert.equal(isDemoRequest(req), false);
});

test('validateRequestMode: blocks demo by default', () => {
    const req = makeRequest('https://example.com/api/test', {
        referer: `https://example.com${DEMO_ROUTE_PREFIX}/page`,
    });
    const result = validateRequestMode(req);
    assert.equal(result.allowed, false);
    assert.equal(result.isDemoMode, true);
    assert.ok(result.blockResponse);
});

test('validateRequestMode: allows demo when allowDemo=true', () => {
    const req = makeRequest('https://example.com/api/test', {
        referer: `https://example.com${DEMO_ROUTE_PREFIX}/page`,
    });
    const result = validateRequestMode(req, { allowDemo: true });
    assert.equal(result.allowed, true);
    assert.equal(result.isDemoMode, true);
});

// ---------------------------------------------------------------------------
// Rate-limit namespace isolation test (unit-level, no DB)
// ---------------------------------------------------------------------------
test('Rate-limit: demo key prefix logic exists in source', async () => {
    // We cannot import rate-limit.js directly because it uses @/lib alias.
    // This test validates the key-prefixing logic via source inspection.
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../lib/rate-limit.js', import.meta.url), 'utf-8');
    assert.ok(src.includes("demo:"), 'rate-limit.js should namespace demo keys with "demo:" prefix');
    assert.ok(src.includes("namespacedKey"), 'rate-limit.js should use namespacedKey variable');
});

// ---------------------------------------------------------------------------
// API security helper tests
// ---------------------------------------------------------------------------
import { isSameOrigin, validateS3Key } from '../lib/api-security.js';

test('isSameOrigin: rejects cross-origin', () => {
    const req = {
        headers: { get: (n) => (n === 'origin' ? 'https://evil.com' : 'example.com') },
    };
    assert.equal(isSameOrigin(req), false);
});

test('isSameOrigin: allows same origin', () => {
    const req = {
        headers: { get: (n) => (n === 'origin' ? 'https://example.com' : 'example.com') },
    };
    assert.equal(isSameOrigin(req), true);
});

test('validateS3Key: rejects traversal', () => {
    const result = validateS3Key('users/../etc/passwd', { requiredPrefix: 'users/' });
    assert.equal(result.ok, false);
});

test('validateS3Key: rejects wrong prefix', () => {
    const result = validateS3Key('other/file.pdf', { requiredPrefix: 'users/' });
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Access denied');
});

test('validateS3Key: accepts valid key', () => {
    const result = validateS3Key('users/abc/file.pdf', { requiredPrefix: 'users/' });
    assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// S3 Key Generation tests
// ---------------------------------------------------------------------------
import { generateS3Key, generatePromptS3Key, generateProfileImageS3Key } from '../lib/s3-env.js';

test('S3: generateS3Key for prod starts with users/', () => {
    const key = generateS3Key('prod', 'user123', 'case456', 'file.pdf');
    assert.ok(key.startsWith('users/'), `Expected prod key to start with users/, got: ${key}`);
    assert.ok(key.includes('user123'), 'Key should include userId');
    assert.ok(key.includes('case456'), 'Key should include useCaseId');
});

test('S3: generateS3Key for demo starts with demo/', () => {
    const key = generateS3Key('demo', 'user123', 'case456', 'file.pdf');
    assert.ok(key.startsWith('demo/'), `Expected demo key to start with demo/, got: ${key}`);
    assert.ok(key.includes('user123'), 'Key should include userId');
});

test('S3: generatePromptS3Key for prod starts with users/', () => {
    const key = generatePromptS3Key('prod', 'user123', 'reviewer');
    assert.ok(key.startsWith('users/'), `Expected prod key to start with users/, got: ${key}`);
});

test('S3: generatePromptS3Key for demo starts with demo/', () => {
    const key = generatePromptS3Key('demo', 'user123', 'reviewer');
    assert.ok(key.startsWith('demo/'), `Expected demo key to start with demo/, got: ${key}`);
});

test('S3: generateProfileImageS3Key for prod starts with users/', () => {
    const key = generateProfileImageS3Key('prod', 'user123', 'avatar', 'jpg');
    assert.ok(key.startsWith('users/'), `Expected prod key to start with users/, got: ${key}`);
});

test('S3: generateProfileImageS3Key for demo starts with demo/', () => {
    const key = generateProfileImageS3Key('demo', 'user123', 'avatar', 'jpg');
    assert.ok(key.startsWith('demo/'), `Expected demo key to start with demo/, got: ${key}`);
});

// ---------------------------------------------------------------------------
// Demo Mode Fail-Closed Tests
// ---------------------------------------------------------------------------
test('isDemoRequest: fails closed on missing referer and header', () => {
    const req = makeRequest('https://example.com/api/test', {});
    assert.equal(isDemoRequest(req), false, 'Should fail closed (treat as production)');
});

test('isDemoRequest: fails closed on malformed referer', () => {
    const req = makeRequest('https://example.com/api/test', {
        referer: 'not-a-valid-url',
    });
    assert.equal(isDemoRequest(req), false, 'Should fail closed on invalid referer');
});

test('validateRequestMode: returns 403 blockResponse for demo request', () => {
    const req = makeRequest('https://example.com/api/test', {
        'x-vulniq-demo-mode': 'true',
    });
    const result = validateRequestMode(req);
    assert.equal(result.allowed, false);
    assert.equal(result.isDemoMode, true);
    assert.ok(result.blockResponse instanceof Response);
    assert.equal(result.blockResponse.status, 403);
});

// ---------------------------------------------------------------------------
// Proxy header tests (source inspection)
// ---------------------------------------------------------------------------
test('Proxy: strips cookies and auth for demo routes', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../proxy.js', import.meta.url), 'utf-8');
    
    // Check that demo routes have cookies stripped
    assert.ok(src.includes("requestHeaders.delete('cookie')"), 'Proxy should delete cookies for demo');
    assert.ok(src.includes("requestHeaders.delete('authorization')"), 'Proxy should delete authorization for demo');
    
    // Check that demo mode header is set
    assert.ok(src.includes("x-vulniq-demo-mode"), 'Proxy should set demo mode header');
    
    // Check that prod mode sanitizes the header
    assert.ok(src.includes("x-vulniq-demo-mode', 'false'"), 'Proxy should set demo header to false for prod');
});

test('Proxy: blocks demo access to /api/* routes', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../proxy.js', import.meta.url), 'utf-8');
    
    assert.ok(src.includes('DEMO_MODE_BLOCKED'), 'Proxy should have DEMO_MODE_BLOCKED error code');
    assert.ok(src.includes('Demo mode cannot access production APIs'), 'Proxy should have demo blocked message');
});

// ---------------------------------------------------------------------------
// Storage key isolation tests
// ---------------------------------------------------------------------------
import { getStorageKey, DEMO_STORAGE_PREFIX, PROD_STORAGE_PREFIX } from '../lib/demo-mode.js';

test('Storage: getStorageKey returns different keys for demo vs prod', () => {
    const demoKey = getStorageKey('test', true);
    const prodKey = getStorageKey('test', false);
    
    assert.ok(demoKey.startsWith(DEMO_STORAGE_PREFIX), 'Demo key should have demo prefix');
    assert.ok(prodKey.startsWith(PROD_STORAGE_PREFIX), 'Prod key should have prod prefix');
    assert.notEqual(demoKey, prodKey, 'Demo and prod keys should be different');
});

test('Storage: prefixes are distinct', () => {
    assert.notEqual(DEMO_STORAGE_PREFIX, PROD_STORAGE_PREFIX, 'Storage prefixes must be different');
    // Note: vulniq_demo_ does share the vulniq_ base, but the full prefix is different
    // which ensures keys cannot collide
    assert.ok(DEMO_STORAGE_PREFIX.includes('demo'), 'Demo prefix should contain "demo"');
    assert.ok(!PROD_STORAGE_PREFIX.includes('demo'), 'Prod prefix should NOT contain "demo"');
});
