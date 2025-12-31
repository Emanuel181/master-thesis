/**
 * SSRF Prevention Tests
 * Tests for environment variable-based SSRF vulnerabilities
 * Run with: node --test test/ssrf-prevention.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Subscribe route SSRF prevention
// ---------------------------------------------------------------------------

test('Subscribe route: does NOT use NEXT_PUBLIC_BREVO_BASE_URL', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../app/api/subscribe/route.js', import.meta.url), 'utf-8');
    
    // The NEXT_PUBLIC_ prefix exposes env vars to the client, but also
    // could be manipulated in some edge cases. The fix hardcodes the URL.
    assert.ok(
        !src.includes('NEXT_PUBLIC_BREVO_BASE_URL'),
        'Subscribe route should NOT use NEXT_PUBLIC_BREVO_BASE_URL (SSRF risk)'
    );
    
    // Should have a hardcoded safe URL
    assert.ok(
        src.includes('https://api.brevo.com/v3'),
        'Subscribe route should have hardcoded Brevo API URL'
    );
});

test('Subscribe route: has input validation with zod', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../app/api/subscribe/route.js', import.meta.url), 'utf-8');
    
    assert.ok(src.includes("from 'zod'") || src.includes('from "zod"'), 'Should import zod');
    assert.ok(src.includes('z.string()'), 'Should use zod string validation');
    assert.ok(src.includes('.email('), 'Should validate email format');
});

test('Subscribe route: has rate limiting', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../app/api/subscribe/route.js', import.meta.url), 'utf-8');
    
    assert.ok(src.includes('rateLimit'), 'Should have rate limiting');
});

test('Subscribe route: has CSRF protection', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../app/api/subscribe/route.js', import.meta.url), 'utf-8');
    
    assert.ok(src.includes('isSameOrigin'), 'Should have CSRF protection with isSameOrigin');
});

// ---------------------------------------------------------------------------
// GitLab API SSRF considerations
// ---------------------------------------------------------------------------

test('GitLab tree/contents routes: use env var but have input validation', async () => {
    const fs = await import('node:fs/promises');
    
    // Only tree and contents routes take user-provided owner/repo parameters
    // The repos route fetches the authenticated user's own repos
    const routes = [
        '../app/api/gitlab/tree/route.js',
        '../app/api/gitlab/contents/route.js',
    ];
    
    for (const route of routes) {
        try {
            const src = await fs.readFile(new URL(route, import.meta.url), 'utf-8');
            
            // GitLab routes use GITLAB_BASE_URL but this is acceptable because:
            // 1. It's a server-only env var (not NEXT_PUBLIC_)
            // 2. It defaults to 'https://gitlab.com'
            // 3. There's input validation on user-provided parameters
            
            // Verify input validation exists
            assert.ok(
                src.includes('ownerRepoPattern'),
                `${route} should have input validation pattern`
            );
            
            // Verify it requires authentication
            assert.ok(
                src.includes('await auth()'),
                `${route} should require authentication`
            );
            
            // Verify demo mode is blocked
            assert.ok(
                src.includes('requireProductionMode'),
                `${route} should block demo mode`
            );
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
});

test('GitLab repos route: requires auth and blocks demo mode', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../app/api/gitlab/repos/route.js', import.meta.url), 'utf-8');
    
    // Repos route fetches user's own repos - doesn't need ownerRepoPattern
    // But it should still require auth and block demo
    assert.ok(src.includes('await auth()'), 'Should require authentication');
    assert.ok(src.includes('requireProductionMode'), 'Should block demo mode');
});

// ---------------------------------------------------------------------------
// Demo route rate limit namespace isolation
// ---------------------------------------------------------------------------

test('Demo routes: use env: demo for rate limiting', async () => {
    const fs = await import('node:fs/promises');
    
    const routes = [
        '../app/demo/api/icons/route.js',
        '../app/demo/api/detect-language/route.js',
        '../app/demo/api/format-code/route.js',
    ];
    
    for (const route of routes) {
        try {
            const src = await fs.readFile(new URL(route, import.meta.url), 'utf-8');
            
            // Verify demo routes use env: 'demo' parameter
            assert.ok(
                src.includes("env: 'demo'"),
                `${route} should use env: 'demo' for rate limiting`
            );
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
});

// ---------------------------------------------------------------------------
// Rate limit module namespace support
// ---------------------------------------------------------------------------

test('Rate limit module: supports env parameter for namespacing', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../lib/rate-limit.js', import.meta.url), 'utf-8');
    
    // Check that the rate limit function accepts an env parameter
    assert.ok(
        src.includes('env') && src.includes("'prod'") && src.includes("'demo'"),
        'Rate limit should support env parameter with prod/demo values'
    );
    
    // Check that keys are namespaced
    assert.ok(
        src.includes('demo:') && src.includes('namespacedKey'),
        'Rate limit should namespace keys by environment'
    );
});

// ---------------------------------------------------------------------------
// Empty route file cleanup verification
// ---------------------------------------------------------------------------

test('Import-url route: empty file should be removed', async () => {
    const fs = await import('node:fs/promises');
    
    try {
        await fs.access(new URL('../app/api/pdfs/import-url/route.js', import.meta.url));
        // If we get here, the file exists
        assert.fail('Empty import-url route.js should have been deleted');
    } catch (err) {
        // File not found is expected
        assert.equal(err.code, 'ENOENT', 'File should not exist');
    }
});
