import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createArticleStatusNotification } from "@/lib/notifications";
import {
  sendArticleRejectedEmail,
  sendArticleScheduledForDeletionEmail,
  sendArticleStatusChangedEmail
} from "@/lib/article-emails";

// List of allowed admin emails - supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// POST /api/admin/articles/[id]/status - Change article status
export async function POST(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, feedback } = body;

    // Validate status
    const validStatuses = ["PENDING_REVIEW", "IN_REVIEW", "PUBLISHED", "REJECTED", "SCHEDULED_FOR_DELETION", "DRAFT"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Get the article with author email
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authorId: true,
        authorEmail: true,
        status: true,
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Build update data
    const updateData = {
      status,
      adminFeedback: feedback || null,
      reviewedAt: new Date(),
    };

    // Set publishedAt when publishing
    if (status === "PUBLISHED" && existingArticle.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
      // Clear any scheduled deletion
      updateData.scheduledForDeletionAt = null;
      updateData.rejectedAt = null;
    }

    // Set rejectedAt and schedule deletion when rejecting
    if (status === "REJECTED") {
      updateData.rejectedAt = new Date();
      // Schedule for deletion in 3 days
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 3);
      updateData.scheduledForDeletionAt = deletionDate;
    }

    // Set scheduled deletion date
    if (status === "SCHEDULED_FOR_DELETION") {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 3);
      updateData.scheduledForDeletionAt = deletionDate;
    }

    // Clear deletion schedule if moving back to other statuses
    if (["PENDING_REVIEW", "IN_REVIEW", "DRAFT"].includes(status)) {
      updateData.scheduledForDeletionAt = null;
      updateData.rejectedAt = null;
    }

    // Update article
    const article = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    // Create notification and send email for the author
    try {
      // Handle different statuses
      if (status === "REJECTED") {
        await createArticleStatusNotification({
          articleId: id,
          articleTitle: existingArticle.title,
          authorId: existingArticle.authorId,
          newStatus: status,
          feedback,
          deletionDate: updateData.scheduledForDeletionAt,
        });

        // Send rejection email
        if (existingArticle.authorEmail) {
          await sendArticleRejectedEmail({
            to: existingArticle.authorEmail,
            articleTitle: existingArticle.title,
            feedback,
          });
        }
      } else if (status === "SCHEDULED_FOR_DELETION") {
        await createArticleStatusNotification({
          articleId: id,
          articleTitle: existingArticle.title,
          authorId: existingArticle.authorId,
          newStatus: status,
          feedback,
          deletionDate: updateData.scheduledForDeletionAt,
        });

        // Send scheduled deletion email
        if (existingArticle.authorEmail) {
          await sendArticleScheduledForDeletionEmail({
            to: existingArticle.authorEmail,
            articleTitle: existingArticle.title,
            feedback,
            deletionDate: updateData.scheduledForDeletionAt,
          });
        }
      } else if (["IN_REVIEW", "PUBLISHED", "PENDING_REVIEW", "DRAFT"].includes(status)) {
        await createArticleStatusNotification({
          articleId: id,
          articleTitle: existingArticle.title,
          authorId: existingArticle.authorId,
          newStatus: status,
          feedback,
        });

        // Send status change email
        if (existingArticle.authorEmail) {
          await sendArticleStatusChangedEmail({
            to: existingArticle.authorEmail,
            articleTitle: existingArticle.title,
            newStatus: status,
            feedback,
          });
        }
      }
    } catch (notifError) {
      console.error("Failed to create notification or send email:", notifError);
      // Don't fail the status change if notification/email fails
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        status: article.status,
        adminFeedback: article.adminFeedback,
        reviewedAt: article.reviewedAt,
        publishedAt: article.publishedAt,
        rejectedAt: article.rejectedAt,
        scheduledForDeletionAt: article.scheduledForDeletionAt,
      },
    });
  } catch (error) {
    console.error("Error changing article status:", error);
    return NextResponse.json(
      { error: "Failed to change article status" },
      { status: 500 }
    );
  }
}
