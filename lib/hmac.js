/**
 * HMAC utility for agent → server callbacks.
 * --------------------------------------------
 *
 * Lambdas (implementer, tester, reporter) sign their payloads with a shared
 * secret so they can call `/api/workflow/*` endpoints without a user session.
 *
 * Signature format:
 *   X-Agent-Signature:   "v1=<hex sha256 hmac>"
 *   X-Agent-Timestamp:   "<unix seconds>"
 *   X-Agent-Request-Id:  "<uuid>"
 *
 * Signed string = `${timestamp}.${requestId}.${rawBody}`
 *
 * The caller sets WORKFLOW_AGENT_HMAC_SECRET. Replay protection rejects
 * any request whose timestamp is > 5 minutes old, and an in-memory LRU of
 * recent request IDs rejects duplicates.
 */

import crypto from 'node:crypto';

const MAX_SKEW_MS = 5 * 60 * 1000; // 5 minutes
const REPLAY_CACHE_SIZE = 1024;
const recentIds = new Map(); // insertion-ordered

function remember(id) {
    recentIds.set(id, Date.now());
    if (recentIds.size > REPLAY_CACHE_SIZE) {
        const oldest = recentIds.keys().next().value;
        recentIds.delete(oldest);
    }
}

/**
 * Compute the HMAC-SHA256 signature string for a payload.
 * @param {string} secret
 * @param {string} timestamp
 * @param {string} requestId
 * @param {string} rawBody
 * @returns {string} "v1=<hex>"
 */
export function signAgentRequest(secret, timestamp, requestId, rawBody) {
    const mac = crypto.createHmac('sha256', secret);
    mac.update(`${timestamp}.${requestId}.${rawBody}`);
    return `v1=${mac.digest('hex')}`;
}

/**
 * Verify an incoming request's HMAC. Returns { ok: true } or
 * { ok: false, reason } explaining why it failed.
 *
 * @param {Request} request - Next.js Web Request
 * @param {string} rawBody  - the exact request body as a string
 */
export function verifyAgentRequest(request, rawBody) {
    const secret = process.env.WORKFLOW_AGENT_HMAC_SECRET;
    if (!secret) {
        return { ok: false, reason: 'HMAC secret not configured' };
    }

    const sig = request.headers.get('x-agent-signature');
    const ts = request.headers.get('x-agent-timestamp');
    const rid = request.headers.get('x-agent-request-id');
    if (!sig || !ts || !rid) {
        return { ok: false, reason: 'Missing HMAC headers' };
    }

    // Replay window
    const tsMs = Number(ts) * 1000;
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > MAX_SKEW_MS) {
        return { ok: false, reason: 'Timestamp outside allowed window' };
    }

    // Replay cache
    if (recentIds.has(rid)) {
        return { ok: false, reason: 'Duplicate request id' };
    }

    // Constant-time compare
    const expected = signAgentRequest(secret, ts, rid, rawBody);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return { ok: false, reason: 'Bad signature' };
    }

    remember(rid);
    return { ok: true, requestId: rid };
}

