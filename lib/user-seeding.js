/**
 * User Seeding Utilities
 * =======================
 *
 * Functions for initializing data for new users, including default prompts.
 */

import prisma from '@/lib/prisma';
import { uploadTextToS3, generatePromptS3Key } from '@/lib/s3';
import { getAllDefaultPrompts } from '@/lib/default-prompts';

/**
 * Seed default prompts for a newly created user
 *
 * This function creates the default prompts for each agent type
 * when a user account is first created. The prompts are stored
 * in both the database and S3.
 *
 * @param {string} userId - The ID of the user to seed prompts for
 * @returns {Promise<{success: boolean, promptsCreated: number, error?: string}>}
 */
export async function seedDefaultPromptsForUser(userId) {
    if (!userId) {
        return { success: false, promptsCreated: 0, error: 'User ID is required' };
    }

    try {
        // Check if user already has prompts (don't seed if they do)
        const existingPrompts = await prisma.prompt.findFirst({
            where: { userId },
        });

        if (existingPrompts) {
            // User already has prompts, skip seeding
            return { success: true, promptsCreated: 0, skipped: true };
        }

        const defaultPrompts = getAllDefaultPrompts();
        let promptsCreated = 0;

        // Create prompts sequentially to ensure proper ordering
        for (const promptData of defaultPrompts) {
            try {
                // Generate S3 key for this prompt
                const s3Key = generatePromptS3Key(userId, promptData.agent);

                // Upload prompt text to S3
                await uploadTextToS3(s3Key, promptData.text);

                // Create prompt record in database
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
                console.error(`Failed to create default prompt "${promptData.title}":`, error);
            }
        }

        console.log(`Seeded ${promptsCreated} default prompts for user ${userId}`);

        return {
            success: true,
            promptsCreated,
            totalAttempted: defaultPrompts.length,
        };
    } catch (error) {
        console.error('Error seeding default prompts for user:', error);
        return {
            success: false,
            promptsCreated: 0,
            error: error.message,
        };
    }
}

/**
 * Check if a user has any prompts
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>}
 */
export async function userHasPrompts(userId) {
    if (!userId) return false;

    const count = await prisma.prompt.count({
        where: { userId },
    });

    return count > 0;
}
