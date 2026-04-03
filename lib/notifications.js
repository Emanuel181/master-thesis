import { prisma } from "@/lib/prisma";

/**
 * Notification types for articles and user actions
 */
export const NOTIFICATION_TYPES = {
  ARTICLE_SUBMITTED: "ARTICLE_SUBMITTED",
  ARTICLE_IN_REVIEW: "ARTICLE_IN_REVIEW",
  ARTICLE_PUBLISHED: "ARTICLE_PUBLISHED",
  ARTICLE_REJECTED: "ARTICLE_REJECTED",
  ARTICLE_SCHEDULED_FOR_DELETION: "ARTICLE_SCHEDULED_FOR_DELETION",
  ARTICLE_DELETED: "ARTICLE_DELETED",
  ARTICLE_STATUS_CHANGED: "ARTICLE_STATUS_CHANGED",
  ARTICLE_REACTION: "ARTICLE_REACTION",
  WARNING: "WARNING", // User warning from admin
  // Security scanning
  SCAN_STARTED: "SCAN_STARTED",
  SCAN_CLEAN: "SCAN_CLEAN",
  SCAN_MALWARE: "SCAN_MALWARE",
  SCAN_ERROR: "SCAN_ERROR",
  // Vectorization (RAG)
  VECTORIZATION_STARTED: "VECTORIZATION_STARTED",
  VECTORIZATION_COMPLETED: "VECTORIZATION_COMPLETED",
  VECTORIZATION_FAILED: "VECTORIZATION_FAILED",
};

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {string} options.userId - The user ID to notify
 * @param {string} options.type - Notification type from NOTIFICATION_TYPES
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.link] - Optional link to navigate to
 * @param {Object} [options.metadata] - Optional additional data
 * @returns {Promise<Object>} The created notification
 */
// Maximum notifications stored per user — oldest are deleted when exceeded
const MAX_NOTIFICATIONS_PER_USER = 10;

export async function createNotification({
  userId,
  type,
  title,
  message,
  link = null,
  metadata = null,
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Enforce per-user cap — delete oldest beyond the limit
    try {
      const count = await prisma.notification.count({ where: { userId } });
      if (count > MAX_NOTIFICATIONS_PER_USER) {
        const oldest = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip: MAX_NOTIFICATIONS_PER_USER,
          select: { id: true },
        });
        if (oldest.length > 0) {
          await prisma.notification.deleteMany({
            where: { id: { in: oldest.map((n) => n.id) } },
          });
        }
      }
    } catch {
      // Non-critical — cap enforcement failure shouldn't break creation
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Delete a single notification (only if it belongs to the user)
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<Object>} The deleted notification
 */
export async function deleteNotification(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error("Notification not found or unauthorized");
  }

  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Delete all notifications for a user
 * @param {string} userId
 * @returns {Promise<{count: number}>}
 */
export async function deleteAllNotifications(userId) {
  return prisma.notification.deleteMany({
    where: { userId },
  });
}

/**
 * Create a notification when an article status changes
 * @param {Object} options - Options
 * @param {string} options.articleId - The article ID
 * @param {string} options.articleTitle - The article title
 * @param {string} options.authorId - The author's user ID
 * @param {string} options.newStatus - The new status (IN_REVIEW, PUBLISHED, REJECTED, SCHEDULED_FOR_DELETION)
 * @param {string} [options.feedback] - Optional feedback from admin
 * @param {Date} [options.deletionDate] - Optional deletion date for scheduled deletion
 * @returns {Promise<Object>} The created notification
 */
export async function createArticleStatusNotification({
  articleId,
  articleTitle,
  authorId,
  newStatus,
  feedback = null,
  deletionDate = null,
}) {
  const truncatedTitle =
    articleTitle.length > 50
      ? articleTitle.substring(0, 47) + "..."
      : articleTitle;

  const truncatedFeedback = feedback
    ? (feedback.length > 500 ? feedback.substring(0, 497) + "..." : feedback)
    : null;

  let type, title, message;

  switch (newStatus) {
    case "IN_REVIEW":
      type = NOTIFICATION_TYPES.ARTICLE_IN_REVIEW;
      title = "Article Under Review";
      message = `Your article "${truncatedTitle}" is now being reviewed by our team.`;
      break;
    case "PUBLISHED":
      type = NOTIFICATION_TYPES.ARTICLE_PUBLISHED;
      title = "Article Published! 🎉";
      message = `Congratulations! Your article "${truncatedTitle}" has been approved and published.`;
      break;
    case "REJECTED":
      type = NOTIFICATION_TYPES.ARTICLE_REJECTED;
      title = "Article Needs Revision";
      message = truncatedFeedback
        ? `Your article "${truncatedTitle}" needs revision: ${truncatedFeedback}`
        : `Your article "${truncatedTitle}" was not approved. Please check the feedback and resubmit.`;
      break;
    case "SCHEDULED_FOR_DELETION":
      type = NOTIFICATION_TYPES.ARTICLE_SCHEDULED_FOR_DELETION;
      title = "Article Scheduled for Deletion";
      const dateStr = deletionDate ? new Date(deletionDate).toLocaleDateString() : "in 3 days";
      message = truncatedFeedback
        ? `Your article "${truncatedTitle}" is scheduled for deletion on ${dateStr}. Reason: ${truncatedFeedback}. You can import it to drafts to prevent deletion.`
        : `Your article "${truncatedTitle}" is scheduled for deletion on ${dateStr}. You can import it to drafts to prevent deletion.`;
      break;
    case "PENDING_REVIEW":
      type = NOTIFICATION_TYPES.ARTICLE_STATUS_CHANGED;
      title = "Article Status Changed";
      message = `Your article "${truncatedTitle}" status has been changed to Pending Review.`;
      break;
    case "DRAFT":
      type = NOTIFICATION_TYPES.ARTICLE_STATUS_CHANGED;
      title = "Article Moved to Drafts";
      message = truncatedFeedback
        ? `Your article "${truncatedTitle}" has been moved to drafts. ${truncatedFeedback}`
        : `Your article "${truncatedTitle}" has been moved to drafts.`;
      break;
    default:
      return null;
  }

  return createNotification({
    userId: authorId,
    type,
    title,
    message,
    link: `/dashboard?active=Write article`,
    metadata: { articleId, articleTitle, feedback, deletionDate: deletionDate?.toISOString() },
  });
}

