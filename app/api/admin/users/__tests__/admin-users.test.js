/**
 * Admin Users API Route Tests
 * 
 * Tests for the refactored admin users API route including:
 * - Admin authentication
 * - Pagination and filtering
 * 
 * Feature: backend-refactoring
 * Validates: Requirements 8.4
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Read source file to verify structure
const adminUsersRouteSource = readFileSync(
    join(process.cwd(), 'app/api/admin/users/route.js'),
    'utf-8'
);

describe('Admin Users API Routes', () => {
    describe('Route Structure', () => {
        it('should export GET handler', () => {
            assert.ok(
                adminUsersRouteSource.includes('export async function GET'),
                'Should export GET handler'
            );
        });

        it('should use requireAdmin for authentication', () => {
            assert.ok(
                adminUsersRouteSource.includes('requireAdmin'),
                'Should use requireAdmin for admin auth'
            );
        });

        it('should generate requestId', () => {
            assert.ok(
                adminUsersRouteSource.includes('generateRequestId()'),
                'Should generate requestId'
            );
        });
    });

    describe('Admin Authentication', () => {
        it('should check admin authentication first', () => {
            assert.ok(
                adminUsersRouteSource.includes('const adminCheck = await requireAdmin()'),
                'Should call requireAdmin'
            );
        });

        it('should return error if admin check fails', () => {
            assert.ok(
                adminUsersRouteSource.includes('if (adminCheck.error) return adminCheck.error'),
                'Should return error on failed admin check'
            );
        });
    });

    describe('Validation Configuration', () => {
        it('should define query schema with pagination', () => {
            assert.ok(
                adminUsersRouteSource.includes('paginationSchema.extend'),
                'Should extend pagination schema'
            );
        });

        it('should validate search parameter', () => {
            assert.ok(
                adminUsersRouteSource.includes("search: z.string().max(200)"),
                'Should validate search parameter'
            );
        });

        it('should validate filter enum', () => {
            assert.ok(
                adminUsersRouteSource.includes("z.enum(['all', 'warned'])"),
                'Should validate filter enum'
            );
        });

        it('should validate query parameters', () => {
            assert.ok(
                adminUsersRouteSource.includes('adminUsersQuerySchema.safeParse'),
                'Should validate query params with schema'
            );
        });

        it('should return validation errors with field details', () => {
            assert.ok(
                adminUsersRouteSource.includes("code: 'VALIDATION_ERROR'") &&
                adminUsersRouteSource.includes('fields:'),
                'Should return validation errors with field details'
            );
        });
    });

    describe('Security Headers', () => {
        it('should include security headers in responses', () => {
            assert.ok(
                adminUsersRouteSource.includes('securityHeaders'),
                'Should include security headers'
            );
        });

        it('should use successResponse helper', () => {
            assert.ok(
                adminUsersRouteSource.includes('successResponse('),
                'Should use successResponse helper'
            );
        });
    });

    describe('Pagination and Filtering', () => {
        it('should support page parameter', () => {
            assert.ok(
                adminUsersRouteSource.includes("searchParams.get('page')"),
                'Should support page parameter'
            );
        });

        it('should support limit parameter', () => {
            assert.ok(
                adminUsersRouteSource.includes("searchParams.get('limit')"),
                'Should support limit parameter'
            );
        });

        it('should support search parameter', () => {
            assert.ok(
                adminUsersRouteSource.includes("searchParams.get('search')"),
                'Should support search parameter'
            );
        });

        it('should support filter parameter', () => {
            assert.ok(
                adminUsersRouteSource.includes("searchParams.get('filter')"),
                'Should support filter parameter'
            );
        });

        it('should calculate skip for pagination', () => {
            assert.ok(
                adminUsersRouteSource.includes('(page - 1) * limit'),
                'Should calculate skip for pagination'
            );
        });

        it('should filter warned users when filter is warned', () => {
            assert.ok(
                adminUsersRouteSource.includes("filter === 'warned'") &&
                adminUsersRouteSource.includes('warningCount: { gt: 0 }'),
                'Should filter warned users'
            );
        });
    });

    describe('Response Format', () => {
        it('should return users array', () => {
            assert.ok(
                adminUsersRouteSource.includes('users,'),
                'Should return users array'
            );
        });

        it('should return pagination metadata', () => {
            assert.ok(
                adminUsersRouteSource.includes('total,') &&
                adminUsersRouteSource.includes('page,') &&
                adminUsersRouteSource.includes('limit,') &&
                adminUsersRouteSource.includes('totalPages:'),
                'Should return pagination metadata'
            );
        });

        it('should return stats', () => {
            assert.ok(
                adminUsersRouteSource.includes('stats:') &&
                adminUsersRouteSource.includes('totalUsers:') &&
                adminUsersRouteSource.includes('warnedUsers:') &&
                adminUsersRouteSource.includes('bannedIPs:'),
                'Should return stats'
            );
        });

        it('should include requestId in response', () => {
            assert.ok(
                adminUsersRouteSource.includes('{ requestId }'),
                'Should include requestId in response'
            );
        });
    });

    describe('Error Handling', () => {
        it('should catch errors and return internal error', () => {
            assert.ok(
                adminUsersRouteSource.includes('catch (error)') &&
                adminUsersRouteSource.includes('ApiErrors.internalError'),
                'Should catch errors and return internal error'
            );
        });

        it('should log errors with requestId', () => {
            assert.ok(
                adminUsersRouteSource.includes('console.error') &&
                adminUsersRouteSource.includes('requestId'),
                'Should log errors with requestId'
            );
        });
    });
});
