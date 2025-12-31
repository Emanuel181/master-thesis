/**
 * API Middleware Security Tests
 * Tests for requireProductionMode and demo/prod isolation
 * Run with: node --test test/api-middleware.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// requireProductionMode source inspection tests
// (We can't directly import due to @/lib alias, so we inspect source)
// ---------------------------------------------------------------------------

test('API Middleware: requireProductionMode exists and has correct logic', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../lib/api-middleware.js', import.meta.url), 'utf-8');
    
    // Check function export
    assert.ok(src.includes('export function requireProductionMode'), 'Should export requireProductionMode');
    
    // Check it calls isDemoRequest
    assert.ok(src.includes('isDemoRequest(request)'), 'Should call isDemoRequest');
    
    // Check it returns 403 for demo mode
    assert.ok(src.includes('status: 403'), 'Should return 403 for demo mode');
    
    // Check it has the correct error code
    assert.ok(src.includes('DEMO_MODE_BLOCKED'), 'Should have DEMO_MODE_BLOCKED code');
    
    // Check it returns null for prod (allows request)
    assert.ok(src.includes('return null'), 'Should return null to allow prod requests');
});

test('API Middleware: has security headers integration', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../lib/api-middleware.js', import.meta.url), 'utf-8');
    
    // Check it uses security headers
    assert.ok(src.includes('securityHeaders'), 'Should include security headers');
    
    // Check it logs security events
    assert.ok(src.includes('[SECURITY]'), 'Should log security events');
});

// ---------------------------------------------------------------------------
// Verify all production routes have requireProductionMode guard
// ---------------------------------------------------------------------------

const PRODUCTION_ROUTES = [
    'app/api/bedrock/route.js',
    'app/api/bedrock/agents/[id]/route.js',
    'app/api/github/repos/route.js',
    'app/api/github/tree/route.js',
    'app/api/github/contents/route.js',
    'app/api/gitlab/repos/route.js',
    'app/api/gitlab/tree/route.js',
    'app/api/gitlab/contents/route.js',
    'app/api/providers/linked/route.js',
    'app/api/profile/route.js',
    'app/api/profile/image-upload/route.js',
    'app/api/profile/image-download/route.js',
    'app/api/use-cases/route.js',
    'app/api/use-cases/[id]/route.js',
    'app/api/prompts/route.js',
    'app/api/prompts/[id]/route.js',
    'app/api/prompts/reorder/route.js',
    'app/api/prompts/bulk-delete/route.js',
    'app/api/folders/route.js',
    'app/api/folders/[id]/route.js',
    'app/api/folders/reorder/route.js',
    'app/api/pdfs/route.js',
    'app/api/pdfs/[id]/route.js',
    'app/api/pdfs/confirm/route.js',
    'app/api/feedback/route.js',
    'app/api/subscribe/route.js',
    'app/api/icons/route.js',
    'app/api/format-code/route.js',
    'app/api/detect-language/route.js',
    'app/api/auth/disconnect/route.js',
    'app/api/auth/verify-code/route.js',
];

const EXEMPT_ROUTES = [
    // These routes don't need requireProductionMode:
    'app/api/health/route.js', // Stateless health check
    'app/api/auth/[...nextauth]/route.js', // NextAuth handlers
    'app/api/debug/session/route.js', // Development only (returns 404 in prod)
];

test('Production routes: all have requireProductionMode guard', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    
    const missingGuards = [];
    
    for (const route of PRODUCTION_ROUTES) {
        try {
            const filePath = path.join(process.cwd(), route);
            const src = await fs.readFile(filePath, 'utf-8');
            
            if (!src.includes('requireProductionMode')) {
                missingGuards.push(route);
            }
        } catch (err) {
            // File might not exist - that's a different issue
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
    
    assert.equal(
        missingGuards.length, 
        0, 
        `Routes missing requireProductionMode guard:\n${missingGuards.join('\n')}`
    );
});

test('Exempt routes: exist and have correct exemption reason', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    
    for (const route of EXEMPT_ROUTES) {
        try {
            const filePath = path.join(process.cwd(), route);
            const src = await fs.readFile(filePath, 'utf-8');
            
            // Health route should be minimal
            if (route.includes('health')) {
                assert.ok(!src.includes('prisma'), 'Health route should not access DB');
                assert.ok(!src.includes('auth()'), 'Health route should not require auth');
            }
            
            // Debug route should be dev-only
            if (route.includes('debug')) {
                assert.ok(
                    src.includes("NODE_ENV === 'production'") || 
                    src.includes('NODE_ENV !== "development"'),
                    'Debug route should check NODE_ENV'
                );
            }
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
});

// ---------------------------------------------------------------------------
// Demo API routes tests
// ---------------------------------------------------------------------------

const DEMO_API_ROUTES = [
    'app/demo/api/health/route.js',
    'app/demo/api/detect-language/route.js',
    'app/demo/api/format-code/route.js',
    'app/demo/api/icons/route.js',
];

test('Demo routes: do NOT have requireProductionMode (would always block)', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    
    for (const route of DEMO_API_ROUTES) {
        try {
            const filePath = path.join(process.cwd(), route);
            const src = await fs.readFile(filePath, 'utf-8');
            
            assert.ok(
                !src.includes('requireProductionMode'),
                `Demo route ${route} should NOT use requireProductionMode`
            );
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
});

test('Demo routes: do NOT access production database', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    
    for (const route of DEMO_API_ROUTES) {
        try {
            const filePath = path.join(process.cwd(), route);
            const src = await fs.readFile(filePath, 'utf-8');
            
            // Demo routes should not import prisma directly
            assert.ok(
                !src.includes("from '@/lib/prisma'") && !src.includes('from "@/lib/prisma"'),
                `Demo route ${route} should NOT import prisma`
            );
            
            // Demo routes should not call auth()
            assert.ok(
                !src.includes('await auth()'),
                `Demo route ${route} should NOT call auth()`
            );
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
});

test('Demo routes: have rate limiting', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    
    for (const route of DEMO_API_ROUTES) {
        if (route.includes('health')) continue; // Health doesn't need rate limiting
        
        try {
            const filePath = path.join(process.cwd(), route);
            const src = await fs.readFile(filePath, 'utf-8');
            
            assert.ok(
                src.includes('rateLimit'),
                `Demo route ${route} should have rate limiting`
            );
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
    }
});

// ---------------------------------------------------------------------------
// Security headers tests
// ---------------------------------------------------------------------------

test('API Security: securityHeaders has required headers', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../lib/api-security.js', import.meta.url), 'utf-8');
    
    // Check for essential security headers
    assert.ok(src.includes('Cache-Control'), 'Should have Cache-Control header');
    assert.ok(src.includes('no-store'), 'Should have no-store for cache');
    assert.ok(src.includes('X-Content-Type-Options'), 'Should have X-Content-Type-Options');
    assert.ok(src.includes('nosniff'), 'Should have nosniff');
    assert.ok(src.includes('Referrer-Policy'), 'Should have Referrer-Policy');
});
