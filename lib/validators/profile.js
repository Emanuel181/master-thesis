/**
 * Profile Validation Schemas
 * ===========================
 * 
 * Zod schemas for profile-related API routes.
 */

import { z } from 'zod';
import { textSchema, phoneSchema, httpsUrlSchema } from './common.js';

/**
 * Profile update schema
 * Validates all fields that can be updated on a user profile
 */
export const updateProfileSchema = z.object({
    firstName: textSchema('First name', 100).nullable().optional(),
    lastName: textSchema('Last name', 100).nullable().optional(),
    phone: phoneSchema,
    jobTitle: textSchema('Job title', 100).nullable().optional(),
    company: textSchema('Company name', 100).nullable().optional(),
    bio: textSchema('Bio', 1000, { allowNewlines: true }).nullable().optional(),
    location: textSchema('Location', 100).nullable().optional(),
    image: httpsUrlSchema.nullable().optional(),
}).strict();

/**
 * Profile fields to select from database
 */
export const profileSelectFields = {
    id: true,
    name: true,
    email: true,
    image: true,
    firstName: true,
    lastName: true,
    phone: true,
    jobTitle: true,
    company: true,
    bio: true,
    location: true,
    createdAt: true,
    updatedAt: true,
};

export default {
    updateProfileSchema,
    profileSelectFields,
};
