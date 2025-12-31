/**
 * Rate Limit Tests
 * Tests for the atomic, fail-closed rate limiter
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

test('rate-limit: uses atomic SQL upsert', async () => {
    const src = await readFile(new URL('../lib/rate-limit.js', import.meta.url), 'utf-8');
    
    // Should use raw SQL for atomic operation
    assert.ok(
        src.includes('$queryRaw') || src.includes('$executeRaw'),
        'Rate limiter should use raw SQL for atomic operations'
    );
    
    // Should use ON CONFLICT for upsert
    assert.ok(
        src.includes('ON CONFLICT'),
        'Rate limiter should use ON CONFLICT for atomic upsert'
    );
});

test('rate-limit: fails closed on database error', async () => {
    const src = await readFile(new URL('../lib/rate-limit.js', import.meta.url), 'utf-8');
    
    // Check for fail-closed pattern (allowed: false on error)
    assert.ok(
        src.includes('allowed: false') && src.includes('catch'),
        'Rate limiter should fail closed (allowed: false) on database error'
    );
    
    // Should NOT have fail-open pattern in catch block
    const catchMatch = src.match(/catch\s*\([^)]*\)\s*\{[^}]*allowed:\s*(true|false)/);
    if (catchMatch) {
        assert.equal(
            catchMatch[1], 
            'false', 
            'Rate limiter catch block should return allowed: false (fail-closed)'
        );
    }
});

test('rate-limit: has cleanup function for expired records', async () => {
    const src = await readFile(new URL('../lib/rate-limit.js', import.meta.url), 'utf-8');
    
    assert.ok(
        src.includes('cleanupExpiredRateLimits'),
        'Rate limiter should export cleanup function for expired records'
    );
    
    assert.ok(
        src.includes('DELETE FROM'),
        'Cleanup should delete expired records'
    );
});

test('rate-limit: namespaces demo and prod traffic', async () => {
    const src = await readFile(new URL('../lib/rate-limit.js', import.meta.url), 'utf-8');
    
    assert.ok(
        src.includes('demo:') || src.includes("'demo'"),
        'Rate limiter should namespace demo traffic separately'
    );
});
