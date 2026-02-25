/**
 * PDF Virus Scan API Route
 * =========================
 *
 * POST /api/pdfs/virus-scan
 *   Triggers a VirusTotal scan for a PDF that has been uploaded to S3.
 *   Called automatically after upload confirmation.
 *
 * GET /api/pdfs/virus-scan?pdfId=xxx
 *   Polls the scan status for a given PDF (checks VT analysis if still pending).
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors, errorResponse } from '@/lib/api-handler';
import { isDemoRequest } from '@/lib/demo-mode';
import { getS3ObjectStream } from '@/lib/s3-env';
import { cuidSchema } from '@/lib/validators/common.js';
import {
    scanFile,
    streamToBuffer,
    getAnalysis,
    interpretVerdict,
} from '@/lib/virustotal';
import { createFileNotification, NOTIFICATION_TYPES } from '@/lib/notifications';

// ── Schemas ──────────────────────────────────────────────────────────────────

const scanRequestSchema = z.object({
    pdfId: cuidSchema,
}).strict();

// ── POST — Trigger scan ──────────────────────────────────────────────────────

export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        // Check if VT API key is configured
        if (!process.env.VIRUSTOTAL_API_KEY) {
            // Gracefully skip scanning if VT is not configured
            await prisma.pdf.update({
                where: { id: body.pdfId },
                data: { virusScanStatus: 'skipped' },
            });
            return { status: 'skipped', reason: 'VirusTotal API key not configured' };
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return ApiErrors.unauthorized(requestId);

        // Fetch the PDF and verify ownership
        const pdf = await prisma.pdf.findFirst({
            where: {
                id: body.pdfId,
                useCase: { userId: user.id },
            },
        });

        if (!pdf) return ApiErrors.notFound('PDF', requestId);

        // Don't re-scan if already scanned or in progress
        if (['clean', 'malicious', 'scanning'].includes(pdf.virusScanStatus)) {
            return { status: pdf.virusScanStatus, message: 'Scan already in progress or completed' };
        }

        // Mark as scanning
        await prisma.pdf.update({
            where: { id: pdf.id },
            data: { virusScanStatus: 'scanning' },
        });

        try {
            // Download file from S3
            const env = isDemoRequest(request) ? 'demo' : 'prod';
            const stream = await getS3ObjectStream(env, pdf.s3Key);
            const fileBuffer = await streamToBuffer(stream, 12 * 1024 * 1024); // 12 MB limit

            // Run VT scan (hash check → upload if new)
            const result = await scanFile(fileBuffer, pdf.title);

            if (result.verdict === 'pending') {
                // File was uploaded to VT, waiting for analysis
                await prisma.pdf.update({
                    where: { id: pdf.id },
                    data: {
                        virusScanStatus: 'scanning',
                        virusScanId: result.analysisId,
                    },
                });
                return {
                    status: 'scanning',
                    analysisId: result.analysisId,
                    hash: result.hash,
                };
            }

            // Immediate verdict (file was already known to VT)
            const finalStatus = result.verdict === 'malicious' ? 'malicious' : 'clean';
            await prisma.pdf.update({
                where: { id: pdf.id },
                data: {
                    virusScanStatus: finalStatus,
                    virusScannedAt: new Date(),
                },
            });

            return {
                status: finalStatus,
                hash: result.hash,
                stats: result.stats,
            };
        } catch (err) {
            console.error(`[virus-scan] Error scanning PDF ${pdf.id}:`, err.message);
            await prisma.pdf.update({
                where: { id: pdf.id },
                data: { virusScanStatus: 'error' },
            });
            return errorResponse('Virus scan failed', {
                status: 502,
                code: 'VIRUS_SCAN_FAILED',
                requestId,
                details: err.message,
            });
        }
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: scanRequestSchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 1000, // 10 scans per minute (VT free tier: 4 uploads/min)
            keyPrefix: 'pdfs:virus-scan',
        },
    }
);

// ── GET — Poll scan status ───────────────────────────────────────────────────

export const GET = createApiHandler(
    async (request, { session, query, requestId }) => {
        const pdfId = query?.pdfId;
        if (!pdfId) {
            return errorResponse('pdfId query parameter is required', {
                status: 400,
                code: 'VALIDATION_ERROR',
                requestId,
            });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id } });
        if (!user) return ApiErrors.unauthorized(requestId);

        const pdf = await prisma.pdf.findFirst({
            where: {
                id: pdfId,
                useCase: { userId: user.id },
            },
            select: {
                id: true,
                title: true,
                virusScanStatus: true,
                virusScannedAt: true,
                virusScanId: true,
            },
        });

        if (!pdf) return ApiErrors.notFound('PDF', requestId);

        // If still scanning and we have an analysis ID, poll VT
        if (pdf.virusScanStatus === 'scanning' && pdf.virusScanId) {
            if (!process.env.VIRUSTOTAL_API_KEY) {
                return { status: 'skipped' };
            }

            try {
                const analysis = await getAnalysis(pdf.virusScanId);

                if (analysis.status === 'completed') {
                    const verdict = interpretVerdict(analysis.stats);
                    const finalStatus = verdict === 'malicious' ? 'malicious' : 'clean';

                    await prisma.pdf.update({
                        where: { id: pdf.id },
                        data: {
                            virusScanStatus: finalStatus,
                            virusScannedAt: new Date(),
                        },
                    });

                    // Create notification for the resolved scan
                    const notifType = finalStatus === 'malicious'
                        ? NOTIFICATION_TYPES.SCAN_MALWARE
                        : NOTIFICATION_TYPES.SCAN_CLEAN;
                    await createFileNotification({
                        userId: user.id,
                        type: notifType,
                        fileName: pdf.title || 'Document',
                        pdfId: pdf.id,
                    });

                    return {
                        status: finalStatus,
                        stats: analysis.stats,
                    };
                }

                // Still queued
                return { status: 'scanning' };
            } catch (err) {
                console.error(`[virus-scan] Poll error for PDF ${pdf.id}:`, err.message);
                return { status: 'scanning', error: 'Failed to poll status' };
            }
        }

        return {
            status: pdf.virusScanStatus,
            scannedAt: pdf.virusScannedAt,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 1000,
            keyPrefix: 'pdfs:virus-scan:poll',
        },
    }
);

