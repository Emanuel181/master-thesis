/**
 * Profile Image Upload API
 * =========================
 * 
 * POST - Generate presigned URL for profile image upload
 */

import { z } from 'zod';
import { getPresignedUploadUrl, generateProfileImageS3Key } from '@/lib/s3-env';
import { createApiHandler, errorResponse } from '@/lib/api-handler';
import { validateS3Key } from '@/lib/api-security';
import { isDemoRequest } from '@/lib/demo-mode';

// Security constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILENAME_LENGTH = 255;

/**
 * Image upload schema
 */
const imageUploadSchema = z.object({
    contentType: z.enum(ALLOWED_IMAGE_TYPES, {
        errorMap: () => ({ message: 'Invalid content type. Only JPEG, PNG, GIF, and WebP images are allowed' }),
    }),
    fileName: z.string().max(MAX_FILENAME_LENGTH).optional(),
    fileSize: z.number()
        .positive('File size must be positive')
        .max(MAX_IMAGE_SIZE_BYTES, `Image size must be less than ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB`)
        .optional(),
});

/**
 * Sanitize filename for S3 key
 */
function sanitizeFileName(fileName) {
    if (typeof fileName !== 'string') return 'image';
    const trimmed = fileName.trim().slice(0, MAX_FILENAME_LENGTH);
    return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_') || 'image';
}

/**
 * Get file extension from content type
 */
function pickExtension(contentType) {
    switch (contentType) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/gif':
            return 'gif';
        case 'image/webp':
            return 'webp';
        default:
            return 'bin';
    }
}

/**
 * POST /api/profile/image-upload
 * Generate presigned URL for profile image upload
 */
export const POST = createApiHandler(
    async (request, { session, body, requestId }) => {
        const { contentType, fileName } = body;

        // Server-minted, user-scoped key
        const safeName = sanitizeFileName(fileName);
        const ext = pickExtension(contentType);

        // Environment-aware S3 key generation
        const env = isDemoRequest(request) ? 'demo' : 'prod';
        const s3Key = generateProfileImageS3Key(env, session.user.id, safeName, ext);

        const expectedPrefix = env === 'demo' ? `demo/users/${session.user.id}/` : `users/${session.user.id}/`;
        const s3KeyValidation = validateS3Key(s3Key, { requiredPrefix: expectedPrefix, maxLen: 500 });
        if (!s3KeyValidation.ok) {
            return errorResponse(s3KeyValidation.error, {
                status: s3KeyValidation.error === 'Access denied' ? 403 : 400,
                code: s3KeyValidation.error === 'Access denied' ? 'FORBIDDEN' : 'VALIDATION_ERROR',
                requestId,
            });
        }

        const uploadUrl = await getPresignedUploadUrl(env, s3Key, contentType, 3600);

        return { uploadUrl, s3Key };
    },
    {
        requireAuth: true,
        requireProductionMode: true,
        bodySchema: imageUploadSchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000,
            keyPrefix: 'profile:image-upload',
        },
    }
);
