
/**
 * VirusTotal Integration
 * =======================
 *
 * Provides file scanning via the VirusTotal API v3.
 *
 * Flow:
 *   1. Compute SHA-256 of the file (without uploading it again).
 *   2. Check if VirusTotal already has a report for this hash.
 *   3a. If a report exists → return the verdict immediately.
 *   3b. If not → upload the file to VT and return the analysis ID for polling.
 *
 * Environment variables:
 *   VIRUSTOTAL_API_KEY – your VT API key (free or premium)
 *
 * Rate limits (free tier): 4 lookups/min, 500 lookups/day, 4 file submissions/min.
 * The caller is responsible for respecting these limits.
 */

import crypto from 'crypto';

// ── Constants ────────────────────────────────────────────────────────────────

const VT_BASE = 'https://www.virustotal.com/api/v3';
const VT_TIMEOUT_MS = 30_000;
const MAX_FILE_SIZE = 32 * 1024 * 1024; // VT /files endpoint accepts up to 32 MB

// ── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey() {
    const key = process.env.VIRUSTOTAL_API_KEY;
    if (!key) throw new Error('VIRUSTOTAL_API_KEY environment variable is not set');
    return key;
}

/**
 * Compute the SHA-256 hash of a Buffer or Uint8Array.
 * @param {Buffer} buffer
 * @returns {string} hex-encoded SHA-256
 */
export function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Convert a Node.js Readable stream into a Buffer.
 * Enforces a maximum byte limit to prevent memory exhaustion.
 * @param {import('stream').Readable} stream
 * @param {number} maxBytes
 * @returns {Promise<Buffer>}
 */
export async function streamToBuffer(stream, maxBytes = MAX_FILE_SIZE) {
    const chunks = [];
    let totalBytes = 0;
    for await (const chunk of stream) {
        totalBytes += chunk.length;
        if (totalBytes > maxBytes) {
            stream.destroy();
            throw new Error(`Stream exceeded maximum size of ${maxBytes} bytes`);
        }
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

// ── VirusTotal API Calls ─────────────────────────────────────────────────────

/**
 * Fetch an existing file report from VirusTotal by SHA-256 hash.
 *
 * @param {string} hash – SHA-256 hex string
 * @returns {Promise<{ found: boolean, report?: object }>}
 */
export async function getFileReport(hash) {
    const apiKey = getApiKey();

    const res = await fetch(`${VT_BASE}/files/${encodeURIComponent(hash)}`, {
        method: 'GET',
        headers: { 'x-apikey': apiKey },
        signal: AbortSignal.timeout(VT_TIMEOUT_MS),
    });

    if (res.status === 404) return { found: false };

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`VirusTotal GET /files/${hash} failed: ${res.status} ${body}`);
    }

    const json = await res.json();
    return { found: true, report: json.data };
}

/**
 * Upload a file to VirusTotal for scanning.
 *
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @returns {Promise<{ analysisId: string }>}
 */
export async function uploadFileForScan(fileBuffer, fileName) {
    const apiKey = getApiKey();

    if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new Error(`File too large for VT upload (${fileBuffer.length} bytes, max ${MAX_FILE_SIZE})`);
    }

    // Build multipart/form-data manually using FormData (Node 18+)
    const form = new FormData();
    form.append('file', new Blob([fileBuffer]), fileName);

    const res = await fetch(`${VT_BASE}/files`, {
        method: 'POST',
        headers: { 'x-apikey': apiKey },
        body: form,
        signal: AbortSignal.timeout(60_000), // uploads can be slower
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`VirusTotal POST /files failed: ${res.status} ${body}`);
    }

    const json = await res.json();
    const analysisId = json.data?.id;
    if (!analysisId) throw new Error('VirusTotal did not return an analysis ID');
    return { analysisId };
}

/**
 * Poll a VirusTotal analysis by its ID until it completes.
 *
 * @param {string} analysisId
 * @returns {Promise<{ status: string, stats?: object, report?: object }>}
 *   status: 'completed' | 'queued' | 'error'
 */
export async function getAnalysis(analysisId) {
    const apiKey = getApiKey();

    const res = await fetch(`${VT_BASE}/analyses/${encodeURIComponent(analysisId)}`, {
        method: 'GET',
        headers: { 'x-apikey': apiKey },
        signal: AbortSignal.timeout(VT_TIMEOUT_MS),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`VirusTotal GET /analyses/${analysisId} failed: ${res.status} ${body}`);
    }

    const json = await res.json();
    const attrs = json.data?.attributes;
    return {
        status: attrs?.status || 'unknown',
        stats: attrs?.stats,
        report: json.data,
    };
}

// ── High-Level Scan Orchestrator ─────────────────────────────────────────────

/**
 * Interpret a VT report or analysis stats to produce a simple verdict.
 *
 * @param {object} stats  – last_analysis_stats from VT
 * @returns {'clean' | 'malicious' | 'suspicious' | 'unknown'}
 */
export function interpretVerdict(stats) {
    if (!stats) return 'unknown';
    const { malicious = 0, suspicious = 0 } = stats;
    if (malicious > 0) return 'malicious';
    if (suspicious > 0) return 'suspicious';
    return 'clean';
}

/**
 * Full scan flow:
 *   1. Compute hash
 *   2. Check for existing report
 *   3. If found, return verdict
 *   4. If not, upload and return analysisId for later polling
 *
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @returns {Promise<{
 *   verdict: 'clean' | 'malicious' | 'suspicious' | 'unknown' | 'pending',
 *   hash: string,
 *   analysisId?: string,
 *   stats?: object,
 *   report?: object,
 * }>}
 */
export async function scanFile(fileBuffer, fileName) {
    const hash = sha256(fileBuffer);

    // Step 1: check if VT already knows this file
    const existing = await getFileReport(hash);
    if (existing.found) {
        const stats = existing.report?.attributes?.last_analysis_stats;
        return {
            verdict: interpretVerdict(stats),
            hash,
            stats,
            report: existing.report,
        };
    }

    // Step 2: upload for scanning
    const { analysisId } = await uploadFileForScan(fileBuffer, fileName);
    return {
        verdict: 'pending',
        hash,
        analysisId,
    };
}

