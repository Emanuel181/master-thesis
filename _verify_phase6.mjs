// Unit-test the bridge Lambda's pure helpers + payload shape.
import { z } from 'zod';
import crypto from 'node:crypto';

// Stub the SDK modules that index.js imports
const stub = (name) => {
    const mod = { Client: class { send() { return Promise.resolve({}); } } };
    return new Proxy(mod, { get: (t, p) => t[p] || (() => mod) });
};
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url);
const Module = req('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
    if (request.startsWith('@aws-sdk/')) return require.resolve('node:path'); // anything; we'll override exports
    return origResolve.call(this, request, ...rest);
};
// Replace the resolved module's exports with stubs
const FAKE = {
    SFNClient: class { send() { return Promise.resolve({}); } },
    StartExecutionCommand: class { },
    DescribeExecutionCommand: class { },
    S3Client: class { send() { return Promise.resolve({}); } },
    PutObjectCommand: class { },
    GetObjectCommand: class { },
    DynamoDBClient: class { },
    DynamoDBDocumentClient: { from: () => ({ send: () => Promise.resolve({ Items: [] }) }) },
    QueryCommand: class { },
};
const cache = req.cache;
for (const key of ['@aws-sdk/client-sfn', '@aws-sdk/client-s3', '@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb']) {
    cache[key] = { exports: FAKE };
}

process.env.PENTEST_STATE_MACHINE_ARN = 'arn:aws:states:us-east-1:111:stateMachine:pentest';
process.env.PENTEST_CODE_BUCKET = 'b';
process.env.PENTEST_RESULTS_BUCKET = 'r';

const impl = req('./infrastructure/lambda/agent-tester-pentest/index.js');
const { buildTestResultsFromFindings, signAgentRequest } = impl._internals;

// 1) buildTestResultsFromFindings — matched + unmatched + orphan
const vulns = [
    { id: 'v1', title: 'SQLi',  type: 'CWE-89', cweId: 'CWE-89' },
    { id: 'v2', title: 'XSS',   type: 'CWE-79', cweId: 'CWE-79' },
    { id: 'v3', title: 'Path',  type: 'CWE-22', cweId: 'CWE-22' },
];
const findings = [
    { findingId: 'f1', cweId: 'CWE-89', type: 'CWE-89', severity: 'HIGH',     title: 'SQLi reproduces', description: 'POST /login' },
    { findingId: 'f2', cweId: 'CWE-78', type: 'CWE-78', severity: 'CRITICAL', title: 'New cmdi',        description: 'os.system()' },
];
const out = buildTestResultsFromFindings(vulns, findings, 'sess-1');

const v1 = out.find((r) => r.vulnerabilityId === 'v1');
const v2 = out.find((r) => r.vulnerabilityId === 'v2');
const v3 = out.find((r) => r.vulnerabilityId === 'v3');
const orphan = out.find((r) => r.vulnerabilityId === null);

if (!(v1 && v1.passed === false)) throw new Error('v1 should fail (SQLi reproduces)');
if (!(v2 && v2.passed === true))  throw new Error('v2 should pass (no XSS finding)');
if (!(v3 && v3.passed === true))  throw new Error('v3 should pass (no Path finding)');
if (!(orphan && orphan.passed === false && orphan.evidence.includes('Orphan')))
    throw new Error('orphan finding missing');
if (out.some((r) => r.tool !== 'shannon-pentester')) throw new Error('wrong tool name');
if (out.some((r) => r.artifactsS3Key !== 'results/sess-1/')) throw new Error('wrong artifacts key');
console.log('PASS: buildTestResultsFromFindings (matched + unmatched + orphan)');

// 2) Zod schema match (mirrors app/api/workflow/test-results/route.js)
const testResultSchema = z.object({
    runId: z.string().min(1),
    results: z.array(z.object({
        vulnerabilityId: z.string().optional().nullable(),
        passed: z.boolean(),
        tool: z.string().min(1),
        category: z.string().optional().nullable(),
        evidence: z.string(),
        artifactsS3Key: z.string().optional().nullable(),
        durationMs: z.number().int().nonnegative().optional().nullable(),
    })).min(1),
});
const validated = testResultSchema.safeParse({ runId: 'run_1', results: out });
if (!validated.success) {
    console.error(JSON.stringify(validated.error.issues, null, 2));
    throw new Error('Zod validation failed');
}
console.log('PASS: payload validates against testResultSchema');

// 3) HMAC signing matches lib/hmac.js algorithm
const secret = 'sec';
const ts = '1700000000';
const rid = 'rid-1';
const body = JSON.stringify({ a: 1 });
const ours = signAgentRequest(secret, ts, rid, body);
const ref  = 'v1=' + crypto.createHmac('sha256', secret).update(`${ts}.${rid}.${body}`).digest('hex');
if (ours !== ref) throw new Error(`HMAC mismatch: ${ours} vs ${ref}`);
console.log('PASS: signAgentRequest matches lib/hmac.js algorithm');

console.log('\nALL PHASE 6 VERIFICATIONS PASSED');

