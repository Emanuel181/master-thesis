/**
 * Prompt [id] API Routes
 * =======================
 * 
 * PUT    - Update a prompt
 * DELETE - Delete a prompt
 */

import prisma from '@/lib/prisma';
import { uploadTextToS3, deleteFromS3 } from '@/lib/s3';
import { createApiHandler, ApiErrors } from '@/lib/api-handler';
import { updatePromptSchema, promptIdParamsSchema } from '@/lib/validators/prompts.js';

/**
 * PUT /api/prompts/[id]
 * Update an existing prompt
 */
export const PUT = createApiHandler(
    async (request, { session, body, params, requestId }) => {
        const userId = session.user.id;
        const { id } = params;
        const { title, text } = body;

        // Get the existing prompt to find the S3 key
        const existingPrompt = await prisma.prompt.findFirst({
            where: { id, userId },
        });

        if (!existingPrompt) {
            return ApiErrors.notFound('Prompt', requestId);
        }

        // Upload new text to S3 using the existing key
        await uploadTextToS3(existingPrompt.s3Key, text);

        // Update the prompt in the database
        const prompt = await prisma.prompt.update({
            where: { id, userId },
            data: { title: title || 'Untitled', text },
        });

        return { success: true, prompt };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: updatePromptSchema,
        paramsSchema: promptIdParamsSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'prompts:update',
        },
    }
);

/**
 * DELETE /api/prompts/[id]
 * Delete a prompt
 */
export const DELETE = createApiHandler(
    async (request, { session, params, requestId }) => {
        const userId = session.user.id;
        const { id } = params;

        // Get the prompt to find the associated S3 key
        const prompt = await prisma.prompt.findFirst({
            where: { id, userId },
        });

        if (!prompt) {
            return ApiErrors.notFound('Prompt', requestId);
        }

        // Delete the text file from S3
        await deleteFromS3(prompt.s3Key);

        // Delete the prompt from the database
        await prisma.prompt.deleteMany({
            where: { id, userId },
        });

        return { success: true };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        paramsSchema: promptIdParamsSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'prompts:delete',
        },
    }
);
