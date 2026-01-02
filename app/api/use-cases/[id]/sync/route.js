import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";
import { getS3Config } from "@/lib/s3-env";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * POST - Sync documents from S3 for a use case
 * This scans the S3 prefix for the use case and ensures all files are in the database
 */
export async function POST(request, { params }) {
    const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const headers = { ...securityHeaders, 'x-request-id': requestId };

    // SECURITY: Block demo mode from accessing production sync API
    const demoBlock = requireProductionMode(request, { requestId });
    if (demoBlock) return demoBlock;

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", requestId },
                { status: 401, headers }
            );
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden', requestId },
                { status: 403, headers }
            );
        }

        // Rate limiting - 10 syncs per hour
        const rl = await rateLimit({
            key: `use-cases:sync:${session.user.id}`,
            limit: 10,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers }
            );
        }

        const { id } = await params;

        // Verify the use case belongs to the user
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: {
                pdfs: {
                    select: {
                        id: true,
                        s3Key: true,
                    }
                }
            }
        });

        if (!useCase) {
            return NextResponse.json(
                { error: "Use case not found", requestId },
                { status: 404, headers }
            );
        }

        // Get S3 configuration for production
        const { client, bucket, prefix } = getS3Config('prod');

        // Build the S3 prefix for this use case
        const useCasePrefix = `${prefix}${session.user.id}/use-cases/${id}/`;

        // List all objects in the use case's S3 prefix
        const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: useCasePrefix,
        });

        const listResponse = await client.send(listCommand);
        const s3Objects = listResponse.Contents || [];

        // Filter for PDF files only
        const pdfObjects = s3Objects.filter(obj =>
            obj.Key && obj.Key.toLowerCase().endsWith('.pdf')
        );

        // Get existing S3 keys from database
        const existingS3Keys = new Set(useCase.pdfs.map(pdf => pdf.s3Key));

        // Find new files that aren't in the database
        const newFiles = pdfObjects.filter(obj => !existingS3Keys.has(obj.Key));

        // Add new files to the database
        let addedCount = 0;
        for (const file of newFiles) {
            if (!file.Key) continue;

            // Extract filename from S3 key
            const fileName = file.Key.split('/').pop() || 'Unknown.pdf';

            try {
                await prisma.pdf.create({
                    data: {
                        title: fileName,
                        s3Key: file.Key,
                        size: file.Size || 0,
                        url: `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${file.Key}`,
                        userId: session.user.id,
                        useCaseId: id,
                    }
                });
                addedCount++;
            } catch (createError) {
                // Skip duplicates or other errors, continue with next file
                console.warn(`[sync] Failed to add file ${file.Key}:`, createError.message);
            }
        }

        // Get updated count
        const totalCount = await prisma.pdf.count({
            where: { useCaseId: id }
        });

        return NextResponse.json({
            success: true,
            documentsFound: totalCount,
            newDocumentsAdded: addedCount,
            s3ObjectsScanned: pdfObjects.length,
            requestId,
        }, { headers });

    } catch (error) {
        console.error("Error syncing use case:", error);
        return NextResponse.json(
            { error: "Failed to sync documents", requestId },
            { status: 500, headers }
        );
    }
}

