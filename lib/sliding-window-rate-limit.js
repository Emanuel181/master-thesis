/**
 * Sliding Window Rate Limiter (PostgreSQL-backed)
 * ================================================
 *
 * Implements a sliding window log algorithm for more accurate rate limiting.
 * Unlike fixed windows, this prevents burst attacks at window boundaries.
 *
 * Features:
 * - Sliding window log algorithm for accuracy
 * - Per-endpoint rate limits
 * - Automatic cleanup of old entries
 * - Atomic operations to prevent race conditions
 * - Fails CLOSED for security
 */

import prisma from "@/lib/prisma";

/**
 * Rate limit configuration per endpoint type
 */
export const RATE_LIMITS = {
    // Authentication endpoints (strict)
    auth: { limit: 5, windowMs: 60 * 1000 },           // 5 requests per minute
    authVerify: { limit: 10, windowMs: 60 * 1000 },    // 10 verification attempts per minute

    // API endpoints (moderate)
    api: { limit: 100, windowMs: 60 * 1000 },          // 100 requests per minute
    apiWrite: { limit: 30, windowMs: 60 * 1000 },      // 30 write operations per minute

    // Workflow endpoints (resource-intensive)
    workflow: { limit: 10, windowMs: 60 * 1000 },      // 10 workflow starts per minute
    workflowHeavy: { limit: 5, windowMs: 300 * 1000 }, // 5 heavy operations per 5 minutes

    // Public endpoints (lenient)
    public: { limit: 200, windowMs: 60 * 1000 },       // 200 requests per minute

    // Admin endpoints (strict)
    admin: { limit: 20, windowMs: 60 * 1000 },         // 20 admin actions per minute

    // File uploads (very strict)
    upload: { limit: 10, windowMs: 300 * 1000 },       // 10 uploads per 5 minutes
};

/**
 * Sliding window rate limiter using atomic database operations
 *
 * @param {Object} opts
 * @param {string} opts.key - Unique identifier (e.g., 'userId:endpoint' or 'ip:endpoint')
 * @param {number} opts.limit - Max requests per window
 * @param {number} opts.windowMs - Window size in milliseconds
 * @param {'prod' | 'demo'} [opts.env] - Environment namespace
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number, retryAfter?: number}>}
 */
export async function slidingWindowRateLimit({ key, limit, windowMs, env = 'prod' }) {
    if (!key) return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };

    const namespacedKey = env === 'demo' ? `demo:sw:${key}` : `sw:${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
        // Use a transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Get current count within the sliding window
            const records = await tx.$queryRaw`
                SELECT count, "createdAt"
                FROM "RateLimit"
                WHERE key = ${namespacedKey}
                AND "createdAt" > ${new Date(windowStart)}
                ORDER BY "createdAt" ASC
            `;

            // Calculate weighted count using sliding window log
            let weightedCount = 0;
            for (const record of records) {
                const recordTime = new Date(record.createdAt).getTime();
                // Weight decreases as the record gets older
                const weight = (recordTime - windowStart) / windowMs;
                weightedCount += record.count * weight;
            }

            // Check if over limit
            if (weightedCount >= limit) {
                // Find when the oldest request will expire
                const oldestRecord = records[0];
                const retryAfter = oldestRecord
                    ? new Date(oldestRecord.createdAt).getTime() + windowMs - now
                    : windowMs;

                return {
                    allowed: false,
                    remaining: 0,
                    resetAt: now + retryAfter,
                    retryAfter: Math.ceil(retryAfter / 1000),
                    currentCount: Math.ceil(weightedCount)
                };
            }

            // Add new request to the window
            await tx.$executeRaw`
                INSERT INTO "RateLimit" (key, count, "resetAt", "createdAt", "updatedAt")
                VALUES (${namespacedKey}, 1, ${new Date(now + windowMs)}, NOW(), NOW())
                ON CONFLICT (key) DO UPDATE SET
                    count = "RateLimit".count + 1,
                    "updatedAt" = NOW()
            `;

            return {
                allowed: true,
                remaining: Math.max(0, limit - Math.ceil(weightedCount) - 1),
                resetAt: now + windowMs,
                currentCount: Math.ceil(weightedCount) + 1
            };
        });

        return result;

    } catch (error) {
        // SECURITY: Fail CLOSED on database errors
        console.error('[sliding-window-rate-limit] Database error - FAILING CLOSED:', error.message);
        return {
            allowed: false,
            remaining: 0,
            resetAt: now + 5000,
            retryAfter: 5,
            error: 'rate_limit_unavailable'
        };
    }
}

/**
 * Convenience function for endpoint-based rate limiting
 *
 * @param {string} identifier - User ID or IP address
 * @param {string} endpoint - Endpoint name
 * @param {keyof typeof RATE_LIMITS} type - Rate limit type
 * @returns {Promise<{allowed: boolean, remaining: number, headers: Object}>}
 */
export async function rateLimitEndpoint(identifier, endpoint, type = 'api') {
    const config = RATE_LIMITS[type] || RATE_LIMITS.api;
    const key = `${identifier}:${endpoint}`;

    const result = await slidingWindowRateLimit({
        key,
        limit: config.limit,
        windowMs: config.windowMs,
    });

    // Generate rate limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
    const headers = {
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    };

    if (!result.allowed && result.retryAfter) {
        headers['Retry-After'] = String(result.retryAfter);
    }

    return {
        ...result,
        headers,
    };
}

/**
 * Cleanup old sliding window entries
 * Should be run periodically (e.g., every hour via cron)
 */
export async function cleanupSlidingWindowEntries() {
    try {
        const result = await prisma.$executeRaw`
            DELETE FROM "RateLimit"
            WHERE key LIKE 'sw:%' OR key LIKE 'demo:sw:%'
            AND "createdAt" < NOW() - INTERVAL '1 hour'
        `;
        console.log(`[sliding-window-rate-limit] Cleaned up ${result} old entries`);
        return result;
    } catch (error) {
        console.error('[sliding-window-rate-limit] Cleanup failed:', error.message);
        return 0;
    }
}

export default slidingWindowRateLimit;
