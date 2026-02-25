/**
 * Reset to Default Prompts API Route
 * ====================================
 *
 * POST - Resets edited default prompts back to their original text
 *
 * This endpoint allows users to restore any edited default prompts
 * back to their original content. User-created custom prompts are NOT affected.
 */

import prisma from '@/lib/prisma';
import { uploadTextToS3 } from '@/lib/s3';
import { getDefaultPromptsMap } from '@/lib/default-prompts';
import { createApiHandler } from '@/lib/api-handler';

/**
 * POST /api/prompts/reset-defaults
 * Reset edited default prompts back to original text for the authenticated user
 */
export const POST = createApiHandler(
    async (request, { session }) => {
        const userId = session.user.id;

        // Get the map of default prompts by defaultKey
        const defaultPromptsMap = getDefaultPromptsMap();

        // Get all default prompts for the user (only those with isDefault=true and a defaultKey)
        const userDefaultPrompts = await prisma.prompt.findMany({
            where: {
                userId,
                isDefault: true,
                defaultKey: { not: null },
            },
        });

        let promptsReset = 0;
        const resetPrompts = [];

        // Update each default prompt back to its original content
        for (const prompt of userDefaultPrompts) {
            const originalData = defaultPromptsMap.get(prompt.defaultKey);

            if (!originalData) {
                // This default prompt no longer exists in our defaults, skip it
                continue;
            }

            // Check if the prompt has been modified
            const isModified = prompt.title !== originalData.title || prompt.text !== originalData.text;

            if (!isModified) {
                // Prompt hasn't been changed, skip it
                continue;
            }

            try {
                // Update S3 with original text
                if (prompt.s3Key) {
                    await uploadTextToS3(prompt.s3Key, originalData.text);
                }

                // Update database with original title and text
                const updatedPrompt = await prisma.prompt.update({
                    where: { id: prompt.id },
                    data: {
                        title: originalData.title,
                        text: originalData.text,
                    },
                });

                resetPrompts.push({
                    id: updatedPrompt.id,
                    agent: updatedPrompt.agent,
                    title: updatedPrompt.title,
                    text: updatedPrompt.text,
                    order: updatedPrompt.order,
                    isDefault: updatedPrompt.isDefault,
                    defaultKey: updatedPrompt.defaultKey,
                });

                promptsReset++;
            } catch (error) {
                console.error(`Failed to reset prompt "${prompt.title}" (${prompt.id}):`, error);
            }
        }

        // Get all prompts for the user to return in response (grouped by agent)
        const allPrompts = await prisma.prompt.findMany({
            where: { userId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const grouped = {
            reviewer: [],
            implementation: [],
            tester: [],
            report: [],
        };

        allPrompts.forEach(prompt => {
            if (grouped[prompt.agent]) {
                grouped[prompt.agent].push({
                    id: prompt.id,
                    title: prompt.title,
                    text: prompt.text,
                    order: prompt.order ?? 0,
                    isDefault: prompt.isDefault ?? false,
                    defaultKey: prompt.defaultKey ?? null,
                });
            }
        });

        return {
            success: true,
            message: promptsReset > 0
                ? `Reset ${promptsReset} default prompt(s) to original content.`
                : 'No default prompts needed to be reset.',
            promptsReset,
            prompts: grouped,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000, // 10 requests per hour
            keyPrefix: 'prompts:reset',
        },
    }
);
