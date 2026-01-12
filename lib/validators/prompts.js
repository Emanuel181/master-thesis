/**
 * Prompts Validation Schemas
 * ===========================
 * 
 * Zod schemas for prompts-related API routes.
 */

import { z } from 'zod';
import { cuidSchema, textSchema } from './common.js';

/**
 * Valid agent types for prompts
 */
export const VALID_AGENTS = ['reviewer', 'implementation', 'tester', 'report'];

/**
 * Agent enum schema
 */
export const agentSchema = z.enum(VALID_AGENTS);

/**
 * Prompt text schema with size limits
 */
export const promptTextSchema = z
    .string()
    .min(1, 'Text is required')
    .max(50000, 'Text must be less than 50000 characters');

/**
 * Create prompt schema
 */
export const createPromptSchema = z.object({
    agent: agentSchema,
    title: z.string().max(200, 'Title must be less than 200 characters').optional(),
    text: promptTextSchema,
});

/**
 * Update prompt schema
 */
export const updatePromptSchema = z.object({
    title: z.string().max(200, 'Title must be less than 200 characters').optional(),
    text: promptTextSchema,
});

/**
 * Reorder prompts schema
 */
export const reorderPromptsSchema = z.object({
    agent: agentSchema,
    orderedIds: z.array(cuidSchema).min(1, 'At least one prompt ID is required').max(500),
});

/**
 * Bulk delete prompts schema
 */
export const bulkDeletePromptsSchema = z.object({
    ids: z.array(cuidSchema).min(1, 'At least one prompt ID is required').max(500),
});

/**
 * Prompt ID params schema
 */
export const promptIdParamsSchema = z.object({
    id: cuidSchema,
});

export default {
    VALID_AGENTS,
    agentSchema,
    promptTextSchema,
    createPromptSchema,
    updatePromptSchema,
    reorderPromptsSchema,
    bulkDeletePromptsSchema,
    promptIdParamsSchema,
};
