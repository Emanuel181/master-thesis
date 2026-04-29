import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { verifyAgentRequest } from '@/lib/hmac';
import { z } from 'zod';

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

/**
 * POST /api/workflow/test-results
 *
 * Called by the Tester (pentester) state machine after running checks against
 * the Implementer's fix branch. HMAC-authenticated. Persists one TestResult
 * row per vulnerability so the Reporter and UI can render pass/fail with
 * evidence and pointers to raw artifacts in S3.
 */
export async function POST(request) {
    try {
        const rawBody = await request.text();
        const hmac = verifyAgentRequest(request, rawBody);
        if (!hmac.ok) {
            // Allow authenticated users too (useful for manual upserts from the dashboard)
            const session = await auth();
            if (!session?.user?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const validated = testResultSchema.parse(JSON.parse(rawBody));

        const run = await prisma.workflowRun.findUnique({
            where: { id: validated.runId },
            select: { id: true },
        });
        if (!run) {
            return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
        }

        const created = await prisma.$transaction(
            validated.results.map((r) =>
                prisma.testResult.create({
                    data: {
                        workflowRunId: validated.runId,
                        vulnerabilityId: r.vulnerabilityId || null,
                        passed: r.passed,
                        tool: r.tool,
                        category: r.category || null,
                        evidence: r.evidence,
                        artifactsS3Key: r.artifactsS3Key || null,
                        durationMs: r.durationMs ?? null,
                    },
                }),
            ),
        );

        return NextResponse.json({
            success: true,
            data: { created: created.length, runId: validated.runId },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error' }, { status: 400 });
        }
        console.error('[test-results] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/workflow/test-results?runId=...
 * Returns all test results for a run (session-auth'd, owner-scoped).
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const runId = new URL(request.url).searchParams.get('runId');
        if (!runId) {
            return NextResponse.json({ error: 'runId required' }, { status: 400 });
        }
        const run = await prisma.workflowRun.findFirst({
            where: { id: runId, userId: session.user.id },
            select: { id: true },
        });
        if (!run) {
            return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
        }
        const results = await prisma.testResult.findMany({
            where: { workflowRunId: runId },
            orderBy: { executedAt: 'desc' },
        });
        const passed = results.filter((r) => r.passed).length;
        return NextResponse.json({
            success: true,
            data: {
                runId,
                total: results.length,
                passed,
                failed: results.length - passed,
                results,
            },
        });
    } catch (error) {
        console.error('[test-results GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

