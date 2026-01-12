/**
 * Use Case [id] API Routes
 * =========================
 * 
 * GET    - Fetch a single use case
 * PUT    - Update a use case
 * DELETE - Delete a use case and its associated PDFs
 */

import prisma from '@/lib/prisma';
import { deleteFromS3 } from '@/lib/s3';
import { z } from 'zod';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { textSchema, cuidSchema } from '@/lib/validators/common.js';

/**
 * Use case ID params schema
 */
const useCaseIdParamsSchema = z.object({
    id: cuidSchema,
});

/**
 * Update use case schema
 */
const updateUseCaseSchema = z.object({
    title: textSchema('Title', 200).optional(),
    content: z.string()
        .max(10000, 'Content must be less than 10000 characters')
        .optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(50).optional(),
    groupId: z.string().max(50).nullable().optional(),
});

/**
 * GET /api/use-cases/[id]
 * Fetch a single use case
 */
export const GET = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id,
                userId: user.id,
            },
            include: {
                pdfs: true,
            },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        return { useCase };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: useCaseIdParamsSchema,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'use-cases:get',
        },
    }
);

/**
 * PUT /api/use-cases/[id]
 * Update a use case
 */
export const PUT = createApiHandler(
    async (request, { session, body, params, requestId }) => {
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        // Check if the use case belongs to the user
        const existingUseCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id,
                userId: user.id,
            },
        });

        if (!existingUseCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        const { title, content, icon, color, groupId } = body;

        const updatedUseCase = await prisma.knowledgeBaseCategory.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(icon && { icon }),
                ...(color && { color }),
                ...(groupId !== undefined && { groupId: groupId || null }),
            },
        });

        return { useCase: updatedUseCase };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: updateUseCaseSchema,
        paramsSchema: useCaseIdParamsSchema,
        rateLimit: {
            limit: 20,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-cases:update',
        },
    }
);

/**
 * DELETE /api/use-cases/[id]
 * Delete a use case and its associated PDFs from S3
 */
export const DELETE = createApiHandler(
    async (request, { session, params, requestId }) => {
        const { id } = params;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return ApiErrors.notFound('User', requestId);
        }

        // Check if the use case belongs to the user and get associated PDFs
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id,
                userId: user.id,
            },
            include: {
                pdfs: true,
            },
        });

        if (!useCase) {
            return ApiErrors.notFound('Use case', requestId);
        }

        // Delete all PDFs from S3
        for (const pdf of useCase.pdfs) {
            try {
                await deleteFromS3(pdf.s3Key);
            } catch (s3Error) {
                console.error(`Failed to delete PDF from S3: ${pdf.s3Key}`, s3Error);
                // Continue with deletion even if S3 delete fails
            }
        }

        // Delete the use case (PDFs will be cascade deleted)
        await prisma.knowledgeBaseCategory.delete({
            where: { id },
        });

        return { message: 'Use case deleted successfully' };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: useCaseIdParamsSchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'use-cases:delete',
        },
    }
);
