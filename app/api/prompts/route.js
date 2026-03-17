/**
 * Prompts API Routes
 * ===================
 * 
 * GET  - List all prompts grouped by agent
 * POST - Create a new prompt
 */

import prisma from '@/lib/prisma';
import { uploadTextToS3, generatePromptS3Key } from '@/lib/s3';
import { createApiHandler } from '@/lib/api-handler';
import { createPromptSchema, VALID_AGENTS } from '@/lib/validators/prompts.js';
import { getAllDefaultPrompts, getDefaultPromptMetadataUpdates, getEffectiveDefaultKeys } from '@/lib/default-prompts';

/**
 * GET /api/prompts
 * List all prompts for the authenticated user, grouped by agent
 * Also auto-seeds any missing default prompts (e.g., new pentester prompts)
 */
export const GET = createApiHandler(
    async (request, { session }) => {
        const userId = session.user.id;

        // Get all prompts for the user
        let prompts = await prisma.prompt.findMany({
            where: { userId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

        const metadataUpdates = getDefaultPromptMetadataUpdates(prompts);
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

            prompts = await prisma.prompt.findMany({
                where: { userId },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            });
        }

        // Auto-seed any missing default prompts
        // This handles new prompts added after user signup (e.g., new tester/pentester prompts)
        const existingDefaultKeys = getEffectiveDefaultKeys(prompts);
        const allDefaults = getAllDefaultPrompts();
        const missingDefaults = allDefaults.filter(d => !existingDefaultKeys.has(d.defaultKey));

        if (missingDefaults.length > 0) {
            for (const promptData of missingDefaults) {
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
                } catch (err) {
                    console.error(`Failed to auto-seed prompt "${promptData.title}":`, err);
                }
            }

            // Re-fetch after seeding
            prompts = await prisma.prompt.findMany({
                where: { userId },
                orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
            });
        }

        // Group by agent
        const grouped = {};
        VALID_AGENTS.forEach(agent => grouped[agent] = []);

        prompts.forEach(prompt => {
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

        return grouped;
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        rateLimit: {
            limit: 60,
            windowMs: 60 * 1000,
            keyPrefix: 'prompts:get',
        },
    }
);

/**
 * POST /api/prompts
 * Create a new prompt
 */
export const POST = createApiHandler(
    async (request, { session, body }) => {
        const userId = session.user.id;
        const { agent, title, text } = body;

        // Upload to S3
        const s3Key = generatePromptS3Key(userId, agent);
        await uploadTextToS3(s3Key, text);

        const prompt = await prisma.prompt.create({
            data: {
                agent,
                title: title || 'Untitled',
                text,
                userId,
                s3Key,
            },
        });

        return {
            id: prompt.id,
            title: prompt.title,
            text: prompt.text,
        };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: createPromptSchema,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'prompts:create',
        },
    }
);
