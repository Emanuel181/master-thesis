const buckets = new Map();

export function rateLimit({ key, limit, windowMs, now = Date.now() }) {
  if (!key) return { allowed: true, remaining: limit };

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

