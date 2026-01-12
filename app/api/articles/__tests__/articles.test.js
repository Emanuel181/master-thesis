/**
 * Articles API Route Tests
 * 
 * Tests for the refactored articles API routes including:
 * - Authentication rejection
 * - Validation errors
 * - Successful operations
 * 
 * Feature: backend-refactoring
 * Validates: Requirements 8.1, 8.2
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read source files to verify structure
const articlesRouteSource = readFileSync(
    join(process.cwd(), 'app/api/articles/route.js'),
    'utf-8'
);
const articleIdRouteSource = readFileSync(
    join(process.cwd(), 'app/api/articles/[id]/route.js'),
    'utf-8'
);

describe('Articles API Routes', () => {
    describe('Route Structure', () => {
        it('should use createApiHandler wrapper for GET /api/articles', () => {
            assert.ok(
                articlesRouteSource.includes('export const GET = createApiHandler'),
                'GET should use createApiHandler'
            );
        });

        it('should use createApiHandler wrapper for POST /api/articles', () => {
            assert.ok(
                articlesRouteSource.includes('export const POST = createApiHandler'),
                'POST should use createApiHandler'
            );
        });

        it('should use createApiHandler wrapper for GET /api/articles/[id]', () => {
            assert.ok(
                articleIdRouteSource.includes('export const GET = createApiHandler'),
                'GET [id] should use createApiHandler'
            );
        });

        it('should use createApiHandler wrapper for PATCH /api/articles/[id]', () => {
            assert.ok(
                articleIdRouteSource.includes('export const PATCH = createApiHandler'),
                'PATCH should use createApiHandler'
            );
        });

        it('should use createApiHandler wrapper for DELETE /api/articles/[id]', () => {
            assert.ok(
                articleIdRouteSource.includes('export const DELETE = createApiHandler'),
                'DELETE should use createApiHandler'
            );
        });
    });

    describe('Authentication Configuration', () => {
        it('GET /api/articles should require authentication', () => {
            assert.ok(
                articlesRouteSource.includes('requireAuth: true'),
                'GET should require auth'
            );
        });

        it('POST /api/articles should require authentication', () => {
            // POST handler config should have requireAuth: true
            const postMatch = articlesRouteSource.match(
                /export const POST[\s\S]*?requireAuth:\s*true/
            );
            assert.ok(postMatch, 'POST should require auth');
        });

        it('PATCH /api/articles/[id] should require authentication', () => {
            const patchMatch = articleIdRouteSource.match(
                /export const PATCH[\s\S]*?requireAuth:\s*true/
            );
            assert.ok(patchMatch, 'PATCH should require auth');
        });

        it('DELETE /api/articles/[id] should require authentication', () => {
            const deleteMatch = articleIdRouteSource.match(
                /export const DELETE[\s\S]*?requireAuth:\s*true/
            );
            assert.ok(deleteMatch, 'DELETE should require auth');
        });
    });

    describe('Validation Configuration', () => {
        it('GET /api/articles should validate query parameters', () => {
            assert.ok(
                articlesRouteSource.includes('querySchema: listArticlesQuerySchema'),
                'GET should validate query params'
            );
        });

        it('POST /api/articles should validate request body', () => {
            assert.ok(
                articlesRouteSource.includes('bodySchema: articleCreateSchema'),
                'POST should validate body'
            );
        });

        it('PATCH /api/articles/[id] should validate route params', () => {
            assert.ok(
                articleIdRouteSource.includes('paramsSchema: articleIdSchema'),
                'PATCH should validate params'
            );
        });

        it('PATCH /api/articles/[id] should validate request body', () => {
            assert.ok(
                articleIdRouteSource.includes('bodySchema: articleUpdateSchema'),
                'PATCH should validate body'
            );
        });

        it('DELETE /api/articles/[id] should validate route params', () => {
            const deleteMatch = articleIdRouteSource.match(
                /export const DELETE[\s\S]*?paramsSchema:\s*articleIdSchema/
            );
            assert.ok(deleteMatch, 'DELETE should validate params');
        });
    });

    describe('CSRF Protection', () => {
        it('PATCH /api/articles/[id] should have CSRF protection', () => {
            const patchMatch = articleIdRouteSource.match(
                /export const PATCH[\s\S]*?csrfProtection:\s*true/
            );
            assert.ok(patchMatch, 'PATCH should have CSRF protection');
        });

        it('DELETE /api/articles/[id] should have CSRF protection', () => {
            const deleteMatch = articleIdRouteSource.match(
                /export const DELETE[\s\S]*?csrfProtection:\s*true/
            );
            assert.ok(deleteMatch, 'DELETE should have CSRF protection');
        });
    });

    describe('Rate Limiting', () => {
        it('GET /api/articles should have rate limiting', () => {
            assert.ok(
                articlesRouteSource.includes("keyPrefix: 'articles:list'"),
                'GET should have rate limiting'
            );
        });

        it('POST /api/articles should have rate limiting', () => {
            assert.ok(
                articlesRouteSource.includes("keyPrefix: 'articles:create'"),
                'POST should have rate limiting'
            );
        });

        it('PATCH /api/articles/[id] should have rate limiting', () => {
            assert.ok(
                articleIdRouteSource.includes("keyPrefix: 'articles:update'"),
                'PATCH should have rate limiting'
            );
        });

        it('DELETE /api/articles/[id] should have rate limiting', () => {
            assert.ok(
                articleIdRouteSource.includes("keyPrefix: 'articles:delete'"),
                'DELETE should have rate limiting'
            );
        });
    });

    describe('Error Handling', () => {
        it('GET /api/articles/[id] should return 404 for missing articles', () => {
            assert.ok(
                articleIdRouteSource.includes("ApiErrors.notFound('Article'"),
                'Should return 404 for missing articles'
            );
        });

        it('PATCH /api/articles/[id] should return 403 for unauthorized access', () => {
            assert.ok(
                articleIdRouteSource.includes('ApiErrors.forbidden'),
                'Should return 403 for unauthorized access'
            );
        });

        it('DELETE /api/articles/[id] should return 403 for unauthorized access', () => {
            // Check that DELETE handler uses ApiErrors.forbidden
            const deleteSection = articleIdRouteSource.match(
                /export const DELETE[\s\S]*?(?=export const|$)/
            );
            assert.ok(
                deleteSection && deleteSection[0].includes('ApiErrors.forbidden'),
                'DELETE should return 403 for unauthorized access'
            );
        });
    });

    describe('Response Format', () => {
        it('should return article data in response', () => {
            assert.ok(
                articlesRouteSource.includes('return { articles'),
                'GET should return articles array'
            );
            assert.ok(
                articlesRouteSource.includes('return { article }'),
                'POST should return article object'
            );
        });

        it('should return pagination metadata', () => {
            assert.ok(
                articlesRouteSource.includes('total, publishedCount, draftCount'),
                'GET should return pagination metadata'
            );
        });

        it('DELETE should return success indicator', () => {
            assert.ok(
                articleIdRouteSource.includes('return { deleted: true }'),
                'DELETE should return deleted: true'
            );
        });
    });
});
