import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/articles/published - Get all published articles for public display
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;
    const category = searchParams.get("category");

    // Build where clause
    const where = {
      status: "PUBLISHED",
    };

    if (category) {
      where.category = category;
    }

    // Fetch published articles with featured articles first, then by publish date
    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        authorName: true,
        // Note: authorEmail intentionally excluded - not exposed to public
        iconName: true,
        iconPosition: true,
        iconColor: true,
        gradient: true,
        coverImage: true,
        coverType: true,
        readTime: true,
        publishedAt: true,
        contentMarkdown: true,
        content: true,
        contentJson: true,
        featured: true,
        showInMoreArticles: true,
        featuredOrder: true,
      },
      orderBy: [
        { featured: "desc" },
        { featuredOrder: "asc" },
        { publishedAt: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.article.count({ where });

    // Transform articles to match the blog post structure
    const transformedArticles = articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      author: article.authorName,
      // Note: authorEmail not exposed to public API
      date: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      readTime: article.readTime || "5 min read",
      iconName: article.iconName || "Shield",
      iconPosition: article.iconPosition || "center",
      iconColor: article.iconColor || "white",
      gradient: article.gradient,
      coverImage: article.coverImage,
      coverType: article.coverType || "gradient",
      featured: article.featured || false,
      showInMoreArticles: article.showInMoreArticles !== false, // Default to true
      featuredOrder: article.featuredOrder || 0,
      content: article.contentMarkdown || article.content || "",
      contentJson: article.contentJson,
      isUserSubmitted: true, // Flag to identify user-submitted articles
    }));

    return NextResponse.json({
      articles: transformedArticles,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching published articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch published articles" },
      { status: 500 }
    );
  }
}

