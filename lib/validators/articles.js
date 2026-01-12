/**
 * Article Validation Schemas
 * ===========================
 * 
 * Zod schemas for article-related API routes.
 */

import { z } from 'zod';
import { cuidSchema, textSchema, paginationSchema, articleStatusSchema } from './common.js';

/**
 * Article ID route parameter schema
 */
export const articleIdSchema = z.object({
    id: cuidSchema,
});

/**
 * Article list query parameters schema
 */
export const articleListQuerySchema = paginationSchema.extend({
    status: articleStatusSchema,
});

/**
 * Article creation schema
 */
export const articleCreateSchema = z.object({
    title: textSchema('Title', 200).optional().default('Untitled Article'),
    category: z.string().max(50).optional().default('General'),
    iconName: z.string().max(50).optional().default('Shield'),
    gradient: z.string().max(100).nullable().optional(),
    coverImage: z.string().url().max(2048).nullable().optional(),
    coverType: z.enum(['gradient', 'image']).optional().default('gradient'),
}).strict();

/**
 * Article update schema (PATCH)
 */
export const articleUpdateSchema = z.object({
    title: textSchema('Title', 200).optional(),
    excerpt: textSchema('Excerpt', 500, { allowNewlines: true }).optional(),
    category: z.string().max(50).optional(),
    iconName: z.string().max(50).optional(),
    iconPosition: z.enum(['left', 'center', 'right']).optional(),
    iconColor: z.string().max(50).optional(),
    gradient: z.string().max(100).nullable().optional(),
    coverImage: z.string().url().max(2048).nullable().optional(),
    coverType: z.enum(['gradient', 'image']).optional(),
    readTime: z.number().int().min(1).max(120).optional(),
}).strict();

/**
 * Article content update schema
 */
export const articleContentSchema = z.object({
    content: z.string().max(500000).optional(), // HTML content
    contentJson: z.any().optional(), // TipTap JSON
    contentMarkdown: z.string().max(500000).optional(),
}).strict();

/**
 * Article submission schema (for review)
 */
export const articleSubmitSchema = z.object({
    action: z.literal('submit'),
}).strict();

/**
 * Article status change schema (admin)
 */
export const articleStatusChangeSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'IN_REVIEW']),
    adminFeedback: textSchema('Feedback', 2000, { allowNewlines: true }).optional(),
}).strict();

export default {
    articleIdSchema,
    articleListQuerySchema,
    articleCreateSchema,
    articleUpdateSchema,
    articleContentSchema,
    articleSubmitSchema,
    articleStatusChangeSchema,
};
