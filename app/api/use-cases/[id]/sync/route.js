/**
 * Use Case Sync API Route
 * ========================
 * 
 * POST - Sync documents from S3 for a use case
 */

import prisma from '@/lib/prisma';
import { z } from 'zod';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { cuidSchema } from '@/lib/validators/common.js';
import { getS3Config } from '@/lib/s3-env';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

/**
 * Use case ID params schema
 */
const useCaseIdParamsSchema = z.object({
    id: cuidSchema,
});

/**
 * POST /api/use-cases/[id]/sync
 * Sync documents from S3 for a use case
 */
export const POST = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

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
                    },
                },
            },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
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
                    },
                });
                addedCount++;
            } catch (createError) {
                console.warn(`[sync] Failed to add file ${file.Key}:`, createError.message);
            }
        }

        // Get updated count
        const totalCount = await prisma.pdf.count({
            where: { useCaseId: id },
        });

        return {
            success: true,
            documentsFound: totalCount,
            newDocumentsAdded: addedCount,
            s3ObjectsScanned: pdfObjects.length,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: useCaseIdParamsSchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-cases:sync',
        },
    }
);
