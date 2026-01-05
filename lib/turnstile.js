/**
 * Cloudflare Turnstile Server-Side Verification
 *
 * This module handles server-side verification of Turnstile tokens.
 * NEVER expose TURNSTILE_SECRET_KEY to the client.
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Maximum token length per Cloudflare documentation */
const MAX_TOKEN_LENGTH = 2048;

/** Token validity period in seconds (5 minutes) */
const TOKEN_VALIDITY_SECONDS = 300;

/** Default timeout for API requests in milliseconds */
const DEFAULT_TIMEOUT_MS = 10000;

/**
 * @typedef {Object} TurnstileVerifyResult
 * @property {boolean} success - Whether the token is valid
 * @property {string|null} error - Error message if verification failed
 * @property {string} [challenge_ts] - ISO timestamp of the challenge
 * @property {string} [hostname] - Hostname for which the challenge was served
 * @property {string[]} [error_codes] - Error codes from Turnstile
 * @property {string} [action] - The action name (if configured)
 * @property {string} [cdata] - Custom data (if configured)
 * @property {Object} [metadata] - Additional metadata (Enterprise only)
 */

/**
 * @typedef {Object} TurnstileVerifyOptions
 * @property {string} [idempotencyKey] - UUID for retry protection
 * @property {string} [expectedAction] - Expected action name to validate
 * @property {string} [expectedHostname] - Expected hostname to validate
 * @property {number} [timeoutMs] - Request timeout in milliseconds (default: 10000)
 */

/**
 * Verify a Turnstile token server-side using the Siteverify API
 *
 * @param {string} token - The Turnstile token from the client (cf-turnstile-response)
 * @param {string} [remoteIp] - The visitor's IP address for additional validation
 * @param {TurnstileVerifyOptions} [options] - Additional verification options
 * @returns {Promise<TurnstileVerifyResult>}
 *
 * @example
 * const result = await verifyTurnstileToken(token, request.headers.get('cf-connecting-ip'), {
 *   expectedAction: 'login',
 *   expectedHostname: 'example.com'
 * });
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error }, { status: 403 });
 * }
 */
