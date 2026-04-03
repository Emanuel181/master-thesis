import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/vulnerabilities?runId=...
 * Fetch vulnerabilities for a given workflow run (for inline code annotations)
 */
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");
    if (!runId) {
      return NextResponse.json({ error: "Missing runId parameter" }, { status: 400 });
    }

    // Verify the workflow run belongs to this user
    const workflowRun = await prisma.workflowRun.findFirst({
      where: { id: runId, userId: session.user.id },
    });

    if (!workflowRun) {
      return NextResponse.json({ error: "Workflow run not found" }, { status: 404 });
    }

    const vulnerabilities = await prisma.vulnerability.findMany({
      where: { workflowRunId: runId },
      orderBy: [{ severity: "asc" }, { fileName: "asc" }, { lineNumber: "asc" }],
      select: {
        id: true,
        severity: true,
        title: true,
        type: true,
        details: true,
        fileName: true,
        lineNumber: true,
        columnNumber: true,
        vulnerableCode: true,
        explanation: true,
        bestPractices: true,
        cweId: true,
        confidence: true,
        falsePositive: true,
        resolved: true,
      },
    });

    return NextResponse.json({ data: { vulnerabilities } });
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/vulnerabilities
 * Save vulnerabilities from Lambda functions
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { runId, vulnerabilities } = body;

    if (!runId || !vulnerabilities) {
      return NextResponse.json(
        { error: "Missing required fields: runId or vulnerabilities" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify the workflow run belongs to this user
    const workflowRun = await prisma.workflowRun.findFirst({
      where: {
        id: runId,
        userId: user.id,
      },
    });

    if (!workflowRun) {
      return NextResponse.json(
        { error: "Workflow run not found" },
        { status: 404 }
      );
    }

    // Save vulnerabilities
    const created = await prisma.vulnerability.createMany({
      data: vulnerabilities.map((vuln) => ({
        workflowRunId: runId,
        useCaseId: vuln.useCaseId || workflowRun.id,
        title: vuln.title || "",
        severity: vuln.severity || "",
        type: vuln.type || "",
        details: vuln.details || vuln.explanation || "",
        fileName: vuln.fileName || "",
        lineNumber: vuln.lineNumber || null,
        vulnerableCode: vuln.vulnerableCode || "",
        explanation: vuln.explanation || "",
        bestPractices: vuln.bestPractices || "",
        exploitExamples: vuln.exploitExamples || "",
        attackPath: vuln.attackPath || "",
        cweId: vuln.cweId || null,
        documentReferences: vuln.documentReferences || null,
      })),
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error("Error saving vulnerabilities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
