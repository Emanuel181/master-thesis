import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { sendArticleDeletedEmail } from "@/lib/article-emails";

/**
 * Timing-safe comparison of two secrets
 * Prevents timing attacks by ensuring constant-time comparison
 */
function safeCompare(a, b) {
  if (!a || !b) return false;

  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

// This endpoint can be called by a cron job to clean up scheduled deletions
// POST /api/cron/cleanup-articles - Delete articles past their scheduled deletion date

export async function POST(request) {
  try {
    // Verify cron secret (to prevent unauthorized calls)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = authHeader?.replace('Bearer ', '');

    // Fail-closed: CRON_SECRET must be configured
    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not configured");
      return NextResponse.json(
        { error: "Service misconfigured" },
        { status: 503 }
      );
    }

    // Always validate the provided secret
    if (!safeCompare(providedSecret, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all articles scheduled for deletion that are past their deletion date
    const articlesToDelete = await prisma.article.findMany({
      where: {
        scheduledForDeletionAt: {
          lte: now,
        },
        status: {
          in: ["REJECTED", "SCHEDULED_FOR_DELETION"],
        },
      },
      select: {
        id: true,
        title: true,
        authorId: true,
        authorEmail: true,
        adminFeedback: true,
      },
    });

    if (articlesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No articles to delete",
        deletedCount: 0,
      });
    }

    // Delete articles and notify users
    const deletedIds = [];
    const errors = [];

    for (const article of articlesToDelete) {
      try {
        // Delete the article
        await prisma.article.delete({
          where: { id: article.id },
        });

        deletedIds.push(article.id);

        // Notify the author
        try {
          await createNotification({
            userId: article.authorId,
            type: NOTIFICATION_TYPES.ARTICLE_DELETED,
            title: "Article Deleted",
            message: article.adminFeedback
              ? `Your article "${article.title}" has been automatically deleted after the scheduled period. Reason: ${article.adminFeedback}`
              : `Your article "${article.title}" has been automatically deleted after the scheduled deletion period.`,
            metadata: JSON.stringify({
              articleId: article.id,
              articleTitle: article.title,
              feedback: article.adminFeedback,
              deletedAt: now.toISOString(),
            }),
          });

          // Send deletion email
          if (article.authorEmail) {
            await sendArticleDeletedEmail({
              to: article.authorEmail,
              articleTitle: article.title,
              feedback: article.adminFeedback,
            });
          }
        } catch (notifError) {
          console.error(`Failed to notify user for article ${article.id}:`, notifError);
        }
      } catch (deleteError) {
        console.error(`Failed to delete article ${article.id}:`, deleteError);
        errors.push({ articleId: article.id, error: deleteError.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedIds.length} articles`,
      deletedCount: deletedIds.length,
      deletedIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in cleanup cron:", error);
    return NextResponse.json(
      { error: "Failed to run cleanup" },
      { status: 500 }
    );
  }
}

// GET endpoint to check status (for debugging/monitoring)
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const providedSecret = authHeader?.replace('Bearer ', '');

    // Fail-closed: CRON_SECRET must be configured
    if (!cronSecret) {
      console.error("CRON_SECRET environment variable is not configured");
      return NextResponse.json(
        { error: "Service misconfigured" },
        { status: 503 }
      );
    }

    // Always validate the provided secret
    if (!safeCompare(providedSecret, cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Count articles scheduled for deletion
    const pendingDeletion = await prisma.article.count({
      where: {
        scheduledForDeletionAt: {
          not: null,
        },
        status: {
          in: ["REJECTED", "SCHEDULED_FOR_DELETION"],
        },
      },
    });

    const pastDue = await prisma.article.count({
      where: {
        scheduledForDeletionAt: {
          lte: now,
        },
        status: {
          in: ["REJECTED", "SCHEDULED_FOR_DELETION"],
        },
      },
    });

    return NextResponse.json({
      pendingDeletion,
      pastDue,
      currentTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking cleanup status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

