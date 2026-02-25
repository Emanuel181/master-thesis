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

/**
 * GET /api/prompts
 * List all prompts for the authenticated user, grouped by agent
 */
export const GET = createApiHandler(
    async (request, { session }) => {
        const userId = session.user.id;

        // Get all prompts for the user
        const prompts = await prisma.prompt.findMany({
            where: { userId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });

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
