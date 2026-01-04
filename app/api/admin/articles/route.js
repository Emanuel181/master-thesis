import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List of allowed admin emails - supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// GET /api/admin/articles - Get all articles for admin review
export async function GET(request) {
  try {
    // Get admin email from header (set by admin verification flow)
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail) {
      return NextResponse.json({ error: "Unauthorized - No email provided" }, { status: 401 });
    }

    const normalizedEmail = adminEmail.toLowerCase().trim();

    // Check if email is in allowed list
    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
      console.log("Email not in admin list:", normalizedEmail, "Allowed:", ADMIN_EMAILS);
      return NextResponse.json({ error: "Unauthorized - Email not in admin list" }, { status: 401 });
    }


    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING_REVIEW, IN_REVIEW, PUBLISHED, REJECTED
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { authorName: { contains: search, mode: "insensitive" } },
          { authorEmail: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [
          { submittedAt: "desc" },
          { createdAt: "desc" },
        ],
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          contentJson: true,
          contentMarkdown: true,
          category: true,
          iconName: true,
          iconColor: true,
          iconPosition: true,
          gradient: true,
          coverImage: true,
          coverType: true,
          status: true,
          adminFeedback: true,
          readTime: true,
          authorId: true,
          authorName: true,
          authorEmail: true,
          featured: true,
          showInMoreArticles: true,
          featuredOrder: true,
          submittedAt: true,
          reviewedAt: true,
          publishedAt: true,
          rejectedAt: true,
          scheduledForDeletionAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { reactions: true },
          },
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    // Get counts by status
    const statusCounts = await prisma.article.groupBy({
      by: ["status"],
      _count: true,
    });

    const counts = statusCounts.reduce(
      (acc, { status, _count }) => {
        acc[status] = _count;
        return acc;
      },
      { DRAFT: 0, PENDING_REVIEW: 0, IN_REVIEW: 0, PUBLISHED: 0, REJECTED: 0, SCHEDULED_FOR_DELETION: 0 }
    );

    return NextResponse.json({
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      counts,
    });
  } catch (error) {
    console.error("Error fetching articles for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

