/**
 * Database-backed rate limiter (PostgreSQL via Prisma)
 * Suitable for ECS/Serverless where memory is not shared.
 *
 * ISOLATION: Keys are namespaced by environment. Demo traffic uses "demo:" prefix
 * so it cannot pollute or exhaust prod rate-limit buckets.
 * 
 * SECURITY: This implementation uses atomic SQL operations to prevent race conditions
 * and fails CLOSED on database errors (security over availability).
 */
import prisma from "@/lib/prisma";

/**
 * Rate limit a request using atomic database operations
 * @param {Object} opts
 * @param {string} opts.key - Unique identifier for the rate-limit bucket
 * @param {number} opts.limit - Max requests per window
 * @param {number} opts.windowMs - Window size in milliseconds
 * @param {'prod' | 'demo'} [opts.env] - Environment; defaults to 'prod'
 * @param {number} [opts.now] - Current timestamp (for testing)
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number, error?: string}>}
 */
export async function rateLimit({ key, limit, windowMs, env = 'prod', now = Date.now() }) {
  if (!key) return { allowed: true, remaining: limit };

  // Namespace keys by environment to isolate demo from prod
  const namespacedKey = env === 'demo' ? `demo:${key}` : key;
  const resetAt = new Date(now + windowMs);
  const nowDate = new Date(now);

  try {
    // ATOMIC rate limiting using PostgreSQL upsert with conditional logic
    // This prevents race conditions by doing the check-and-increment in a single query
    // 
    // Logic:
    // 1. Insert new record with count=1, OR
    // 2. If exists and expired (resetAt <= now), reset count to 1 and update resetAt
    // 3. If exists and not expired, increment count
    // 4. Return the resulting count and resetAt
    //
    // The CASE expressions ensure atomicity - no read-then-write race condition
    const result = await prisma.$queryRaw`
      INSERT INTO "RateLimit" (key, count, "resetAt", "createdAt", "updatedAt")
      VALUES (${namespacedKey}, 1, ${resetAt}, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET
        count = CASE 
          WHEN "RateLimit"."resetAt" <= ${nowDate} THEN 1
          ELSE "RateLimit".count + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" <= ${nowDate} THEN ${resetAt}
          ELSE "RateLimit"."resetAt"
        END,
        "updatedAt" = NOW()
      RETURNING count, "resetAt"
    `;

    const record = result[0];
    const currentCount = Number(record.count);
    const currentResetAt = new Date(record.resetAt).getTime();

    // Check if over limit (count was incremented, so check against limit)
    if (currentCount > limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetAt: currentResetAt 
      };
    }

    return { 
      allowed: true, 
      remaining: limit - currentCount, 
      resetAt: currentResetAt 
    };
    
  } catch (error) {
    // SECURITY: Fail CLOSED on database errors
    // For a security-focused application, we cannot allow unlimited requests
    // when the rate limiter is unavailable. This prevents abuse during outages.
    console.error('[rate-limit] Database error - FAILING CLOSED:', error.message);
    return { 
      allowed: false, 
      remaining: 0, 
      resetAt: now + 5000, // Short retry window
      error: 'rate_limit_unavailable'
    };
  }
}

/**
 * Cleanup expired rate limit records
 * Run this periodically (e.g., every hour) to prevent table bloat
 * @returns {Promise<number>} Number of deleted records
 */
export async function cleanupExpiredRateLimits() {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "RateLimit" 
      WHERE "resetAt" < NOW() - INTERVAL '1 hour'
    `;
    console.log(`[rate-limit] Cleaned up ${result} expired records`);
    return result;
  } catch (error) {
    console.error('[rate-limit] Cleanup error:', error.message);
    return 0;
  }
}

