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

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
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
      message = feedback
        ? `Your article "${truncatedTitle}" needs revision: ${feedback}`
        : `Your article "${truncatedTitle}" was not approved. Please check the feedback and resubmit.`;
      break;
    case "SCHEDULED_FOR_DELETION":
      type = NOTIFICATION_TYPES.ARTICLE_SCHEDULED_FOR_DELETION;
      title = "Article Scheduled for Deletion";
      const dateStr = deletionDate ? new Date(deletionDate).toLocaleDateString() : "in 3 days";
      message = feedback
        ? `Your article "${truncatedTitle}" is scheduled for deletion on ${dateStr}. Reason: ${feedback}. You can import it to drafts to prevent deletion.`
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
      message = feedback
        ? `Your article "${truncatedTitle}" has been moved to drafts. ${feedback}`
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

  return createNotification({
    userId: authorId,
    type: NOTIFICATION_TYPES.ARTICLE_REACTION,
    title: "New Reaction",
    message: `${reactorName} ${reactionType === "like" ? "liked" : "reacted to"} your article "${truncatedTitle}"`,
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

