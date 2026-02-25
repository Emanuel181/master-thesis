import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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
                vulnerabilities: {
                    select: { severity: true },
                },
            },
            orderBy: { startedAt: "desc" },
            take: limit,
        });

        // Compute severity counts per run and strip raw vulnerabilities array
        const enrichedRuns = runs.map(run => {
            const severityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
            run.vulnerabilities.forEach(v => {
                if (severityCounts.hasOwnProperty(v.severity)) {
                    severityCounts[v.severity]++;
                }
            });
            const { vulnerabilities, ...rest } = run;
            return { ...rest, severityCounts };
        });

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

