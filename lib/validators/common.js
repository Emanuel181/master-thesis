/**
 * Common Validation Schemas
 * ==========================
 * 
 * Shared Zod schemas for input validation across API routes.
 * Includes text sanitization, ID validation, and pagination schemas.
 */

import { z } from 'zod';

/**
 * Normalize text to prevent XSS and clean up input
 * - Removes NUL and most control characters
 * - Optionally allows newlines for multi-line text
 * - Trims whitespace
 * 
 * @param {string} value - Input string
 * @param {Object} options - Options
 * @param {boolean} options.allowNewlines - Allow newline characters
 * @returns {string} Normalized string
 */
export function normalizeText(value, { allowNewlines = false } = {}) {
    if (typeof value !== 'string') return value;
    
    // Remove control characters (except newlines/tabs if allowed)
    const removedControls = allowNewlines
        ? value.replace(/[\0\x08\x09\x1a\x0b\x0c]/g, '')
        : value.replace(/[\0-\x1F\x7F]/g, ' ');
    
    return removedControls.trim();
}

/**
 * Create a text schema with XSS protection
 * - Normalizes text (removes control characters)
 * - Enforces maximum length
 * - Rejects angle brackets to prevent XSS
 * 
 * @param {string} label - Field label for error messages
 * @param {number} maxLength - Maximum allowed length
 * @param {Object} options - Options
 * @param {boolean} options.allowNewlines - Allow newline characters
 * @param {boolean} options.optional - Make field optional
 * @returns {z.ZodString} Zod schema
 */
export function textSchema(label, maxLength, { allowNewlines = false, optional = false } = {}) {
    let schema = z
        .string()
        .max(maxLength, `${label} must be less than ${maxLength} characters`)
        .transform((v) => normalizeText(v, { allowNewlines }))
        .refine((v) => !/[<>]/.test(v), { message: `${label} must not contain '<' or '>'` });
    
    if (optional) {
        return schema.optional().nullable();
    }
    
    return schema;
}

/**
 * CUID validation schema
 * Validates Prisma CUID format (starts with 'c', 25 chars, lowercase alphanumeric)
 */
export const cuidSchema = z
    .string()
    .regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

/**
 * Optional CUID schema (nullable)
 */
export const optionalCuidSchema = cuidSchema.nullable().optional();

/**
 * Pagination query parameters schema
 * - page: positive integer, defaults to 1
 * - limit: 1-100, defaults to 20
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Extended pagination with skip calculation
 */
export const paginationWithSkipSchema = paginationSchema.transform((data) => ({
    ...data,
    skip: (data.page - 1) * data.limit,
}));

/**
 * Search query parameter schema
 */
export const searchSchema = z.object({
    search: z.string().max(200).optional().default(''),
});

/**
 * Combined pagination and search schema
 */
export const paginatedSearchSchema = paginationSchema.merge(searchSchema);

/**
 * Email validation schema
 */
export const emailSchema = z
    .string()
    .email('Invalid email format')
    .max(254, 'Email must be less than 254 characters')
    .transform((v) => v.toLowerCase().trim());

/**
 * URL validation schema (HTTPS only)
 */
export const httpsUrlSchema = z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS')
    .max(2048, 'URL must be less than 2048 characters');

/**
 * Phone number validation schema
 */
export const phoneSchema = z
    .string()
    .max(20, 'Phone number must be less than 20 characters')
    .transform((v) => normalizeText(v))
    .refine((v) => !v || /^\+?[0-9\s\-()]+$/.test(v), { message: 'Invalid phone number format' })
    .nullable()
    .optional();

/**
 * Status filter schema for articles
 */
export const articleStatusSchema = z.enum([
    'DRAFT',
    'PENDING_REVIEW',
    'IN_REVIEW',
    'PUBLISHED',
    'REJECTED',
    'SCHEDULED_FOR_DELETION',
]).optional();

/**
 * Sort order schema
 */
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
}).refine(
    (data) => !data.startDate || !data.endDate || data.startDate <= data.endDate,
    { message: 'Start date must be before end date' }
);

export default {
    normalizeText,
    textSchema,
    cuidSchema,
    optionalCuidSchema,
    paginationSchema,
    paginationWithSkipSchema,
    searchSchema,
    paginatedSearchSchema,
    emailSchema,
    httpsUrlSchema,
    phoneSchema,
    articleStatusSchema,
    sortOrderSchema,
    dateRangeSchema,
};
