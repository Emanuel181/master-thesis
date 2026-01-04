import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST /api/articles/[id]/submit - Submit article for review
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and get current status
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: {
        authorId: true,
        status: true,
        title: true,
        excerpt: true,
        content: true,
        contentJson: true,
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (existingArticle.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check current status and apply rules:
    // - IN_REVIEW: Cannot modify, must wait until published
    // - PENDING_REVIEW: Can resubmit (overwrites previous submission)
    // - DRAFT, REJECTED, SCHEDULED_FOR_DELETION: Can submit
    if (existingArticle.status === "IN_REVIEW") {
      return NextResponse.json(
        {
          error: "Article is currently being reviewed. Please wait until the review is complete before making changes.",
          code: "IN_REVIEW",
        },
        { status: 400 }
      );
    }

    // Only allow submitting from these statuses
    if (
      ![
        "DRAFT",
        "REJECTED",
        "PENDING_REVIEW",
        "SCHEDULED_FOR_DELETION",
      ].includes(existingArticle.status)
    ) {
      return NextResponse.json(
        { error: "Cannot submit this article. It may already be published." },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!existingArticle.title || existingArticle.title === "Untitled Article") {
      return NextResponse.json(
        { error: "Please provide a title for your article" },
        { status: 400 }
      );
    }

    if (!existingArticle.excerpt) {
      return NextResponse.json(
        { error: "Please provide an excerpt for your article" },
        { status: 400 }
      );
    }

    if (!existingArticle.content && !existingArticle.contentJson) {
      return NextResponse.json(
        { error: "Please add content to your article" },
        { status: 400 }
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
        adminFeedback: null, // Clear previous feedback
        rejectedAt: null, // Clear rejection date
        scheduledForDeletionAt: null, // Clear deletion schedule
      },
    });

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        status: article.status,
        submittedAt: article.submittedAt,
      },
      message:
        existingArticle.status === "PENDING_REVIEW"
          ? "Article resubmitted successfully. Your changes will replace the previous submission."
          : "Article submitted for review successfully.",
    });
  } catch (error) {
    console.error("Error submitting article:", error);
    return NextResponse.json(
      { error: "Failed to submit article" },
      { status: 500 }
    );
  }
}

