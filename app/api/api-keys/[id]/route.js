/**
 * API Key Management Routes (Individual Key)
 * ==========================================
 *
 * DELETE /api/api-keys/[id] - Revoke an API key
 */

import { z } from "zod";
import { createApiHandler, ApiErrors } from "@/lib/api-handler";
import { revokeApiKey } from "@/lib/api-key-auth";
import { cuidSchema } from "@/lib/validators/common";

const paramsSchema = z.object({
    id: cuidSchema,
});

/**
 * DELETE /api/api-keys/[id]
 * Revoke an API key
 */
export const DELETE = createApiHandler(
    async (request, { session, params }) => {
        const { id } = params;

        const revoked = await revokeApiKey(id, session.user.id);

        if (!revoked) {
            return ApiErrors.notFound('API key');
        }

        return {
            success: true,
            message: "API key revoked successfully",
        };
    },
    {
        requireAuth: true,
        paramsSchema,
        rateLimit: {
            limit: 20,
            windowMs: 60 * 1000,
            keyPrefix: 'api-keys:revoke',
        },
    }
);
