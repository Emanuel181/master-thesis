import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { verifyAgentRequest } from '@/lib/hmac';
import { generateSecurityReportPDF } from '@/lib/pdf-report-generator';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';

const AGENT_ARTIFACTS_BUCKET =
    process.env.AGENT_ARTIFACTS_BUCKET || process.env.AWS_S3_BUCKET_NAME;

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
        : undefined,
});

// Load the VulnIQ logo once (best-effort)
let cachedLogoBytes = null;
function getLogoBytes() {
    if (cachedLogoBytes !== null) return cachedLogoBytes || null;
    try {
        cachedLogoBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'favicon.png'));
        return cachedLogoBytes;
    } catch {
        cachedLogoBytes = false;
        return null;
    }
}

/**
 * POST /api/workflow/report
 *
 * HMAC-authenticated. Called by the Reporter agent Lambda after it has
 * aggregated the run (JSON bundle in S3). This route:
 *
 *   1. Validates the signature.
 *   2. Loads the JSON bundle (or falls back to DB).
 *   3. Renders a PDF with the canonical lib/pdf-report-generator.js — the
 *      SAME generator used by the Results page download button.
 *   4. Stores the PDF in the agent artifacts S3 bucket.
 *   5. Upserts the Report row (1:1 with WorkflowRun).
 *
 * Body (from Reporter Lambda):
 *   { runId, useCaseId?, jsonS3Key, summary, narrative?, renderPdf? }
 *
 * Back-compat: a pre-rendered `pdfS3Key` may be supplied, in which case
 * the route just upserts the row without re-rendering.
 */
const reportPostSchema = z.object({
    runId: z.string().min(1),
    useCaseId: z.string().optional().nullable(),
    pdfS3Key: z.string().optional().nullable(),
    jsonS3Key: z.string().optional().nullable(),
    summary: z.record(z.any()).default({}),
    narrative: z.string().optional().default(''),
    renderPdf: z.boolean().optional().default(true),
});

