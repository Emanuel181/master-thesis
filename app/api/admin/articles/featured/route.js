import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List of allowed admin emails
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// GET /api/admin/articles/featured - Get all published articles with featured status
export async function GET(request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all published articles
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { featured: "desc" },
        { featuredOrder: "asc" },
        { publishedAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        iconName: true,
        gradient: true,
        coverImage: true,
        coverType: true,
        authorName: true,
        readTime: true,
        featured: true,
        showInMoreArticles: true,
        featuredOrder: true,
        publishedAt: true,
      },
    });

    // Get the main featured article
    const mainFeatured = articles.find(a => a.featured) || null;

    // Get articles shown in "More Articles"
    const moreArticles = articles.filter(a => a.showInMoreArticles && (!a.featured || articles.filter(x => x.featured).length === 0));

    return NextResponse.json({
      articles,
      mainFeatured,
      moreArticlesCount: moreArticles.length,
    });
  } catch (error) {
    console.error("Error fetching featured articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured articles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/articles/featured - Update featured article settings
export async function POST(request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { articleId, action, value, featuredOrder } = body;

    if (!articleId || !action) {
      return NextResponse.json(
        { error: "articleId and action are required" },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Only published articles can be featured" },
        { status: 400 }
      );
    }

    let updateData = {};

    switch (action) {
      case "setFeatured":
        // If setting as featured, unset all other featured articles first
        if (value === true) {
          await prisma.article.updateMany({
            where: { featured: true },
            data: { featured: false },
          });
        }
        updateData = { featured: value === true };
        break;

      case "toggleMoreArticles":
        updateData = { showInMoreArticles: value === true };
        break;

      case "updateOrder":
        if (typeof featuredOrder !== "number") {
          return NextResponse.json(
            { error: "featuredOrder must be a number" },
            { status: 400 }
          );
        }
        updateData = { featuredOrder };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: setFeatured, toggleMoreArticles, or updateOrder" },
          { status: 400 }
        );
    }

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
      select: {
        id: true,
        title: true,
        featured: true,
        showInMoreArticles: true,
        featuredOrder: true,
      },
    });

    return NextResponse.json({
      success: true,
      article: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating featured article:", error);
    return NextResponse.json(
      { error: "Failed to update featured article" },
      { status: 500 }
    );
  }
}

