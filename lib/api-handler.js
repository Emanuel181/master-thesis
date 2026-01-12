/**
 * API Handler Wrapper
 * ====================
 * 
 * Provides a configurable wrapper for API route handlers that handles
 * common concerns: authentication, rate limiting, CSRF protection,
 * input validation, and error handling.
 * 
 * Usage:
 * ```js
 * import { createApiHandler } from '@/lib/api-handler';
 * import { z } from 'zod';
 * 
 * const bodySchema = z.object({ title: z.string() });
 * 
 * export const POST = createApiHandler(
 *     async (request, context) => {
 *         // context.session - authenticated user session
 *         // context.body - validated request body
 *         // context.query - validated query parameters
 *         // context.requestId - unique request identifier
 *         return { article: { id: '123', title: context.body.title } };
 *     },
 *     {
 *         requireAuth: true,
 *         bodySchema,
 *         rateLimit: { limit: 30, windowMs: 60 * 60 * 1000, keyPrefix: 'articles:create' },
 *     }
 * );
 * ```
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders, isSameOrigin, readJsonBody, getClientIp } from '@/lib/api-security';
import { requireProductionMode } from '@/lib/api-middleware';

// Re-export getClientIp for convenience
export { getClientIp };

/**
 * Generate a unique request ID
 * @returns {string}
 */
export function generateRequestId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a success response with standard format
 * @param {*} data - Response data
 * @param {Object} options - Response options
 * @returns {NextResponse}
 */
export function successResponse(data, { status = 200, requestId, headers = {} } = {}) {
    return NextResponse.json(
        {
            success: true,
            data,
            ...(requestId && { requestId }),
        },
        {
            status,
            headers: {
                ...securityHeaders,
                ...(requestId && { 'x-request-id': requestId }),
                ...headers,
            },
        }
    );
}


/**
 * Create an error response with standard format
 * @param {string} message - Error message
 * @param {Object} options - Response options
 * @returns {NextResponse}
 */
export function errorResponse(message, { status = 500, code, requestId, details, headers = {} } = {}) {
    return NextResponse.json(
        {
            success: false,
            error: message,
            ...(code && { code }),
            ...(requestId && { requestId }),
            // Only include details in development
            ...(process.env.NODE_ENV === 'development' && details && { details }),
        },
        {
            status,
            headers: {
                ...securityHeaders,
                ...(requestId && { 'x-request-id': requestId }),
                ...headers,
            },
        }
    );
}

/**
 * Create a validation error response from Zod errors
 * @param {import('zod').ZodError} zodError - Zod validation error
 * @param {Object} options - Response options
 * @returns {NextResponse}
 */
export function validationErrorResponse(zodError, { requestId } = {}) {
    // Extract field-level errors from Zod
    const fieldErrors = (zodError.errors || zodError.issues || []).map((err) => ({
        field: err.path?.join('.') || 'root',
        message: err.message,
        code: err.code,
    }));

    return NextResponse.json(
        {
            success: false,
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            fields: fieldErrors,
            ...(requestId && { requestId }),
        },
        {
            status: 400,
            headers: {
                ...securityHeaders,
                ...(requestId && { 'x-request-id': requestId }),
            },
        }
    );
}

/**
 * Pre-defined error responses
 */
export const ApiErrors = {
    unauthorized: (requestId) => errorResponse('Authentication required', { status: 401, code: 'UNAUTHORIZED', requestId }),
    forbidden: (requestId, message = 'Access denied') => errorResponse(message, { status: 403, code: 'FORBIDDEN', requestId }),
    demoBlocked: (requestId) => errorResponse('Demo mode cannot access production APIs', { status: 403, code: 'DEMO_MODE_BLOCKED', requestId }),
    notFound: (resource, requestId) => errorResponse(`${resource} not found`, { status: 404, code: 'NOT_FOUND', requestId }),
    rateLimited: (retryAt, requestId) => errorResponse('Too many requests', { 
        status: 429, 
        code: 'RATE_LIMITED', 
        requestId,
        headers: { 'Retry-After': String(Math.ceil((retryAt - Date.now()) / 1000)) },
        details: { retryAt },
    }),
    internalError: (requestId) => errorResponse('An unexpected error occurred', { status: 500, code: 'INTERNAL_ERROR', requestId }),
    serviceUnavailable: (retryAfter, requestId) => errorResponse('Service temporarily unavailable', {
        status: 503,
        code: 'SERVICE_UNAVAILABLE',
        requestId,
        headers: { 'Retry-After': String(Math.ceil(retryAfter / 1000)) },
        details: { retryAfter },
    }),
};


/**
 * Parse query parameters from request URL
 * @param {Request} request - The request object
 * @returns {Object} Query parameters as object
 */
function parseQueryParams(request) {
    const { searchParams } = new URL(request.url);
    const params = {};
    for (const [key, value] of searchParams.entries()) {
        params[key] = value;
    }
    return params;
}

