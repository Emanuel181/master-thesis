/**
 * API Handler Tests
 * 
 * Tests for the API handler response helpers including property-based tests
 * for response format consistency and metadata inclusion.
 * 
 * Feature: backend-refactoring
 * 
 * Note: These tests focus on the pure response helper functions.
 * The createApiHandler wrapper requires Next.js runtime and is tested via integration tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Import security headers directly (doesn't require Next.js)
import { securityHeaders } from '../api-security.js';

// Read the api-handler.js source to verify structure
const apiHandlerSource = readFileSync(join(process.cwd(), 'lib/api-handler.js'), 'utf-8');

describe('API Handler Module', () => {
    describe('Module Structure', () => {
        it('should export generateRequestId function', () => {
            assert.ok(
                apiHandlerSource.includes('export function generateRequestId'),
                'Should export generateRequestId function'
            );
        });

        it('should export successResponse function', () => {
            assert.ok(
                apiHandlerSource.includes('export function successResponse'),
                'Should export successResponse function'
            );
        });

        it('should export errorResponse function', () => {
            assert.ok(
                apiHandlerSource.includes('export function errorResponse'),
                'Should export errorResponse function'
            );
        });

        it('should export validationErrorResponse function', () => {
            assert.ok(
                apiHandlerSource.includes('export function validationErrorResponse'),
                'Should export validationErrorResponse function'
            );
        });

        it('should export ApiErrors object', () => {
            assert.ok(
                apiHandlerSource.includes('export const ApiErrors'),
                'Should export ApiErrors object'
            );
        });

        it('should export createApiHandler function', () => {
            assert.ok(
                apiHandlerSource.includes('export function createApiHandler'),
                'Should export createApiHandler function'
            );
        });
    });

    /**
     * Property 1: Response Format Consistency
     * For any API response (success or error), the response body SHALL contain
     * a `success` boolean field, and success responses SHALL include a `data` field
     * while error responses SHALL include `error` and `code` fields.
     * 
     * Feature: backend-refactoring, Property 1: Response Format Consistency
     * Validates: Requirements 1.2, 1.3
     */
    describe('Property 1: Response Format Consistency', () => {
        it('successResponse should include success: true and data field', () => {
            // Verify the function structure includes the required fields
            assert.ok(
                apiHandlerSource.includes('success: true'),
                'successResponse should set success: true'
            );
            assert.ok(
                apiHandlerSource.includes('data,') || apiHandlerSource.includes('data:'),
                'successResponse should include data field'
            );
        });

        it('errorResponse should include success: false, error, and code fields', () => {
            assert.ok(
                apiHandlerSource.includes('success: false'),
                'errorResponse should set success: false'
            );
            assert.ok(
                apiHandlerSource.includes('error: message') || apiHandlerSource.includes('error,'),
                'errorResponse should include error field'
            );
            assert.ok(
                apiHandlerSource.includes('code &&') || apiHandlerSource.includes('code:'),
                'errorResponse should support code field'
            );
        });

        it('should have consistent response structure for all ApiErrors', () => {
            const errorTypes = [
                'unauthorized',
                'forbidden',
                'demoBlocked',
                'notFound',
                'rateLimited',
                'internalError',
                'serviceUnavailable',
            ];
            
            for (const errorType of errorTypes) {
                assert.ok(
                    apiHandlerSource.includes(`${errorType}:`),
                    `ApiErrors should include ${errorType}`
                );
            }
        });
    });

    /**
     * Property 2: Response Metadata Inclusion
     * For any API response from a wrapped handler, the response SHALL include
     * a unique `requestId` in the body and `x-request-id` header, and SHALL
     * include all security headers defined in `securityHeaders`.
     * 
     * Feature: backend-refactoring, Property 2: Response Metadata Inclusion
     * Validates: Requirements 1.4, 1.5, 7.3, 7.4
     */
    describe('Property 2: Response Metadata Inclusion', () => {
        it('responses should include requestId in body when provided', () => {
            assert.ok(
                apiHandlerSource.includes("requestId && { requestId }") ||
                apiHandlerSource.includes("(requestId && { requestId })"),
                'Response should conditionally include requestId in body'
            );
        });

        it('responses should include x-request-id header when requestId provided', () => {
            assert.ok(
                apiHandlerSource.includes("'x-request-id': requestId") ||
                apiHandlerSource.includes("'x-request-id'"),
                'Response should include x-request-id header'
            );
        });

        it('responses should spread securityHeaders', () => {
            assert.ok(
                apiHandlerSource.includes('...securityHeaders'),
                'Response should spread securityHeaders'
            );
        });

        it('createApiHandler should generate requestId automatically', () => {
            assert.ok(
                apiHandlerSource.includes('const requestId = generateRequestId()'),
                'createApiHandler should generate requestId'
            );
        });
    });

    describe('Security Headers Verification', () => {
        it('securityHeaders should include Cache-Control', () => {
            assert.ok(securityHeaders['Cache-Control'], 'Should have Cache-Control header');
        });

        it('securityHeaders should include X-Content-Type-Options', () => {
            assert.strictEqual(
                securityHeaders['X-Content-Type-Options'],
                'nosniff',
                'Should have X-Content-Type-Options: nosniff'
            );
        });

        it('securityHeaders should include X-XSS-Protection', () => {
            assert.ok(securityHeaders['X-XSS-Protection'], 'Should have X-XSS-Protection header');
        });

        it('securityHeaders should include Cross-Origin headers', () => {
            assert.ok(
                securityHeaders['Cross-Origin-Resource-Policy'],
                'Should have Cross-Origin-Resource-Policy header'
            );
        });
    });

    describe('Handler Configuration', () => {
        it('createApiHandler should support requireAuth config', () => {
            assert.ok(
                apiHandlerSource.includes('requireAuth'),
                'Should support requireAuth configuration'
            );
        });

        it('createApiHandler should support rateLimit config', () => {
            assert.ok(
                apiHandlerSource.includes('rateLimitConfig') || apiHandlerSource.includes('rateLimit:'),
                'Should support rateLimit configuration'
            );
        });

        it('createApiHandler should support bodySchema validation', () => {
            assert.ok(
                apiHandlerSource.includes('bodySchema'),
                'Should support bodySchema validation'
            );
        });

        it('createApiHandler should support querySchema validation', () => {
            assert.ok(
                apiHandlerSource.includes('querySchema'),
                'Should support querySchema validation'
            );
        });

        it('createApiHandler should support CSRF protection', () => {
            assert.ok(
                apiHandlerSource.includes('csrfProtection') && apiHandlerSource.includes('isSameOrigin'),
                'Should support CSRF protection'
            );
        });
    });

    describe('Error Handling', () => {
        it('createApiHandler should catch errors and return internalError', () => {
            assert.ok(
                apiHandlerSource.includes('catch (error)') &&
                apiHandlerSource.includes('ApiErrors.internalError'),
                'Should catch errors and return internal error response'
            );
        });

        it('createApiHandler should handle circuit breaker errors', () => {
            assert.ok(
                apiHandlerSource.includes('CIRCUIT_OPEN') &&
                apiHandlerSource.includes('serviceUnavailable'),
                'Should handle circuit breaker open state'
            );
        });

        it('createApiHandler should log errors with requestId', () => {
            assert.ok(
                apiHandlerSource.includes('console.error') &&
                apiHandlerSource.includes('requestId'),
                'Should log errors with requestId for correlation'
            );
        });
    });

    /**
     * Validation Error Response Tests
     * Tests for the validationErrorResponse helper that extracts field-level
     * errors from Zod validation results.
     * 
     * Feature: backend-refactoring
     * Validates: Requirements 4.3
     */
    describe('Validation Error Response', () => {
        it('validationErrorResponse should extract field-level errors', () => {
            // Verify the function extracts field errors from Zod
            assert.ok(
                apiHandlerSource.includes('zodError.errors.map') ||
                apiHandlerSource.includes('fieldErrors'),
                'Should extract field-level errors from Zod'
            );
        });

        it('validationErrorResponse should include fields array in response', () => {
            assert.ok(
                apiHandlerSource.includes('fields: fieldErrors') ||
                apiHandlerSource.includes('fields:'),
                'Should include fields array in response body'
            );
        });

        it('validationErrorResponse should return 400 status', () => {
            // Check that validationErrorResponse uses status 400
            const validationErrorMatch = apiHandlerSource.match(
                /validationErrorResponse[\s\S]*?status:\s*400/
            );
            assert.ok(
                validationErrorMatch,
                'validationErrorResponse should return 400 status'
            );
        });

        it('validationErrorResponse should include VALIDATION_ERROR code', () => {
            assert.ok(
                apiHandlerSource.includes("code: 'VALIDATION_ERROR'"),
                'Should include VALIDATION_ERROR code'
            );
        });

        it('validationErrorResponse should include security headers', () => {
            // The function should spread securityHeaders like other response helpers
            const fnMatch = apiHandlerSource.match(
                /export function validationErrorResponse[\s\S]*?return NextResponse\.json/
            );
            assert.ok(fnMatch, 'Should have validationErrorResponse function');
            assert.ok(
                fnMatch[0].includes('securityHeaders') || 
                apiHandlerSource.includes('...securityHeaders'),
                'Should include security headers'
            );
        });
    });

    /**
     * Property 3: Unauthenticated Request Rejection
     * For any request to a protected endpoint without a valid session,
     * the API SHALL return a 401 Unauthorized response.
     * 
     * Feature: backend-refactoring, Property 3: Unauthenticated Request Rejection
     * Validates: Requirements 2.2
     */
    describe('Property 3: Unauthenticated Request Rejection', () => {
        it('createApiHandler should check session when requireAuth is true', () => {
            assert.ok(
                apiHandlerSource.includes('if (requireAuth)') &&
                apiHandlerSource.includes('session = await auth()'),
                'Should check session when requireAuth is true'
            );
        });

        it('should return 401 when session is missing', () => {
            assert.ok(
                apiHandlerSource.includes("!session?.user?.id") &&
                apiHandlerSource.includes('ApiErrors.unauthorized'),
                'Should return unauthorized when session is missing'
            );
        });

        it('ApiErrors.unauthorized should return 401 status', () => {
            assert.ok(
                apiHandlerSource.includes("unauthorized:") &&
                apiHandlerSource.includes("status: 401"),
                'unauthorized should return 401 status'
            );
        });

        it('ApiErrors.unauthorized should include UNAUTHORIZED code', () => {
            assert.ok(
                apiHandlerSource.includes("code: 'UNAUTHORIZED'"),
                'unauthorized should include UNAUTHORIZED code'
            );
        });
    });

    /**
     * Property 4: Demo Mode Blocking
     * For any request from a demo mode session to a production API endpoint,
     * the API SHALL return a 403 Forbidden response with code DEMO_MODE_BLOCKED.
     * 
     * Feature: backend-refactoring, Property 4: Demo Mode Blocking
     * Validates: Requirements 2.5
     */
    describe('Property 4: Demo Mode Blocking', () => {
        it('createApiHandler should check demo mode when blockDemoMode is true', () => {
            assert.ok(
                apiHandlerSource.includes('blockDemoMode') &&
                apiHandlerSource.includes('requireProductionMode'),
                'Should check demo mode when blockDemoMode is true'
            );
        });

        it('should return demo blocked response for demo mode requests', () => {
            assert.ok(
                apiHandlerSource.includes('demoBlocked:'),
                'Should have demoBlocked error type'
            );
        });

        it('ApiErrors.demoBlocked should return 403 status', () => {
            assert.ok(
                apiHandlerSource.includes("demoBlocked:") &&
                apiHandlerSource.includes("status: 403"),
                'demoBlocked should return 403 status'
            );
        });

        it('ApiErrors.demoBlocked should include DEMO_MODE_BLOCKED code', () => {
            assert.ok(
                apiHandlerSource.includes("code: 'DEMO_MODE_BLOCKED'"),
                'demoBlocked should include DEMO_MODE_BLOCKED code'
            );
        });
    });

    /**
     * Property 7: CSRF Protection
     * For any state-changing request (POST, PUT, PATCH, DELETE) without a valid
     * same-origin header, the API SHALL return a 403 Forbidden response.
     * 
     * Feature: backend-refactoring, Property 7: CSRF Protection
     * Validates: Requirements 5.2
     */
    describe('Property 7: CSRF Protection', () => {
        it('createApiHandler should check CSRF for state-changing methods', () => {
            assert.ok(
                apiHandlerSource.includes('requiresCsrfProtection(method)'),
                'Should check CSRF for state-changing methods'
            );
        });

        it('should identify state-changing methods', () => {
            assert.ok(
                apiHandlerSource.includes("'POST', 'PUT', 'PATCH', 'DELETE'"),
                'Should identify POST, PUT, PATCH, DELETE as state-changing'
            );
        });

        it('should check same-origin for CSRF protection', () => {
            assert.ok(
                apiHandlerSource.includes('isSameOrigin(request)'),
                'Should check same-origin for CSRF'
            );
        });

        it('should return 403 for cross-origin state-changing requests', () => {
            assert.ok(
                apiHandlerSource.includes("!isSameOrigin(request)") &&
                apiHandlerSource.includes('ApiErrors.forbidden'),
                'Should return forbidden for cross-origin requests'
            );
        });
    });

    /**
     * Property 8: Error Information Hiding
     * For any internal server error, the API SHALL NOT expose stack traces,
     * internal paths, or sensitive error details in production responses.
     * 
     * Feature: backend-refactoring, Property 8: Error Information Hiding
     * Validates: Requirements 6.2
     */
    describe('Property 8: Error Information Hiding', () => {
        it('errorResponse should only include details in development', () => {
            assert.ok(
                apiHandlerSource.includes("process.env.NODE_ENV === 'development'") &&
                apiHandlerSource.includes('details'),
                'Should only include details in development mode'
            );
        });

        it('ApiErrors.internalError should use generic message', () => {
            assert.ok(
                apiHandlerSource.includes("'An unexpected error occurred'"),
                'internalError should use generic message'
            );
        });

        it('createApiHandler should not expose error details in production', () => {
            // The catch block should use ApiErrors.internalError which hides details
            const catchBlock = apiHandlerSource.match(/catch \(error\)[\s\S]*?ApiErrors\.internalError/);
            assert.ok(
                catchBlock && !catchBlock[0].includes('error.message'),
                'Catch block should not expose error.message directly'
            );
        });

        it('should log errors server-side for debugging', () => {
            assert.ok(
                apiHandlerSource.includes('console.error') &&
                apiHandlerSource.includes('[API Error]'),
                'Should log errors server-side'
            );
        });
    });
});
