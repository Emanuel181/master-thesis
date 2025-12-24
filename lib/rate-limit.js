/**
 * SECURITY WARNING: This in-memory rate limiter has limitations:
 * 1. State is lost on server restart
 * 2. Does not work across multiple serverless function instances
 * 3. Memory usage grows with unique keys
 *
 * For production deployments with multiple instances, consider using:
 * - Redis-based rate limiting (e.g., @upstash/ratelimit)
 * - Database-backed rate limiting
 * - API Gateway rate limiting (AWS, Cloudflare, etc.)
 */
const buckets = new Map();

// Maximum number of buckets to prevent memory exhaustion under attack
const MAX_BUCKETS = 100000;

// Periodically clean up expired buckets to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL).unref(); // .unref() allows process to exit even if timer is active

export function rateLimit({ key, limit, windowMs, now = Date.now() }) {
  if (!key) return { allowed: true, remaining: limit };

  // Protect against memory exhaustion - reject if too many buckets
  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
    console.warn('[rate-limit] Max buckets reached, rejecting new key');
    return { allowed: false, remaining: 0, resetAt: now + windowMs };
  }

  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    const next = { remaining: limit - 1, resetAt };
    buckets.set(key, next);
    return { allowed: true, remaining: next.remaining, resetAt };
  }

  if (bucket.remaining <= 0) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.remaining -= 1;
  buckets.set(key, bucket);
  return { allowed: true, remaining: bucket.remaining, resetAt: bucket.resetAt };
}

