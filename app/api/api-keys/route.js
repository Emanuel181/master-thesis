/**
 * API Keys Management Routes
 * ==========================
 *
 * GET  /api/api-keys - List all API keys for current user
 * POST /api/api-keys - Create a new API key
 */

import { z } from "zod";
import { createApiHandler, ApiErrors } from "@/lib/api-handler";
import {
    createApiKey,
    listApiKeys,
    API_KEY_SCOPES,
} from "@/lib/api-key-auth";

const createKeySchema = z.object({
    name: z.string()
        .min(1, "Name is required")
        .max(100, "Name must be less than 100 characters"),
    scopes: z.array(z.enum(Object.values(API_KEY_SCOPES)))
        .min(1, "At least one scope is required")
        .default([API_KEY_SCOPES.READ]),
    expiresInDays: z.number()
        .int()
        .min(1)
        .max(365)
        .optional()
        .nullable(),
});

/**
 * GET /api/api-keys
 * List all API keys for the current user
 */
export const GET = createApiHandler(
    async (request, { session }) => {
        const keys = await listApiKeys(session.user.id);

        return {
            keys: keys.map(key => ({
                ...key,
                scopes: key.scopes.split(','),
            })),
        };
    },
    {
        requireAuth: true,
        rateLimit: {
            limit: 30,
            windowMs: 60 * 1000,
            keyPrefix: 'api-keys:list',
        },
    }
);

/**
 * POST /api/api-keys
 * Create a new API key
 */
export const POST = createApiHandler(
    async (request, { session, body }) => {
        const { name, scopes, expiresInDays } = body;

        // Calculate expiration date if specified
        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // Create the API key
        const result = await createApiKey(
            session.user.id,
            name,
            scopes,
            expiresAt
        );

        // Return the key - this is the only time the raw key is available!
        return {
            key: result.key,
            id: result.id,
            name: result.name,
            keyPrefix: result.keyPrefix,
            scopes: result.scopes,
            expiresAt: result.expiresAt,
            createdAt: result.createdAt,
            warning: "Save this key securely. It will not be shown again.",
        };
    },
    {
        requireAuth: true,
        bodySchema: createKeySchema,
        rateLimit: {
            limit: 10,
            windowMs: 60 * 60 * 1000, // 10 keys per hour
            keyPrefix: 'api-keys:create',
        },
    }
);
