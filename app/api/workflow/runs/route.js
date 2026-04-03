import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/workflow/runs
 * Fetch recent workflow runs for the authenticated user.
 * Query params:
 *   - limit (number, default 10, max 50)
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rl = await rateLimit(session.user.id, { limit: 60, windowMs: 60_000, keyPrefix: 'workflow:runs:get' });
        if (!rl.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

        const runs = await prisma.workflowRun.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
                totalUseCases: true,
                completedUseCases: true,
                metadata: true,
                _count: {
                    select: { vulnerabilities: true },
                },
            },
            orderBy: { startedAt: "desc" },
            take: limit,
        });

        // Single aggregation query instead of fetching every vulnerability row
        const runIds = runs.map(r => r.id);
        const severityGroups = await prisma.vulnerability.groupBy({
            by: ['workflowRunId', 'severity'],
            _count: true,
            where: { workflowRunId: { in: runIds } },
        });

        // Build runId → severityCounts map from the groupBy result
        const severityByRun = {};
        for (const group of severityGroups) {
            if (!severityByRun[group.workflowRunId]) {
                severityByRun[group.workflowRunId] = { Critical: 0, High: 0, Medium: 0, Low: 0 };
            }
            if (Object.prototype.hasOwnProperty.call(severityByRun[group.workflowRunId], group.severity)) {
                severityByRun[group.workflowRunId][group.severity] = group._count;
            }
        }

        const enrichedRuns = runs.map(run => ({
            ...run,
            severityCounts: severityByRun[run.id] ?? { Critical: 0, High: 0, Medium: 0, Low: 0 },
        }));

        return NextResponse.json({ runs: enrichedRuns });
    } catch (error) {
        console.error("[API] Error fetching workflow runs:", error);
        return NextResponse.json(
            { error: "Failed to fetch workflow runs" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/workflow/runs
 * Delete a specific workflow run by ID.
 * Body: { runId: string }
 */
export async function DELETE(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rl = await rateLimit(session.user.id, { limit: 20, windowMs: 60_000, keyPrefix: 'workflow:runs:delete' });
        if (!rl.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const { runId } = await request.json();
        if (!runId) {
            return NextResponse.json({ error: "runId is required" }, { status: 400 });
        }

        // Verify the run belongs to the user
        const run = await prisma.workflowRun.findFirst({
            where: { id: runId, userId: session.user.id },
            select: { id: true },
        });

        if (!run) {
            return NextResponse.json({ error: "Run not found" }, { status: 404 });
        }

        // Delete cascade (vulnerabilities, useCaseRuns are cascade-deleted via schema)
        await prisma.workflowRun.delete({
            where: { id: runId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API] Error deleting workflow run:", error);
        return NextResponse.json(
            { error: "Failed to delete workflow run" },
            { status: 500 }
        );
    }
}

