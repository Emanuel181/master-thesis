import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification, NOTIFICATION_TYPES } from "@/lib/notifications";
import { sendArticleDeletedEmail } from "@/lib/article-emails";

// List of allowed admin emails
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// DELETE /api/admin/articles/[id]/delete - Permanently delete an article
export async function DELETE(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get feedback from request body if provided
    let feedback = null;
    try {
      const body = await request.json();
      feedback = body.feedback;
    } catch {
      // No body provided, that's okay
    }

    // Get the article before deletion
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authorId: true,
        authorEmail: true,
        adminFeedback: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Use existing feedback if no new feedback provided
    const deletionReason = feedback || article.adminFeedback;

    // Delete the article
    await prisma.article.delete({
      where: { id },
    });

    // Notify the author
    try {
      await createNotification({
        userId: article.authorId,
        type: NOTIFICATION_TYPES.ARTICLE_DELETED,
        title: "Article Deleted",
        message: deletionReason
          ? `Your article "${article.title}" has been deleted. Reason: ${deletionReason}`
          : `Your article "${article.title}" has been permanently deleted.`,
        metadata: JSON.stringify({
          articleId: id,
          articleTitle: article.title,
          feedback: deletionReason
        }),
      });

      // Send deletion email
      if (article.authorEmail) {
        await sendArticleDeletedEmail({
          to: article.authorEmail,
          articleTitle: article.title,
          feedback: deletionReason,
        });
      }
    } catch (notifError) {
      console.error("Failed to send deletion notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}

