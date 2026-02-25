import { createApiHandler, ApiErrors } from "@/lib/api-handler";
import { markNotificationAsRead, deleteNotification } from "@/lib/notifications";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().min(1),
});

// PATCH /api/notifications/[id] - Mark notification as read
export const PATCH = createApiHandler(
  async (request, { session, params, requestId }) => {
    try {
      const notification = await markNotificationAsRead(params.id, session.user.id);
      return { notification };
    } catch (error) {
      if (error.message === "Notification not found or unauthorized") {
        return ApiErrors.notFound("Notification", requestId);
      }
      throw error;
    }
  },
  {
    requireAuth: true,
    requireProductionMode: false,
    paramsSchema,
    rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: "notifications:read" },
  }
);

// DELETE /api/notifications/[id] - Delete a single notification
export const DELETE = createApiHandler(
  async (request, { session, params, requestId }) => {
    try {
      await deleteNotification(params.id, session.user.id);
      return { deleted: true };
    } catch (error) {
      if (error.message === "Notification not found or unauthorized") {
        return ApiErrors.notFound("Notification", requestId);
      }
      throw error;
    }
  },
  {
    requireAuth: true,
    requireProductionMode: false,
    paramsSchema,
    rateLimit: { limit: 60, windowMs: 60 * 1000, keyPrefix: "notifications:delete" },
  }
);

