/**
 * API Route: Generate Security Report PDF
 * POST /api/reports/pdf
 *
 * Generates a password-protected PDF security assessment report.
 * A new random password is generated on every download and persisted
 * to the WorkflowRun record so the user can retrieve it later via
 * device biometric / PIN authentication.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateSecurityReportPDF } from '@/lib/pdf-report-generator';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { prisma } from '@/lib/prisma';
import { verifyUnlockToken } from '@/lib/user-passkey';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Generate a cryptographically random PDF password.
 * Returns a 12-character uppercase alphanumeric string.
 */
function generateRandomPdfPassword() {
    return crypto.randomBytes(8).toString('hex').substring(0, 12).toUpperCase();
}

// Load logo bytes once at module level
let cachedLogoBytes = null;
function getLogoBytes() {
    if (cachedLogoBytes) return cachedLogoBytes;
    try {
        const logoPath = path.join(process.cwd(), 'public', 'favicon.png');
        cachedLogoBytes = fs.readFileSync(logoPath);
        return cachedLogoBytes;
    } catch (e) {
        console.warn('[PDF] Could not load logo from public/favicon.png:', e.message);
        return null;
    }
}

export async function POST(request) {
    try {
        console.log('[PDF API] Request received');

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { runId, projectName, vulnerabilities, summary } = body;

        if (!runId) {
            return NextResponse.json(
                { error: 'Run ID is required' },
                { status: 400 }
            );
        }

        // Verify the workflow run belongs to the authenticated user
        const workflowRun = await prisma.workflowRun.findUnique({
            where: { id: runId },
            select: { userId: true },
        });

        if (!workflowRun || workflowRun.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Workflow run not found' },
                { status: 404 }
            );
        }

        // Fetch vulnerabilities from database if not provided
        let vulnData = vulnerabilities;
        let summaryData = summary;

        if (!vulnData || vulnData.length === 0) {
            try {
                const dbVulns = await prisma.vulnerability.findMany({
                    where: { workflowRunId: runId },
                    orderBy: [
                        { severity: 'asc' },
                        { createdAt: 'desc' }
                    ]
                });

                vulnData = dbVulns.map(v => ({
                    id: v.id,
                    title: v.title,
                    severity: v.severity,
                    type: v.type,
                    details: v.details,
                    fileName: v.fileName,
                    lineNumber: v.lineNumber,
                    vulnerableCode: v.vulnerableCode,
                    explanation: v.explanation,
                    bestPractices: v.bestPractices,
                    exploitExamples: v.exploitExamples,
                    cweId: v.cweId,
                    attackPath: v.attackPath,
                    confidence: v.confidence,
                }));

                // Calculate summary from database
                if (!summaryData) {
                    summaryData = {
                        totalVulnerabilities: dbVulns.length,
                        criticalCount: dbVulns.filter(v => v.severity?.toLowerCase() === 'critical').length,
                        highCount: dbVulns.filter(v => v.severity?.toLowerCase() === 'high').length,
                        mediumCount: dbVulns.filter(v => v.severity?.toLowerCase() === 'medium').length,
                        lowCount: dbVulns.filter(v => v.severity?.toLowerCase() === 'low').length,
                    };
                }
            } catch (dbError) {
                console.error('Error fetching vulnerabilities from database:', dbError);
                // Continue with provided data or empty arrays
                vulnData = vulnerabilities || [];
                summaryData = summary || {
                    totalVulnerabilities: 0,
                    criticalCount: 0,
                    highCount: 0,
                    mediumCount: 0,
                    lowCount: 0,
                };
            }
        }

        // Ensure vulnData is an array and sanitize it
        if (!Array.isArray(vulnData)) {
            vulnData = [];
        }

        // Sanitize each vulnerability to ensure required fields exist
        vulnData = vulnData.map((v, index) => ({
            id: v?.id || `vuln-${index}`,
            title: v?.title || '',
            severity: v?.severity || '',
            type: v?.type || '',
            details: v?.details || v?.description || '',
            fileName: v?.fileName || '',
            lineNumber: v?.lineNumber || null,
            vulnerableCode: v?.vulnerableCode || '',
            explanation: v?.explanation || '',
            bestPractices: v?.bestPractices || '',
            exploitExamples: v?.exploitExamples || '',
            cweId: v?.cweId || '',
            attackPath: v?.attackPath || '',
            confidence: v?.confidence ?? null,
            cvssScore: v?.cvssScore ?? null,
            cvssVector: v?.cvssVector || '',
        }));

        // Ensure summary exists with defaults
        if (!summaryData || typeof summaryData !== 'object') {
            summaryData = {
                totalVulnerabilities: vulnData.length,
                criticalCount: vulnData.filter(v => v.severity?.toLowerCase() === 'critical').length,
                highCount: vulnData.filter(v => v.severity?.toLowerCase() === 'high').length,
                mediumCount: vulnData.filter(v => v.severity?.toLowerCase() === 'medium').length,
                lowCount: vulnData.filter(v => v.severity?.toLowerCase() === 'low').length,
            };
        }

        // Log data being passed to PDF generator
        console.log('[PDF] Generating PDF with:', {
            runId,
            projectName: projectName || undefined,
            vulnerabilityCount: vulnData?.length || 0,
            summary: summaryData,
        });

        // Generate the PDF
        let pdfBytes;
        try {
            pdfBytes = await generateSecurityReportPDF({
                runId,
                projectName: projectName || undefined,
                timestamp: new Date().toISOString(),
                vulnerabilities: vulnData,
                summary: summaryData,
                organizationName: session.user.name ? `${session.user.name}'s Assessment` : undefined,
                logoBytes: getLogoBytes(),
            });
        } catch (pdfError) {
            console.error('[PDF] Error in generateSecurityReportPDF:', pdfError);
            console.error('[PDF] Error details:', pdfError.message, pdfError.stack);
            throw pdfError;
        }

        console.log('[PDF] PDF generated successfully, size:', pdfBytes?.length || 0);

        // Generate a NEW random password for every download
        const pdfPassword = generateRandomPdfPassword();
        let encryptedPdfBytes;
        try {
            encryptedPdfBytes = await encryptPDF(
                new Uint8Array(pdfBytes),
                pdfPassword,       // user password (needed to open)
                pdfPassword + 'OW' // owner password (for permissions)
            );
            console.log('[PDF] PDF encrypted successfully, size:', encryptedPdfBytes?.length || 0);
        } catch (encryptError) {
            console.warn('[PDF] PDF encryption failed, returning unencrypted:', encryptError.message);
            // Fallback: return unencrypted PDF if encryption fails
            encryptedPdfBytes = pdfBytes;
        }

        // Persist the password in the WorkflowRun record
        try {
            await prisma.workflowRun.update({
                where: { id: runId },
                data: { pdfPassword },
            });
        } catch (dbErr) {
            console.warn('[PDF] Could not persist PDF password:', dbErr.message);
        }

        // Return encrypted PDF — password is NOT sent in response.
        // User must authenticate via biometrics/PIN to reveal it.
        return new NextResponse(encryptedPdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="security-report-${runId}.pdf"`,
                'Content-Length': encryptedPdfBytes.length.toString(),
            },
        });

    } catch (error) {
        console.error('Error generating PDF report:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate PDF report',
                ...(process.env.NODE_ENV === 'development' && { details: error.message, stack: error.stack }),
            },
            { status: 500 }
        );
    }
}

// GET endpoint to check if report exists or get report metadata / password
export async function GET(request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const runId = searchParams.get('runId');
        const action = searchParams.get('action');

        if (!runId) {
            return NextResponse.json(
                { error: 'Run ID is required' },
                { status: 400 }
            );
        }

        // Return the PDF password for this run (requires biometric unlock token)
        if (action === 'password') {
            // Verify the unlock token from biometric/passkey authentication
            const authHeader = request.headers.get('authorization') || '';
            const token = authHeader.replace(/^Bearer\s+/i, '');
            if (!token) {
                return NextResponse.json(
                    { error: 'Biometric authentication required to reveal the password' },
                    { status: 403 }
                );
            }
            try {
                const { userId: tokenUserId } = verifyUnlockToken(token);
                if (tokenUserId !== session.user.id) {
                    return NextResponse.json({ error: 'Token does not match session' }, { status: 403 });
                }
            } catch (tokenErr) {
                return NextResponse.json(
                    { error: tokenErr.message || 'Invalid or expired unlock token' },
                    { status: 403 }
                );
            }

            try {
                const run = await prisma.workflowRun.findFirst({
                    where: { id: runId, userId: session.user.id },
                    select: { pdfPassword: true },
                });
                if (!run || !run.pdfPassword) {
                    return NextResponse.json(
                        { error: 'No password found. Download the PDF report first.' },
                        { status: 404 }
                    );
                }
                return NextResponse.json({ password: run.pdfPassword });
            } catch (dbErr) {
                console.error('[PDF] Error fetching password:', dbErr);
                return NextResponse.json(
                    { error: 'Failed to retrieve password' },
                    { status: 500 }
                );
            }
        }

        // Check if we have data for this run
        try {
            const vulnCount = await prisma.vulnerability.count({
                where: { workflowRunId: runId }
            });

            return NextResponse.json({
                runId,
                hasData: vulnCount > 0,
                vulnerabilityCount: vulnCount,
                canGenerateReport: vulnCount > 0,
            });
        } catch (dbError) {
            console.error('Error checking run data:', dbError);
            return NextResponse.json({
                runId,
                hasData: false,
                vulnerabilityCount: 0,
                canGenerateReport: false,
            });
        }

    } catch (error) {
        console.error('Error checking report status:', error);
        return NextResponse.json(
            { error: 'Failed to check report status' },
            { status: 500 }
        );
    }
}

