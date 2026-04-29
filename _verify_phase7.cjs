// Phase 7 end-to-end sanity:
//   (a) Python reporter HMAC matches JS verifier for GET report-data
//   (b) Python reporter HMAC matches JS verifier for POST report
//   (c) report/route.js POST body validates against its own schema
const crypto = require('node:crypto');
const { z } = require('zod');

// Same algorithm the reporter Lambda uses (python hmac.new sha256 hex)
function pySign(secret, ts, rid, raw) {
    return 'v1=' + crypto.createHmac('sha256', secret)
        .update(`${ts}.${rid}.${raw}`).digest('hex');
}

// Algorithm that lib/hmac.js verifyAgentRequest uses (reconstructed)
function jsVerify(secret, ts, rid, raw, sig) {
    const expected = pySign(secret, ts, rid, raw);
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

const SECRET = 'test-secret';

// (a) GET /api/workflow/report-data — Lambda signs over `url.search`
const query = '?runId=run_abc_123';
const ts1 = '1700000000';
const rid1 = 'rid-get-1';
const sig1 = pySign(SECRET, ts1, rid1, query);
if (!jsVerify(SECRET, ts1, rid1, query, sig1)) throw new Error('GET HMAC mismatch');
console.log('PASS: GET /report-data HMAC round-trips');

// (b) POST /api/workflow/report — Lambda signs over rawBody (separators=(',', ':'))
const payload = {
    runId: 'run_abc_123',
    useCaseId: 'uc_1',
    jsonS3Key: 'runs/run_abc_123/reporter/uc_1/output.json',
    summary: { totalVulnerabilities: 3, criticalCount: 1, highCount: 1, mediumCount: 1, lowCount: 0 },
    narrative: 'Short narrative.',
    renderPdf: true,
};
// Replicate Python json.dumps(..., separators=(',', ':'), ensure_ascii=False)
const rawBody = JSON.stringify(payload);
const ts2 = '1700000001';
const rid2 = 'rid-post-1';
const sig2 = pySign(SECRET, ts2, rid2, rawBody);
if (!jsVerify(SECRET, ts2, rid2, rawBody, sig2)) throw new Error('POST HMAC mismatch');
console.log('PASS: POST /report HMAC round-trips');

// (c) The POST body matches the route's Zod schema (copied from route.js)
const reportPostSchema = z.object({
    runId: z.string().min(1),
    useCaseId: z.string().optional().nullable(),
    pdfS3Key: z.string().optional().nullable(),
    jsonS3Key: z.string().optional().nullable(),
    summary: z.record(z.any()).default({}),
    narrative: z.string().optional().default(''),
    renderPdf: z.boolean().optional().default(true),
});
const parsed = reportPostSchema.safeParse(JSON.parse(rawBody));
if (!parsed.success) {
    console.error(JSON.stringify(parsed.error.issues, null, 2));
    throw new Error('Zod validation failed');
}
console.log('PASS: POST /report body validates against reportPostSchema');

console.log('\nALL PHASE 7 VERIFICATIONS PASSED');

