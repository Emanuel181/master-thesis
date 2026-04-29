// Validate the Python Lambda's payload shape against autoFixSchema.
import { z } from 'zod';

const autoFixSchema = z.object({
    runId: z.string().min(1),
    fixes: z.array(z.object({
        vulnerabilityId: z.string().min(1),
        fileName: z.string().min(1),
        originalCode: z.string(),
        fixedCode: z.string(),
        startLine: z.number().int().positive().optional(),
        endLine: z.number().int().positive().optional(),
        explanation: z.string(),
        changes: z.any().optional(),
        language: z.string().optional(),
    })).min(1),
});

// Payloads the Python side will produce in each variant
const cases = [
    {
        name: 'minimal',
        payload: {
            runId: 'run_abc',
            fixes: [{
                vulnerabilityId: 'vuln_run_abc_deadbeefdeadbeef',
                fileName: 'src/a.py', originalCode: 'x', fixedCode: 'y',
                explanation: 'fix it',
            }],
        },
    },
    {
        name: 'with optional fields',
        payload: {
            runId: 'run_abc',
            fixes: [{
                vulnerabilityId: 'vuln_run_abc_1',
                fileName: 'src/a.py', originalCode: 'x', fixedCode: 'y',
                explanation: 'fix', startLine: 10, endLine: 12,
                changes: [{ line: 10, before: 'x', after: 'y' }],
                language: 'python',
            }],
        },
    },
    {
        name: 'invalid startLine=0 (should be dropped by Python builder)',
        payload: {
            runId: 'run_abc',
            fixes: [{
                vulnerabilityId: 'vuln_1',
                fileName: 'a.py', originalCode: 'x', fixedCode: 'y',
                explanation: 'z', startLine: 0,
            }],
        },
        expectFail: true,
    },
];

let allOk = true;
for (const c of cases) {
    const r = autoFixSchema.safeParse(c.payload);
    const ok = c.expectFail ? !r.success : r.success;
    console.log((ok ? 'PASS' : 'FAIL') + ' — ' + c.name + (r.success ? '' : '  :: ' + JSON.stringify(r.error.issues)));
    if (!ok) allOk = false;
}
process.exit(allOk ? 0 : 1);

