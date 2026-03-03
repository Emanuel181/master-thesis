import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/workflow/debate
 * 
 * Retrieve debate rounds for a vulnerability or workflow run.
 * 
 * Query params:
 *   - vulnerabilityId: Get debate rounds for a specific vulnerability
 *   - workflowRunId: Get all debate rounds for a workflow run
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const vulnerabilityId = searchParams.get("vulnerabilityId");
        const workflowRunId = searchParams.get("workflowRunId");

        if (!vulnerabilityId && !workflowRunId) {
            return NextResponse.json(
                { success: false, error: "Either vulnerabilityId or workflowRunId is required" },
                { status: 400 }
            );
        }

        // Validate input format (CUID pattern)
        const cuidPattern = /^c[a-z0-9]{24,}$/;
        if (vulnerabilityId && !cuidPattern.test(vulnerabilityId)) {
            return NextResponse.json(
                { success: false, error: "Invalid vulnerabilityId format" },
                { status: 400 }
            );
        }
        if (workflowRunId && !cuidPattern.test(workflowRunId)) {
            return NextResponse.json(
                { success: false, error: "Invalid workflowRunId format" },
                { status: 400 }
            );
        }

        // Build query filters
        const where = {};

        // Optimized: single ownership check when both params provided
        if (vulnerabilityId && workflowRunId) {
            const vulnerability = await prisma.vulnerability.findFirst({
                where: {
                    id: vulnerabilityId,
                    workflowRunId: workflowRunId,
                    workflowRun: { userId: session.user.id },
                },
                select: { id: true },
            });

            if (!vulnerability) {
                return NextResponse.json(
                    { success: false, error: "Vulnerability not found in the specified workflow" },
                    { status: 404 }
                );
            }

            where.vulnerabilityId = vulnerabilityId;
            where.workflowRunId = workflowRunId;
        } else if (vulnerabilityId) {
            // Verify the vulnerability belongs to a workflow owned by this user
            const vulnerability = await prisma.vulnerability.findFirst({
                where: {
                    id: vulnerabilityId,
                    workflowRun: { userId: session.user.id },
                },
                select: { id: true, workflowRunId: true },
            });

            if (!vulnerability) {
                return NextResponse.json(
                    { success: false, error: "Vulnerability not found" },
                    { status: 404 }
                );
            }

            where.vulnerabilityId = vulnerabilityId;
        } else {
            // Only workflowRunId provided
            const workflowRun = await prisma.workflowRun.findFirst({
                where: {
                    id: workflowRunId,
                    userId: session.user.id,
                },
                select: { id: true },
            });

            if (!workflowRun) {
                return NextResponse.json(
                    { success: false, error: "Workflow run not found" },
                    { status: 404 }
                );
            }

            where.workflowRunId = workflowRunId;
        }

        const debateRounds = await prisma.debateRound.findMany({
            where,
            orderBy: [
                { round: "asc" },
                { createdAt: "asc" },
            ],
        });

        // Group by vulnerability if returning multiple
        const grouped = {};
        for (const round of debateRounds) {
            const key = round.vulnerabilityId || "general";
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push({
                id: round.id,
                round: round.round,
                agentRole: round.agentRole,
                modelId: round.modelId,
                argument: round.argument,
                verdict: round.verdict,
                confidence: round.confidence,
                citations: round.citations,
                createdAt: round.createdAt,
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                debates: grouped,
                totalRounds: debateRounds.length,
            },
        });
    } catch (error) {
        console.error("[Debate API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch debate data" },
            { status: 500 }
        );
    }
}
