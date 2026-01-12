/**
 * PDFs Validation Schemas
 * ========================
 * 
 * Zod schemas for PDF-related API routes.
 */

import { z } from 'zod';
import { cuidSchema, textSchema } from './common.js';

/**
 * PDF filename validation
 */
export const pdfFilenameSchema = z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters')
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, 'Filename contains invalid characters');

/**
 * Upload PDF schema (initiate upload)
 */
export const uploadPdfSchema = z.object({
    filename: pdfFilenameSchema,
    contentType: z.literal('application/pdf'),
    useCaseId: cuidSchema,
    folderId: cuidSchema.nullable().optional(),
});

/**
 * Confirm PDF upload schema
 */
export const confirmPdfSchema = z.object({
    pdfId: cuidSchema,
    s3Key: z.string().min(1, 'S3 key is required').max(1024, 'S3 key too long'),
});

/**
 * Update PDF schema
 */
export const updatePdfSchema = z.object({
    name: textSchema('Name', 255).optional(),
    folderId: z.union([cuidSchema, z.null()]).optional(),
    order: z.number().int().min(0).max(100000).optional(),
}).strict();

/**
 * PDF query params schema
 */
export const pdfQuerySchema = z.object({
    useCaseId: cuidSchema,
    folderId: cuidSchema.nullable().optional(),
});

/**
 * PDF ID params schema
 */
export const pdfIdParamsSchema = z.object({
    id: cuidSchema,
});

export default {
    pdfFilenameSchema,
    uploadPdfSchema,
    confirmPdfSchema,
    updatePdfSchema,
    pdfQuerySchema,
    pdfIdParamsSchema,
};
