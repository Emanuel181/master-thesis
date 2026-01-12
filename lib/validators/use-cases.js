/**
 * Use Cases Validation Schemas
 * =============================
 * 
 * Zod schemas for use-cases and use-case-groups API routes.
 */

import { z } from 'zod';
import { cuidSchema, textSchema } from './common.js';

/**
 * Use case name schema
 */
export const useCaseNameSchema = textSchema('Name', 200);

/**
 * Use case description schema
 */
export const useCaseDescriptionSchema = textSchema('Description', 2000, { allowNewlines: true });

/**
 * Create use case schema
 */
export const createUseCaseSchema = z.object({
    name: useCaseNameSchema,
    description: useCaseDescriptionSchema.nullable().optional(),
    groupId: cuidSchema.nullable().optional(),
});

/**
 * Update use case schema
 */
export const updateUseCaseSchema = z.object({
    name: useCaseNameSchema.optional(),
    description: useCaseDescriptionSchema.nullable().optional(),
    groupId: z.union([cuidSchema, z.null()]).optional(),
    order: z.number().int().min(0).max(100000).optional(),
}).strict();

/**
 * Move use case schema
 */
export const moveUseCaseSchema = z.object({
    groupId: z.union([cuidSchema, z.null()]),
    order: z.number().int().min(0).max(100000).optional(),
});

/**
 * Sync use case schema (for GitHub/GitLab sync)
 */
export const syncUseCaseSchema = z.object({
    provider: z.enum(['github', 'gitlab']),
    repoFullName: z.string().min(1).max(500),
    branch: z.string().min(1).max(200).optional(),
});

/**
 * Use case ID params schema
 */
export const useCaseIdParamsSchema = z.object({
    id: cuidSchema,
});

/**
 * Create use case group schema
 */
export const createGroupSchema = z.object({
    name: textSchema('Group name', 100),
    description: textSchema('Description', 500, { allowNewlines: true }).nullable().optional(),
});

/**
 * Update use case group schema
 */
export const updateGroupSchema = z.object({
    name: textSchema('Group name', 100).optional(),
    description: textSchema('Description', 500, { allowNewlines: true }).nullable().optional(),
    order: z.number().int().min(0).max(100000).optional(),
}).strict();

/**
 * Group ID params schema
 */
export const groupIdParamsSchema = z.object({
    id: cuidSchema,
});

export default {
    useCaseNameSchema,
    useCaseDescriptionSchema,
    createUseCaseSchema,
    updateUseCaseSchema,
    moveUseCaseSchema,
    syncUseCaseSchema,
    useCaseIdParamsSchema,
    createGroupSchema,
    updateGroupSchema,
    groupIdParamsSchema,
};
