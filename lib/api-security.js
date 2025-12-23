// lib/api-security.js
// Centralized, dependency-free security helpers for API routes.

export const securityHeaders = {
  // Prevent caching of authenticated responses / PII
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  // Hardening
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  // Prevent cache mixups on shared proxies
  Vary: 'Cookie',
};

// Best-effort client IP for rate limiting.
// NOTE: x-forwarded-for is only trustworthy if your reverse proxy overwrites it.
export function getClientIp(request) {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

// CSRF defense-in-depth for cookie-authenticated endpoints.
// - If Origin is present, require it to match Host.
// - If Origin is absent (non-browser clients), allow.
export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin) return true;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJsonBody(request) {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, body: null };
  }
}

// Strict-ish S3 key validation.
// We enforce:
// - string
// - length <= maxLen
// - starts with requiredPrefix (authorization)
// - no traversal sequences or backslashes
// - allowed characters only (conservative allowlist)
export function validateS3Key(s3Key, { requiredPrefix, maxLen = 500 } = {}) {
  if (typeof s3Key !== 'string') return { ok: false, error: 'Invalid s3Key' };
  if (s3Key.length === 0 || s3Key.length > maxLen) return { ok: false, error: 'Invalid s3Key' };
  if (s3Key.includes('..') || s3Key.includes('\\') || s3Key.includes('//')) {
    return { ok: false, error: 'Invalid s3Key path' };
  }
  if (requiredPrefix && !s3Key.startsWith(requiredPrefix)) {
    return { ok: false, error: 'Access denied' };
  }
  // Allowlist: very common safe S3 key chars.
  // NOTE: We intentionally disallow spaces and percent-encoding to reduce ambiguity.
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(s3Key)) {
    return { ok: false, error: 'Invalid s3Key' };
  }
  return { ok: true };
}

