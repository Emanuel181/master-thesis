// lib/api-security.js
// Centralized, dependency-free security helpers for API routes.

/** @type {Record<string, string>} */
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
  // ZAP security headers - defense in depth
  'X-XSS-Protection': '1; mode=block',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

/**
 * Get client IP address consistently
 * 
 * IMPORTANT: For AWS ALB, the client IP is the LAST entry in X-Forwarded-For
 * because ALB appends the client IP. For other proxies (Cloudflare, nginx),
 * the client IP is typically the FIRST entry.
 * 
 * Configure PROXY_TYPE env var to match your infrastructure:
 * - 'aws-alb': Takes last IP (AWS ALB behavior) - DEFAULT
 * - 'cloudflare' or 'nginx': Takes first IP
 * 
 * @param {Request} request - The request object
 * @returns {string} Client IP address or 'unknown'
 */
export function getClientIp(request) {
    const xff = request.headers.get('x-forwarded-for');
    
    if (xff) {
        const ips = xff.split(',').map(ip => ip.trim()).filter(Boolean);
        const proxyType = process.env.PROXY_TYPE || 'aws-alb';
        
        // AWS ALB appends client IP to the end
        if (proxyType === 'aws-alb') {
            return ips[ips.length - 1] || 'unknown';
        }
        
        // Cloudflare/nginx prepend client IP to the start
        return ips[0] || 'unknown';
    }
    
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

