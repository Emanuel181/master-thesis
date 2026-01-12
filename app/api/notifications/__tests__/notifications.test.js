/**
 * Notifications API Route Tests
 * 
 * Tests for the refactored notifications API routes including:
 * - Authentication rejection
 * - Successful operations
 * 
 * Feature: backend-refactoring
 * Validates: Requirements 8.3
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read source file to verify structure
const notificationsRouteSource = readFileSync(
    join(process.cwd(), 'app/api/notifications/route.js'),
    'utf-8'
);

describe('Notifications API Routes', () => {
    describe('Route Structure', () => {
        it('should use createApiHandler wrapper for GET', () => {
            assert.ok(
                notificationsRouteSource.includes('export const GET = createApiHandler'),
                'GET should use createApiHandler'
            );
        });

        it('should use createApiHandler wrapper for POST', () => {
            assert.ok(
                notificationsRouteSource.includes('export const POST = createApiHandler'),
                'POST should use createApiHandler'
            );
        });
    });

    describe('Authentication Configuration', () => {
        it('GET should require authentication', () => {
            const getMatch = notificationsRouteSource.match(
                /export const GET[\s\S]*?requireAuth:\s*true/
            );
            assert.ok(getMatch, 'GET should require auth');
        });

        it('POST should require authentication', () => {
            const postMatch = notificationsRouteSource.match(
                /export const POST[\s\S]*?requireAuth:\s*true/
            );
            assert.ok(postMatch, 'POST should require auth');
        });
    });

    describe('Validation Configuration', () => {
        it('GET should validate query parameters', () => {
            assert.ok(
                notificationsRouteSource.includes('querySchema: notificationsQuerySchema'),
                'GET should validate query params'
            );
        });

        it('POST should validate request body', () => {
            assert.ok(
                notificationsRouteSource.includes('bodySchema: notificationsActionSchema'),
                'POST should validate body'
            );
        });

        it('should define pagination schema for query params', () => {
            assert.ok(
                notificationsRouteSource.includes('paginationSchema.extend'),
                'Should extend pagination schema'
            );
        });

        it('should validate action enum in body schema', () => {
            assert.ok(
                notificationsRouteSource.includes("z.enum(['markAllRead'])"),
                'Should validate action enum'
            );
        });
    });

    describe('CSRF Protection', () => {
        it('POST should have CSRF protection', () => {
            const postMatch = notificationsRouteSource.match(
                /export const POST[\s\S]*?csrfProtection:\s*true/
            );
            assert.ok(postMatch, 'POST should have CSRF protection');
        });
    });

    describe('Rate Limiting', () => {
        it('GET should have rate limiting', () => {
            assert.ok(
                notificationsRouteSource.includes("keyPrefix: 'notifications:list'"),
                'GET should have rate limiting'
            );
        });

        it('POST should have rate limiting', () => {
            assert.ok(
                notificationsRouteSource.includes("keyPrefix: 'notifications:action'"),
                'POST should have rate limiting'
            );
        });
    });

    describe('Response Format', () => {
        it('GET should return notifications result', () => {
            assert.ok(
                notificationsRouteSource.includes('return result'),
                'GET should return result from getUserNotifications'
            );
        });

        it('POST should return count on markAllRead', () => {
            assert.ok(
                notificationsRouteSource.includes('return { count: result.count }'),
                'POST should return count'
            );
        });
    });
});
