import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/articles/[id]/content - Get article content
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        contentJson: true,
        content: true,
        status: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Only allow author to see non-published articles
    if (article.authorId !== session.user.id && article.status !== "APPROVED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      contentJson: article.contentJson,
      content: article.content,
    });
  } catch (error) {
    console.error("Error fetching article content:", error);
    return NextResponse.json(
      { error: "Failed to fetch article content" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id]/content - Update article content (autosave)
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { contentJson, contentMarkdown, content } = body;

    // Verify ownership
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (existingArticle.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Don't allow editing approved articles
    if (existingArticle.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot edit published articles" },
        { status: 400 }
      );
    }

    // Calculate read time from content (rough estimate: 200 words per minute)
    let readTime = null;
    if (content || contentMarkdown) {
      const text = content || contentMarkdown || "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      readTime = `${minutes} min read`;
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(contentJson !== undefined && { contentJson }),
        ...(contentMarkdown !== undefined && { contentMarkdown }),
        ...(content !== undefined && { content }),
        ...(readTime && { readTime }),
      },
      select: {
        id: true,
        updatedAt: true,
        readTime: true,
      },
    });

    return NextResponse.json({
      success: true,
      updatedAt: article.updatedAt,
      readTime: article.readTime,
    });
  } catch (error) {
    console.error("Error updating article content:", error);
    return NextResponse.json(
      { error: "Failed to update article content" },
      { status: 500 }
    );
  }
}

