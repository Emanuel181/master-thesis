import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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
    const created = await Promise.all(
      vulnerabilities.map((vuln) =>
        prisma.vulnerability.create({
          data: {
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
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: created.length,
    });
  } catch (error) {
    console.error("Error saving vulnerabilities:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
