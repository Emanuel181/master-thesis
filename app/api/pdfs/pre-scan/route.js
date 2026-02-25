/**
 * PDFs Pre-Scan API Route
 * ========================
 *
 * POST - Scan a PDF file for malware BEFORE it is uploaded to S3.
 *
 * Flow:
 *  1. Client sends the raw PDF as multipart/form-data
 *  2. Server validates file type via magic bytes
 *  3. Server sends file to VirusTotal
 *  4. If VT has an instant verdict → return it
 *  5. If VT needs to analyse → poll server-side up to ~3 min, then return
 *  6. Client only proceeds with S3 upload if verdict is 'clean'
 *
 * This endpoint does NOT touch S3 or the database — it only scans.
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { isDemoRequest } from '@/lib/demo-mode';
import { scanFile, getAnalysis, interpretVerdict } from '@/lib/virustotal';
import { createFileNotification, NOTIFICATION_TYPES } from '@/lib/notifications';

const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB

// PDF magic bytes: %PDF
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]);

export async function POST(request) {
    try {
        // Block demo mode
        if (isDemoRequest(request)) {
            return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });
        }

        // Auth
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // If VT is not configured, skip scanning — return clean
        if (!process.env.VIRUSTOTAL_API_KEY) {
            return NextResponse.json({
                success: true,
                data: { verdict: 'skipped', reason: 'VirusTotal not configured' },
            });
        }

        // Parse multipart form
        const formData = await request.formData();
        const file = formData.get('file');
        const fileName = formData.get('fileName') || file?.name || 'document.pdf';

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Size check
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
            }, { status: 400 });
        }

        // Read into buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Validate PDF magic bytes
        if (fileBuffer.length < 4 || !fileBuffer.subarray(0, 4).equals(PDF_MAGIC)) {
            return NextResponse.json({
                error: 'Invalid file type. Only PDF files are accepted.',
                verdict: 'rejected',
            }, { status: 400 });
        }

        // Create "scan started" notification
        await createFileNotification({
            userId: session.user.id,
            type: NOTIFICATION_TYPES.SCAN_STARTED,
            fileName: String(fileName),
        });

        // Run VT scan
        const result = await scanFile(fileBuffer, String(fileName));

        let finalVerdict;

        if (result.verdict === 'pending') {
            // File uploaded to VT — poll server-side (max ~3 min)
            const MAX_POLLS = 18;
            const POLL_INTERVAL = 10_000;
            for (let i = 0; i < MAX_POLLS; i++) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL));
                try {
                    const analysis = await getAnalysis(result.analysisId);
                    if (analysis.status === 'completed') {
                        finalVerdict = interpretVerdict(analysis.stats);
                        break;
                    }
                } catch {
                    // Retry on transient errors
                }
            }

            if (!finalVerdict) {
                // Timed out waiting — treat as clean to not block the user forever
                finalVerdict = 'clean';
            }
        } else {
            finalVerdict = result.verdict; // 'clean' | 'malicious' | 'suspicious' | 'unknown'
        }

        // Normalize: suspicious → malicious, unknown → clean (benefit of the doubt)
        const normalizedVerdict = finalVerdict === 'malicious' || finalVerdict === 'suspicious'
            ? 'malicious'
            : 'clean';

        // Create result notification
        const notifType = normalizedVerdict === 'malicious'
            ? NOTIFICATION_TYPES.SCAN_MALWARE
            : NOTIFICATION_TYPES.SCAN_CLEAN;
        await createFileNotification({
            userId: session.user.id,
            type: notifType,
            fileName: String(fileName),
        });

        return NextResponse.json({
            success: true,
            data: {
                verdict: normalizedVerdict,
                hash: result.hash,
                stats: result.stats || null,
            },
        });
    } catch (err) {
        console.error('[pre-scan] Error:', err.message);

        // Try to send error notification
        try {
            const session = await auth();
            if (session?.user?.id) {
                await createFileNotification({
                    userId: session.user.id,
                    type: NOTIFICATION_TYPES.SCAN_ERROR,
                    fileName: 'document',
                });
            }
        } catch { /* ignore notification errors */ }

        return NextResponse.json({
            success: false,
            error: 'Security scan failed',
            data: { verdict: 'error' },
        }, { status: 502 });
    }
}

