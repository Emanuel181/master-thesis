import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { securityHeaders } from "@/lib/api-security";

// GET /api/admin/articles - Get all articles for admin review
// Requires admin authentication
export async function GET(request) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  try {

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
      { status: 500, headers: securityHeaders }
    );
  }
}

