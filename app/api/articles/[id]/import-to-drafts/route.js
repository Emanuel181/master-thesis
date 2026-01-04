import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/articles/[id]/import-to-drafts - Import a rejected/scheduled-for-deletion article back to drafts
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the article
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        status: true,
        title: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check ownership
    if (article.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow importing from REJECTED or SCHEDULED_FOR_DELETION status
    if (!["REJECTED", "SCHEDULED_FOR_DELETION"].includes(article.status)) {
      return NextResponse.json(
        { error: "Only rejected or scheduled-for-deletion articles can be imported to drafts" },
        { status: 400 }
      );
    }

    // Update the article status to DRAFT and clear deletion schedule
    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        status: "DRAFT",
        scheduledForDeletionAt: null,
        rejectedAt: null,
        // Keep the admin feedback for reference
        submittedAt: null, // Reset submission
        reviewedAt: null, // Reset review
      },
    });

    return NextResponse.json({
      success: true,
      article: {
        id: updatedArticle.id,
        status: updatedArticle.status,
        title: updatedArticle.title,
      },
      message: "Article imported to drafts successfully. You can now edit and resubmit it.",
    });
  } catch (error) {
    console.error("Error importing article to drafts:", error);
    return NextResponse.json(
      { error: "Failed to import article to drafts" },
      { status: 500 }
    );
  }
}

