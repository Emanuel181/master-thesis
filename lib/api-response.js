/**
 * API Response Utilities
 * =======================
 * 
 * Provides consistent, type-safe API response helpers for Next.js API routes.
 * Ensures all responses follow the same structure and include security headers.
 */

import { NextResponse } from 'next/server';
import { securityHeaders } from './api-security';

/**
 * Standard API response structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} [data] - Response data (on success)
 * @property {string} [error] - Error message (on failure)
 * @property {string} [code] - Error code for client handling
 * @property {string} [requestId] - Unique request identifier
 * @property {Object} [meta] - Additional metadata
 */

/**
 * Generate a unique request ID
 * @returns {string}
 */
export function generateRequestId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a success response
 * @param {*} data - Response data
 * @param {Object} options - Response options
 * @param {number} [options.status=200] - HTTP status code
 * @param {string} [options.requestId] - Request ID
 * @param {Object} [options.meta] - Additional metadata
 * @param {Object} [options.headers] - Additional headers
 * @returns {NextResponse}
 */
export function successResponse(data, { status = 200, requestId, meta, headers = {} } = {}) {
    const responseBody = {
        success: true,
        data,
        ...(meta && { meta }),
        ...(requestId && { requestId }),
    };

    return NextResponse.json(responseBody, {
        status,
        headers: {
            ...securityHeaders,
            ...(requestId && { 'x-request-id': requestId }),
            ...headers,
        },
    });
}

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {Object} options - Response options
 * @param {number} [options.status=500] - HTTP status code
 * @param {string} [options.code] - Error code
 * @param {string} [options.requestId] - Request ID
 * @param {Object} [options.details] - Additional error details (dev only)
 * @param {Object} [options.headers] - Additional headers
 * @returns {NextResponse}
 */
export function errorResponse(message, { status = 500, code, requestId, details, headers = {} } = {}) {
    const responseBody = {
        success: false,
        error: message,
        ...(code && { code }),
        ...(requestId && { requestId }),
        // Only include details in development
        ...(process.env.NODE_ENV === 'development' && details && { details }),
    };

    return NextResponse.json(responseBody, {
        status,
        headers: {
            ...securityHeaders,
            ...(requestId && { 'x-request-id': requestId }),
            ...headers,
        },
    });
}

/**
 * Pre-defined error responses for common scenarios
 */
export const ApiErrors = {
    /**
     * 400 Bad Request
     * @param {string} [message] - Custom message
     * @param {Object} [options] - Response options
     */
    badRequest: (message = 'Invalid request', options = {}) =>
        errorResponse(message, { status: 400, code: 'BAD_REQUEST', ...options }),

    /**
     * 401 Unauthorized
     * @param {string} [message] - Custom message
     * @param {Object} [options] - Response options
     */
    unauthorized: (message = 'Authentication required', options = {}) =>
        errorResponse(message, { status: 401, code: 'UNAUTHORIZED', ...options }),

    /**
     * 403 Forbidden
     * @param {string} [message] - Custom message
     * @param {Object} [options] - Response options
     */
    forbidden: (message = 'Access denied', options = {}) =>
        errorResponse(message, { status: 403, code: 'FORBIDDEN', ...options }),

    /**
     * 404 Not Found
     * @param {string} [resource] - Resource type
     * @param {Object} [options] - Response options
     */
    notFound: (resource = 'Resource', options = {}) =>
        errorResponse(`${resource} not found`, { status: 404, code: 'NOT_FOUND', ...options }),

    /**
     * 409 Conflict
     * @param {string} [message] - Custom message
     * @param {Object} [options] - Response options
     */
    conflict: (message = 'Resource already exists', options = {}) =>
        errorResponse(message, { status: 409, code: 'CONFLICT', ...options }),

    /**
     * 422 Unprocessable Entity (validation errors)
     * @param {string} [message] - Custom message
     * @param {Object} [options] - Response options
     */
    validationError: (message = 'Validation failed', options = {}) =>
        errorResponse(message, { status: 422, code: 'VALIDATION_ERROR', ...options }),

    /**
     * 429 Too Many Requests
     * @param {Object} [options] - Response options including retryAfter
     */
    rateLimited: ({ retryAfter, message = 'Too many requests', ...options } = {}) =>
        errorResponse(message, {
            status: 429,
            code: 'RATE_LIMITED',
            headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {},
            ...options,
        }),

    /**
     * 500 Internal Server Error
     * @param {string} [message] - Custom message (avoid exposing internals)
     * @param {Object} [options] - Response options
     */
    internalError: (message = 'An unexpected error occurred', options = {}) =>
        errorResponse(message, { status: 500, code: 'INTERNAL_ERROR', ...options }),

    /**
     * 503 Service Unavailable
     * @param {Object} [options] - Response options including retryAfter
     */
    serviceUnavailable: ({ retryAfter, message = 'Service temporarily unavailable', ...options } = {}) =>
        errorResponse(message, {
            status: 503,
            code: 'SERVICE_UNAVAILABLE',
            headers: retryAfter ? { 'Retry-After': String(Math.ceil(retryAfter / 1000)) } : {},
            ...options,
        }),
};

/**
 * Wrapper for API route handlers with automatic error handling
 * @param {Function} handler - Async route handler function
 * @param {Object} options - Handler options
 * @param {boolean} [options.includeRequestId=true] - Include request ID in responses
 * @returns {Function} Wrapped handler
 */
export function withApiHandler(handler, { includeRequestId = true } = {}) {
    return async (request, context) => {
        const requestId = includeRequestId ? generateRequestId() : undefined;

        try {
            // Pass requestId to handler for use in responses
            return await handler(request, { ...context, requestId });
        } catch (error) {
            // Log error for debugging
            console.error(`[API Error] RequestId: ${requestId}`, error);

            // Handle known error types
            if (error.code === 'CIRCUIT_OPEN') {
                return ApiErrors.serviceUnavailable({
                    retryAfter: error.retryAfter || 30000,
                    requestId,
                });
            }

            // Generic error response
            return ApiErrors.internalError(
                process.env.NODE_ENV === 'development' ? error.message : undefined,
                { requestId, details: { stack: error.stack } }
            );
        }
    };
}

export default {
    success: successResponse,
    error: errorResponse,
    ...ApiErrors,
    generateRequestId,
    withApiHandler,
};

