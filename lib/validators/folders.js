/**
 * Folders Validation Schemas
 * ===========================
 * 
 * Zod schemas for folders-related API routes.
 */

import { z } from 'zod';
import { cuidSchema } from './common.js';

/**
 * Folder name validation - prevents filesystem-unsafe characters
 */
export const folderNameSchema = z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'Folder name contains invalid characters');

/**
 * Create folder schema
 */
export const createFolderSchema = z.object({
    name: folderNameSchema,
    useCaseId: cuidSchema,
    parentId: cuidSchema.nullable().optional(),
});

/**
 * Update folder schema
 */
export const updateFolderSchema = z.object({
    name: folderNameSchema.optional(),
    parentId: z.union([cuidSchema, z.null()]).optional(),
    order: z.number().int().min(0).max(100000).optional(),
}).strict();

/**
 * Reorder folders schema
 */
export const reorderFoldersSchema = z.object({
    useCaseId: cuidSchema,
    orderedIds: z.array(cuidSchema).min(1, 'At least one folder ID is required').max(500),
});

/**
 * Folder query params schema
 */
export const folderQuerySchema = z.object({
    useCaseId: cuidSchema,
});

/**
 * Folder ID params schema
 */
export const folderIdParamsSchema = z.object({
    id: cuidSchema,
});

export default {
    folderNameSchema,
    createFolderSchema,
    updateFolderSchema,
    reorderFoldersSchema,
    folderQuerySchema,
    folderIdParamsSchema,
};
