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

    // Only allow submitting drafts or rejected articles
    if (!["DRAFT", "REJECTED"].includes(existingArticle.status)) {
      return NextResponse.json(
        { error: "Can only submit draft or rejected articles" },
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
      },
    });

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        status: article.status,
        submittedAt: article.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting article:", error);
    return NextResponse.json(
      { error: "Failed to submit article" },
      { status: 500 }
    );
  }
}