/**
 * Check if request method requires CSRF protection
 * @param {string} method - HTTP method
 * @returns {boolean}
 */
function requiresCsrfProtection(method) {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Creates a wrapped API handler with common middleware
 * 
 * @param {Function} handler - Async handler function (request, context) => data | Response
 * @param {Object} config - Handler configuration
 * @param {boolean} [config.requireAuth=true] - Require authenticated session
 * @param {boolean} [config.requireProductionMode=true] - Block demo mode access
 * @param {Object} [config.rateLimit] - Rate limit configuration
 * @param {number} config.rateLimit.limit - Max requests per window
 * @param {number} config.rateLimit.windowMs - Window size in milliseconds
 * @param {string} config.rateLimit.keyPrefix - Prefix for rate limit key
 * @param {boolean} [config.csrfProtection=true] - Enable CSRF check for state-changing methods
 * @param {import('zod').ZodSchema} [config.bodySchema] - Zod schema for request body validation
 * @param {import('zod').ZodSchema} [config.querySchema] - Zod schema for query parameter validation
 * @param {import('zod').ZodSchema} [config.paramsSchema] - Zod schema for route params validation
 * @returns {Function} Wrapped handler
 */
export function createApiHandler(handler, config = {}) {
    const {
        requireAuth = true,
        requireProductionMode: blockDemoMode = true,
        rateLimit: rateLimitConfig,
        csrfProtection = true,
        bodySchema,
        querySchema,
        paramsSchema,
    } = config;

    return async (request, routeContext = {}) => {
        const requestId = generateRequestId();
        const method = request.method?.toUpperCase() || 'GET';

        try {
            // 1. Demo mode blocking
            if (blockDemoMode) {
                const demoBlock = requireProductionMode(request, { requestId });
                if (demoBlock) return demoBlock;
            }

            // 2. Authentication check
            let session = null;
            if (requireAuth) {
                session = await auth();
                if (!session?.user?.id) {
                    return ApiErrors.unauthorized(requestId);
                }
            }

            // 3. CSRF protection for state-changing operations
            if (csrfProtection && requiresCsrfProtection(method)) {
                if (!isSameOrigin(request)) {
                    return ApiErrors.forbidden(requestId, 'Forbidden');
                }
            }

            // 4. Rate limiting (supports both authenticated and unauthenticated requests)
            if (rateLimitConfig) {
                const { limit, windowMs, keyPrefix } = rateLimitConfig;
                // Use user ID for authenticated requests, client IP for unauthenticated
                const rateLimitKey = session?.user?.id 
                    ? `${keyPrefix}:user:${session.user.id}`
                    : `${keyPrefix}:ip:${getClientIp(request)}`;
                const rl = await rateLimit({
                    key: rateLimitKey,
                    limit,
                    windowMs,
                });
                if (!rl.allowed) {
                    return ApiErrors.rateLimited(rl.resetAt, requestId);
                }
            }

            // 5. Parse and validate query parameters
            let query = parseQueryParams(request);
            if (querySchema) {
                const result = querySchema.safeParse(query);
                if (!result.success) {
                    return validationErrorResponse(result.error, { requestId });
                }
                query = result.data;
            }

            // 6. Parse and validate request body (for POST, PUT, PATCH)
            let body = null;
            if (['POST', 'PUT', 'PATCH'].includes(method)) {
                const parsed = await readJsonBody(request);
                if (!parsed.ok && bodySchema) {
                    return errorResponse('Invalid JSON body', { status: 400, code: 'INVALID_JSON', requestId });
                }
                body = parsed.body;

                if (bodySchema && body) {
                    const result = bodySchema.safeParse(body);
                    if (!result.success) {
                        return validationErrorResponse(result.error, { requestId });
                    }
                    body = result.data;
                }
            }

            // 7. Validate route params
            let params = routeContext.params ? await routeContext.params : {};
            if (paramsSchema) {
                const result = paramsSchema.safeParse(params);
                if (!result.success) {
                    return validationErrorResponse(result.error, { requestId });
                }
                params = result.data;
            }

            // 8. Build context and call handler
            const context = {
                requestId,
                session,
                body,
                query,
                params,
            };

            const result = await handler(request, context);

            // 9. If handler returns a Response, pass it through
            if (result instanceof Response) {
                return result;
            }

            // 10. Otherwise, wrap in success response
            return successResponse(result, { requestId });

        } catch (error) {
            // Log error for debugging
            console.error(`[API Error] RequestId: ${requestId}`, error);

            // Handle circuit breaker open state
            if (error.code === 'CIRCUIT_OPEN') {
                return ApiErrors.serviceUnavailable(error.retryAfter || 30000, requestId);
            }

            // Generic error response
            return ApiErrors.internalError(requestId);
        }
    };
}

export default {
    createApiHandler,
    successResponse,
    errorResponse,
    validationErrorResponse,
    generateRequestId,
    ApiErrors,
};