export async function verifyTurnstileToken(token, remoteIp = null, options = {}) {
    const {
        idempotencyKey,
        expectedAction,
        expectedHostname,
        timeoutMs = DEFAULT_TIMEOUT_MS,
    } = options;

    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    // Validate secret key configuration
    if (!secretKey) {
        console.error('[Turnstile] TURNSTILE_SECRET_KEY is not configured');
        return {
            success: false,
            error: 'Turnstile is not configured on the server',
            error_codes: ['missing-input-secret'],
        };
    }

    // Validate token presence and format
    if (!token || typeof token !== 'string' || token.trim() === '') {
        return {
            success: false,
            error: 'Please complete the security check',
            error_codes: ['missing-input-response'],
        };
    }

    // Validate token length (max 2048 characters per Cloudflare docs)
    if (token.length > MAX_TOKEN_LENGTH) {
        return {
            success: false,
            error: 'Invalid security token',
            error_codes: ['invalid-input-response'],
        };
    }

    // Set up timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Build request body using FormData (recommended by Cloudflare)
        const formData = new FormData();
        formData.append('secret', secretKey);
        formData.append('response', token);

        // Include IP for additional security (recommended by Cloudflare)
        if (remoteIp) {
            formData.append('remoteip', remoteIp);
        }

        // Include idempotency key for retry protection
        if (idempotencyKey) {
            formData.append('idempotency_key', idempotencyKey);
        }

        const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
        });

        if (!response.ok) {
            console.error('[Turnstile] Siteverify API error:', response.status);
            return {
                success: false,
                error: 'Security verification service unavailable',
                error_codes: ['internal-error'],
            };
        }

        const result = await response.json();

        // Handle verification failure
        if (!result.success) {
            console.warn('[Turnstile] Verification failed:', result['error-codes']);
            return {
                success: false,
                error: getTurnstileErrorMessage(result['error-codes']),
                error_codes: result['error-codes'] || [],
            };
        }

        // Additional validation: Check action matches expected value
        if (expectedAction && result.action !== expectedAction) {
            console.warn('[Turnstile] Action mismatch:', { expected: expectedAction, received: result.action });
            return {
                success: false,
                error: 'Security verification failed',
                error_codes: ['action-mismatch'],
            };
        }

        // Additional validation: Check hostname matches expected value
        if (expectedHostname && result.hostname !== expectedHostname) {
            console.warn('[Turnstile] Hostname mismatch:', { expected: expectedHostname, received: result.hostname });
            return {
                success: false,
                error: 'Security verification failed',
                error_codes: ['hostname-mismatch'],
            };
        }

        // Check token age (warn if older than 4 minutes)
        if (result.challenge_ts) {
            const challengeTime = new Date(result.challenge_ts);
            const now = new Date();
            const ageSeconds = (now - challengeTime) / 1000;

            if (ageSeconds > (TOKEN_VALIDITY_SECONDS - 60)) {
                console.warn('[Turnstile] Token is close to expiry:', { ageSeconds });
            }
        }

        return {
            success: true,
            error: null,
            challenge_ts: result.challenge_ts,
            hostname: result.hostname,
            action: result.action,
            cdata: result.cdata,
            metadata: result.metadata,
        };

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[Turnstile] Verification timeout after', timeoutMs, 'ms');
            return {
                success: false,
                error: 'Security verification timed out',
                error_codes: ['timeout'],
            };
        }

        console.error('[Turnstile] Verification error:', error);
        return {
            success: false,
            error: 'Failed to verify security token',
            error_codes: ['internal-error'],
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Verify a Turnstile token with automatic retry on failure
 * Uses idempotency keys for safe retries
 *
 * @param {string} token - The Turnstile token from the client
 * @param {string} [remoteIp] - The visitor's IP address
 * @param {TurnstileVerifyOptions & { maxRetries?: number }} [options] - Verification options
 * @returns {Promise<TurnstileVerifyResult>}
 */
export async function verifyTurnstileTokenWithRetry(token, remoteIp = null, options = {}) {
    const { maxRetries = 3, ...verifyOptions } = options;

    // Generate idempotency key for safe retries
    const idempotencyKey = verifyOptions.idempotencyKey || crypto.randomUUID();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await verifyTurnstileToken(token, remoteIp, {
            ...verifyOptions,
            idempotencyKey,
        });

        // Don't retry on definitive failures (invalid token, etc.)
        const noRetryErrors = [
            'missing-input-response',
            'invalid-input-response',
            'timeout-or-duplicate',
            'bad-request',
            'action-mismatch',
            'hostname-mismatch',
        ];

        if (result.success || noRetryErrors.some(code => result.error_codes?.includes(code))) {
            return result;
        }

        // Only retry on transient errors
        if (attempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s...
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Return the last result after all retries exhausted
    return {
        success: false,
        error: 'Security verification failed after multiple attempts',
        error_codes: ['max-retries-exceeded'],
    };
}

/**
 * Convert Turnstile error codes to human-readable messages
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/#error-codes-reference
 * @param {string[]} errorCodes
 * @returns {string}
 */
function getTurnstileErrorMessage(errorCodes = []) {
    const errorMap = {
        // Cloudflare documented error codes
        'missing-input-secret': 'Server configuration error',
        'invalid-input-secret': 'Server configuration error',
        'missing-input-response': 'Please complete the security check',
        'invalid-input-response': 'Security check invalid or expired. Please try again',
        'bad-request': 'Invalid request',
        'timeout-or-duplicate': 'Security check expired or already used. Please try again',
        'internal-error': 'Security service temporarily unavailable',
        // Custom error codes
        'action-mismatch': 'Security verification failed',
        'hostname-mismatch': 'Security verification failed',
        'timeout': 'Security verification timed out. Please try again',
        'max-retries-exceeded': 'Security verification failed. Please refresh and try again',
    };

    for (const code of errorCodes) {
        if (errorMap[code]) {
            return errorMap[code];
        }
    }

    return 'Security verification failed. Please try again';
}

/**
 * Extract client IP from request headers (Cloudflare-aware)
 * Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For
 *
 * @param {Headers} headers - Request headers
 * @returns {string|null}
 */
export function getClientIp(headers) {
    // Cloudflare's true client IP header (most reliable when behind Cloudflare)
    const cfIp = headers.get('cf-connecting-ip');
    if (cfIp) return cfIp;

    // Common proxy headers
    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;

    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // X-Forwarded-For can contain multiple IPs; first one is the client
        return forwardedFor.split(',')[0].trim();
    }

    return null;
}

/**
 * Higher-order function to wrap API route handlers with Turnstile verification
 * Use this for protecting sensitive POST endpoints
 *
 * @param {Function} handler - The original route handler
 * @param {Object} options - Configuration options
 * @param {string} [options.tokenField='turnstileToken'] - Field name in request body
 * @param {boolean} [options.required=true] - Whether Turnstile is required
 * @param {string} [options.expectedAction] - Expected action to validate
 * @param {string} [options.expectedHostname] - Expected hostname to validate
 * @returns {Function}
 *
 * @example
 * export const POST = withTurnstile(async (request) => {
 *   // Your handler logic - Turnstile already verified
 *   const body = await request.json();
 *   // ...
 * }, { expectedAction: 'contact-form' });
 */
export function withTurnstile(handler, options = {}) {
    const {
        tokenField = 'turnstileToken',
        required = true,
        expectedAction,
        expectedHostname,
    } = options;

    return async (request, context) => {
        // Skip verification in development if configured
        if (process.env.NODE_ENV === 'development' && process.env.SKIP_TURNSTILE === 'true') {
            console.warn('[Turnstile] Skipping verification in development');
            return handler(request, context);
        }

        let body;
        try {
            body = await request.clone().json();
        } catch {
            if (required) {
                return Response.json(
                    { error: 'Invalid request body' },
                    { status: 400 }
                );
            }
            return handler(request, context);
        }

        const token = body[tokenField];

        if (!token && !required) {
            return handler(request, context);
        }

        const clientIp = getClientIp(request.headers);
        const result = await verifyTurnstileToken(token, clientIp, {
            expectedAction,
            expectedHostname,
        });

        if (!result.success) {
            return Response.json(
                {
                    error: result.error,
                    code: 'TURNSTILE_VERIFICATION_FAILED',
                },
                { status: 403 }
            );
        }

        // Attach verification result to request for downstream use
        request.turnstileVerified = true;
        request.turnstileResult = result;

        return handler(request, context);
    };
}