/**
 * Create a notification when someone reacts to an article
 * @param {Object} options - Options
 * @param {string} options.articleId - The article ID
 * @param {string} options.articleTitle - The article title
 * @param {string} options.authorId - The author's user ID
 * @param {string} options.reactorName - Name of the person who reacted
 * @param {string} options.reactionType - Type of reaction
 * @returns {Promise<Object>} The created notification
 */
export async function createReactionNotification({
  articleId,
  articleTitle,
  authorId,
  reactorName,
  reactionType = "like",
}) {
  const truncatedTitle =
    articleTitle.length > 40
      ? articleTitle.substring(0, 37) + "..."
      : articleTitle;

  const safeName = reactorName
    ? (reactorName.length > 50 ? reactorName.substring(0, 47) + "..." : reactorName)
    : "Someone";

  return createNotification({
    userId: authorId,
    type: NOTIFICATION_TYPES.ARTICLE_REACTION,
    title: "New Reaction",
    message: `${safeName} ${reactionType === "like" ? "liked" : "reacted to"} your article "${truncatedTitle}"`,
    link: `/blog/${articleId}`,
    metadata: { articleId, reactorName, reactionType },
  });
}

/**
 * Get notifications for a user with pagination
 * @param {string} userId - The user ID
 * @param {Object} [options] - Options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=5] - Items per page
 * @param {boolean} [options.unreadOnly=true] - Only fetch unread notifications (default true)
 * @returns {Promise<{notifications: Array, total: number, unreadCount: number}>}
 */
export async function getUserNotifications(
  userId,
  { page = 1, limit = 5, unreadOnly = true } = {}
) {
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly && { read: false }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID
 * @param {string} userId - The user ID (for verification)
 * @returns {Promise<Object>} The updated notification
 */
export async function markNotificationAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new Error("Notification not found or unauthorized");
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() },
  });
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {Promise<{count: number}>}
 */
export async function markAllNotificationsAsRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true, readAt: new Date() },
  });
}

/**
 * Create a notification for file processing events (scan / vectorization).
 * Silently catches errors to avoid breaking background pipelines.
 *
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.type - One of the NOTIFICATION_TYPES scan/vectorization constants
 * @param {string} opts.fileName - Original file name
 * @param {string} [opts.pdfId] - PDF ID for linking
 */
export async function createFileNotification({ userId, type, fileName, pdfId = null }) {
  const messages = {
    [NOTIFICATION_TYPES.SCAN_STARTED]: {
      title: "Security scan started",
      message: `🔍 Scanning "${fileName}" for threats…`,
    },
    [NOTIFICATION_TYPES.SCAN_CLEAN]: {
      title: "Security scan passed",
      message: `🛡️ "${fileName}" passed security scan — no threats found.`,
    },
    [NOTIFICATION_TYPES.SCAN_MALWARE]: {
      title: "Malware detected",
      message: `🛑 Malware detected in "${fileName}" — file quarantined.`,
    },
    [NOTIFICATION_TYPES.SCAN_ERROR]: {
      title: "Security scan failed",
      message: `⚠️ Security scan could not complete for "${fileName}".`,
    },
    [NOTIFICATION_TYPES.VECTORIZATION_STARTED]: {
      title: "Vectorization started",
      message: `📊 Vectorizing "${fileName}" for RAG…`,
    },
    [NOTIFICATION_TYPES.VECTORIZATION_COMPLETED]: {
      title: "Vectorization complete",
      message: `📊 "${fileName}" is now vectorized and ready for RAG.`,
    },
    [NOTIFICATION_TYPES.VECTORIZATION_FAILED]: {
      title: "Vectorization failed",
      message: `❌ Vectorization failed for "${fileName}". Re-upload recommended.`,
    },
  };

  const entry = messages[type];
  if (!entry) return null;

  try {
    return await createNotification({
      userId,
      type,
      title: entry.title,
      message: entry.message,
      link: "/dashboard?tab=knowledge",
      metadata: pdfId ? { pdfId } : null,
    });
  } catch (err) {
    console.error(`[notifications] Failed to create ${type} notification for ${fileName}:`, err.message);
    return null;
  }
}
