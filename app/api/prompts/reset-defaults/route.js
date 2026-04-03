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
import { uploadTextToS3, generatePromptS3Key } from '@/lib/s3';
import {
    getDefaultPromptsMap,
    getAllDefaultPrompts,
    getDefaultPromptMetadataUpdates,
    getEffectiveDefaultKeys,
} from '@/lib/default-prompts';
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

        let allPrompts = await prisma.prompt.findMany({
            where: { userId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const metadataUpdates = getDefaultPromptMetadataUpdates(allPrompts);
        if (metadataUpdates.length > 0) {
            await prisma.$transaction(
                metadataUpdates.map(update =>
                    prisma.prompt.update({
                        where: { id: update.id },
                        data: {
                            isDefault: update.isDefault,
                            defaultKey: update.defaultKey,
                        },
                    })
                )
            );

            allPrompts = await prisma.prompt.findMany({
                where: { userId },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            });
        }

        const userDefaultPrompts = allPrompts.filter(prompt => prompt.isDefault && prompt.defaultKey);

        let promptsReset = 0;

        // Update each default prompt back to its original content
        for (const prompt of userDefaultPrompts) {
            const originalData = defaultPromptsMap.get(prompt.defaultKey);

            if (!originalData) {
                // This default prompt no longer exists in our defaults, skip it
                continue;
            }

            // Normalize text for comparison: trim and unify line endings
            const normalizedDbText = (prompt.text || '').replace(/\r\n/g, '\n').trim();
            const normalizedOriginalText = (originalData.text || '').replace(/\r\n/g, '\n').trim();
            const normalizedDbTitle = (prompt.title || '').trim();
            const normalizedOriginalTitle = (originalData.title || '').trim();

            // Check if the prompt has been modified
            const isModified = normalizedDbTitle !== normalizedOriginalTitle || normalizedDbText !== normalizedOriginalText;

            if (!isModified) {
                continue;
            }

            try {
                if (prompt.s3Key) {
                    try {
                        await uploadTextToS3(prompt.s3Key, originalData.text);
                    } catch (s3Error) {
                        console.error(`[reset-defaults] S3 upload failed for "${prompt.defaultKey}", continuing with DB update:`, s3Error.message);
                    }
                }

                await prisma.prompt.update({
                    where: { id: prompt.id },
                    data: {
                        title: originalData.title,
                        text: originalData.text,
                        isDefault: true,
                        defaultKey: prompt.defaultKey,
                    },
                });

                promptsReset++;
            } catch (error) {
                console.error(`Failed to reset prompt "${prompt.title}" (${prompt.id}):`, error);
            }
        }

        // --- Create any missing default prompts ---
        const existingDefaultKeys = getEffectiveDefaultKeys(allPrompts);
        const allDefaults = getAllDefaultPrompts();
        let promptsCreated = 0;

        for (const promptData of allDefaults) {
            if (existingDefaultKeys.has(promptData.defaultKey)) continue;

            try {
                const s3Key = generatePromptS3Key(userId, promptData.agent);
                await uploadTextToS3(s3Key, promptData.text);

                await prisma.prompt.create({
                    data: {
                        agent: promptData.agent,
                        title: promptData.title,
                        text: promptData.text,
                        order: promptData.order,
                        isDefault: true,
                        defaultKey: promptData.defaultKey,
                        userId,
                        s3Key,
                    },
                });
                promptsCreated++;
            } catch (error) {
                console.error(`Failed to create missing default prompt "${promptData.title}":`, error);
            }
        }

        // Get all prompts for the user to return in response (grouped by agent)
        allPrompts = await prisma.prompt.findMany({
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
            message: promptsReset > 0 || promptsCreated > 0
                ? `Reset ${promptsReset} prompt(s) to original content. Created ${promptsCreated} new default prompt(s).`
                : 'All default prompts are up to date.',
            promptsReset,
            promptsCreated,
            prompts: grouped,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000, // 30 requests per hour
            keyPrefix: 'prompts:reset',
        },
    }
);
