import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// List of allowed admin emails - supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// Check if user is admin
function isAdminUser(email) {
  return email && ADMIN_EMAILS.includes(email.toLowerCase());
}

// GET /api/articles - Get all articles for the current user
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // DRAFT, PENDING_REVIEW, IN_REVIEW, PUBLISHED, REJECTED, SCHEDULED_FOR_DELETION
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const where = {
      authorId: session.user.id,
      ...(status && { status }),
    };

    // Get total count and stats
    const [total, publishedCount, draftCount] = await Promise.all([
      prisma.article.count({ where }),
      prisma.article.count({ where: { authorId: session.user.id, status: "PUBLISHED" } }),
      prisma.article.count({ where: { authorId: session.user.id, status: "DRAFT" } }),
    ]);

    const articles = await prisma.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
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
        status: true,
        adminFeedback: true,
        readTime: true,
        submittedAt: true,
        reviewedAt: true,
        publishedAt: true,
        rejectedAt: true,
        scheduledForDeletionAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ articles, total, publishedCount, draftCount });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create a new article
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, iconName, gradient, coverImage, coverType } = body;

    // Generate a unique slug from the title
    const baseSlug = (title || "untitled")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for existing slugs and make unique if needed
    const existingArticles = await prisma.article.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });

    let slug = baseSlug;
    if (existingArticles.length > 0) {
      const slugs = new Set(existingArticles.map((a) => a.slug));
      let counter = 1;
      while (slugs.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const article = await prisma.article.create({
      data: {
        title: title || "Untitled Article",
        slug,
        excerpt: "",
        category: category || "General",
        iconName: iconName || "Shield",
        gradient: gradient || null,
        coverImage: coverImage || null,
        coverType: coverType || "gradient",
        content: "",
        contentJson: null,
        contentMarkdown: null,
        authorId: session.user.id,
        // Use "VulnIQ security" as author for admin users
        authorName: isAdminUser(session.user.email) ? "VulnIQ security" : (session.user.name || "Anonymous"),
        authorEmail: session.user.email || "",
        status: "DRAFT",
      },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