export async function POST(request) {
    try {
        const rawBody = await request.text();
        const hmac = verifyAgentRequest(request, rawBody);
        if (!hmac.ok) {
            const session = await auth();
            if (!session?.user?.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const validated = reportPostSchema.parse(JSON.parse(rawBody));

        const run = await prisma.workflowRun.findUnique({
            where: { id: validated.runId },
            select: { id: true, userId: true, metadata: true },
        });
        if (!run) {
            return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
        }

        let pdfS3Key = validated.pdfS3Key || null;

        // If the Lambda asked us to render the PDF (the common path now),
        // do it here via the canonical generator.
        if (validated.renderPdf && !pdfS3Key) {
            if (!AGENT_ARTIFACTS_BUCKET) {
                return NextResponse.json(
                    { error: 'AGENT_ARTIFACTS_BUCKET not configured' },
                    { status: 500 },
                );
            }

            // Load the agent's canonical JSON bundle (if any)
            let bundle = null;
            if (validated.jsonS3Key) {
                try {
                    const obj = await s3.send(new GetObjectCommand({
                        Bucket: AGENT_ARTIFACTS_BUCKET,
                        Key: validated.jsonS3Key,
                    }));
                    bundle = JSON.parse(await obj.Body.transformToString());
                } catch (e) {
                    console.warn('[report] Could not load JSON bundle, falling back to DB:', e.message);
                }
            }

            // Fall back to DB when the bundle is missing/partial
            if (!bundle || !Array.isArray(bundle.vulnerabilities) || bundle.vulnerabilities.length === 0) {
                const dbVulns = await prisma.vulnerability.findMany({
                    where: { workflowRunId: validated.runId },
                    orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
                });
                bundle = bundle || {};
                bundle.vulnerabilities = dbVulns;
            }

            const vulns = (bundle.vulnerabilities || []).map((v, i) => ({
                id: v?.id || `vuln-${i}`,
                title: v?.title || '',
                severity: v?.severity || '',
                type: v?.type || '',
                details: v?.details || v?.description || '',
                fileName: v?.fileName || '',
                lineNumber: v?.lineNumber ?? null,
                vulnerableCode: v?.vulnerableCode || '',
                explanation: v?.explanation || '',
                bestPractices: v?.bestPractices || '',
                exploitExamples: v?.exploitExamples || '',
                cweId: v?.cweId || '',
                attackPath: v?.attackPath || '',
                confidence: v?.confidence ?? null,
                cvssScore: v?.cvssScore ?? null,
                cvssVector: v?.cvssVector || '',
                documentReferences: v?.documentReferences || [],
            }));

            const summaryForPdf = {
                totalVulnerabilities: validated.summary.totalVulnerabilities ?? vulns.length,
                criticalCount: validated.summary.criticalCount
                    ?? vulns.filter((v) => (v.severity || '').toLowerCase() === 'critical').length,
                highCount: validated.summary.highCount
                    ?? vulns.filter((v) => (v.severity || '').toLowerCase() === 'high').length,
                mediumCount: validated.summary.mediumCount
                    ?? vulns.filter((v) => (v.severity || '').toLowerCase() === 'medium').length,
                lowCount: validated.summary.lowCount
                    ?? vulns.filter((v) => (v.severity || '').toLowerCase() === 'low').length,
            };

            const projectName =
                run.metadata?.currentRepo?.repo
                || run.metadata?.code?.projectName
                || bundle.useCaseTitle
                || 'Security Assessment';

            let pdfBytes;
            try {
                pdfBytes = await generateSecurityReportPDF({
                    runId: validated.runId,
                    projectName,
                    timestamp: new Date().toISOString(),
                    vulnerabilities: vulns,
                    summary: summaryForPdf,
                    organizationName: 'VulnIQ Automated Workflow',
                    logoBytes: getLogoBytes(),
                });
            } catch (pdfErr) {
                console.error('[report] PDF generation failed:', pdfErr);
                return NextResponse.json(
                    { error: 'PDF generation failed', detail: pdfErr.message },
                    { status: 500 },
                );
            }

            const useCaseSegment = validated.useCaseId ? `${validated.useCaseId}/` : '';
            pdfS3Key = `runs/${validated.runId}/reporter/${useCaseSegment}security-report.pdf`;
            try {
                await s3.send(new PutObjectCommand({
                    Bucket: AGENT_ARTIFACTS_BUCKET,
                    Key: pdfS3Key,
                    Body: Buffer.from(pdfBytes),
                    ContentType: 'application/pdf',
                }));
            } catch (s3Err) {
                console.error('[report] PDF upload failed:', s3Err);
                return NextResponse.json(
                    { error: 'PDF upload failed', detail: s3Err.message },
                    { status: 500 },
                );
            }
        }

        if (!pdfS3Key) {
            return NextResponse.json(
                { error: 'No pdfS3Key provided and renderPdf=false' },
                { status: 400 },
            );
        }

        // Upsert the Report row (1:1 with WorkflowRun)
        const report = await prisma.report.upsert({
            where: { workflowRunId: validated.runId },
            create: {
                workflowRunId: validated.runId,
                pdfS3Key,
                jsonS3Key: validated.jsonS3Key || null,
                summary: validated.summary,
            },
            update: {
                pdfS3Key,
                jsonS3Key: validated.jsonS3Key || null,
                summary: validated.summary,
                generatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                reportId: report.id,
                pdfS3Key,
                jsonS3Key: validated.jsonS3Key || null,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', issues: error.issues }, { status: 400 });
        }
        console.error('[report POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * GET /api/workflow/report?runId=xxx
 * Returns a Markdown-style fallback report for the dashboard.
 * (The canonical branded PDF lives at the pdfS3Key on the Report row,
 * served via /api/reports/pdf for users.)
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const runId = searchParams.get('runId');
        if (!runId) {
            return NextResponse.json({ error: 'runId parameter is required' }, { status: 400 });
        }

        const workflowRun = await prisma.workflowRun.findFirst({
            where: { id: runId, userId: session.user.id },
            select: { id: true, metadata: true, status: true, startedAt: true, completedAt: true },
        });
        if (!workflowRun) {
            return NextResponse.json({ error: 'Workflow run not found' }, { status: 404 });
        }

        // Try to fetch a markdown report from S3 (legacy path)
        let markdownReport = null;
        if (AGENT_ARTIFACTS_BUCKET) {
            for (const key of [
                `runs/${runId}/final-report.md`,
                `runs/${runId}/reports/pentest-report.md`,
            ]) {
                try {
                    const res = await s3.send(new GetObjectCommand({
                        Bucket: AGENT_ARTIFACTS_BUCKET,
                        Key: key,
                    }));
                    markdownReport = await res.Body.transformToString();
                    break;
                } catch { /* try next */ }
            }

            if (!markdownReport && process.env.PENTEST_RESULTS_BUCKET) {
                const pentestSession = await prisma.pentestSession.findFirst({
                    where: { workflowRunId: runId },
                    select: { s3ResultsPrefix: true },
                });
                if (pentestSession?.s3ResultsPrefix) {
                    try {
                        const res = await s3.send(new GetObjectCommand({
                            Bucket: process.env.PENTEST_RESULTS_BUCKET,
                            Key: `${pentestSession.s3ResultsPrefix}pentest-report.md`,
                        }));
                        markdownReport = await res.Body.transformToString();
                    } catch { /* not found */ }
                }
            }
        }

        if (!markdownReport) {
            markdownReport = await generateFallbackReport(runId, workflowRun);
        }

        return NextResponse.json({
            success: true,
            data: {
                runId,
                report: markdownReport,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[report] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function generateFallbackReport(runId, workflowRun) {
    const vulnerabilities = await prisma.vulnerability.findMany({
        where: { workflowRunId: runId },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });

    const pentestSession = await prisma.pentestSession.findFirst({
        where: { workflowRunId: runId },
        include: { findings: true },
    });

    const fixes = await prisma.codeFix.findMany({
        where: { vulnerability: { workflowRunId: runId } },
        include: { vulnerability: { select: { title: true, severity: true } } },
    });

    const sevCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const v of vulnerabilities) {
        if (sevCounts[v.severity] !== undefined) sevCounts[v.severity]++;
    }

    const projectName =
        workflowRun.metadata?.currentRepo?.repo
        || workflowRun.metadata?.code?.projectName
        || 'Project';

    let report = `# Security Analysis Report\n\n`;
    report += `**Project:** ${projectName}\n`;
    report += `**Date:** ${new Date().toLocaleDateString()}\n`;
    report += `**Status:** ${workflowRun.status}\n\n`;
    report += `## Executive Summary\n\n`;
    report += `The automated security analysis identified **${vulnerabilities.length}** vulnerabilities`;
    if (pentestSession?.findings?.length) {
        report += ` and **${pentestSession.findings.length}** pentest findings`;
    }
    report += `.\n\n### Severity Breakdown\n\n`;
    report += `- **Critical:** ${sevCounts.Critical}\n- **High:** ${sevCounts.High}\n`;
    report += `- **Medium:** ${sevCounts.Medium}\n- **Low:** ${sevCounts.Low}\n\n`;

    if (fixes.length > 0) {
        const prFix = fixes.find((f) => f.prUrl);
        report += `## Automated Fixes\n\n**${fixes.length}** automated fixes were generated.\n`;
        if (prFix) report += `PR: [${prFix.prUrl}](${prFix.prUrl})\n`;
        report += `\n`;
    }

    report += `## Findings\n\n`;
    for (const v of vulnerabilities) {
        report += `### ${v.title}\n\n**Severity:** ${v.severity} | **File:** \`${v.fileName}\`\n`;
        if (v.cweId) report += `**CWE:** ${v.cweId}\n`;
        report += `\n${v.details || v.explanation || ''}\n\n---\n\n`;
    }

    report += `---\n\n*Report generated by VulnIQ automated security analysis*\n`;
    return report;
}

