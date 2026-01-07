import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET /api/articles/saved - Get user's saved articles
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Get total count
    const total = await prisma.savedArticle.count({
      where: { 
        userId: session.user.id,
        article: { status: "PUBLISHED" }
      },
    });

    const savedArticles = await prisma.savedArticle.findMany({
      where: { 
        userId: session.user.id,
        article: { status: "PUBLISHED" }
      },
      include: {
        article: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            category: true,
            authorName: true,
            iconName: true,
            iconColor: true,
            gradient: true,
            coverImage: true,
            coverType: true,
            readTime: true,
            publishedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const articles = savedArticles.map((sa) => ({
      ...sa.article,
      savedAt: sa.createdAt,
    }));

    return NextResponse.json({ articles, total });
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles/saved - Save an article
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { articleId } = body;
    
    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article || article.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if already saved
    const existing = await prisma.savedArticle.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already saved", saved: true });
    }

    await prisma.savedArticle.create({
      data: {
        articleId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Article saved", saved: true });
  } catch (error) {
    console.error("Error saving article:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to save article", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/saved - Unsave an article
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    await prisma.savedArticle.deleteMany({
      where: {
        articleId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "Article unsaved", saved: false });
  } catch (error) {
    console.error("Error unsaving article:", error);
    return NextResponse.json(
      { error: "Failed to unsave article" },
      { status: 500 }
    );
  }
}
