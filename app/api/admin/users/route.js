import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { securityHeaders } from "@/lib/api-security";

// GET /api/admin/users - Get all users
// Requires admin authentication
export async function GET(request) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  try {

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all"; // all, warned

    const skip = (page - 1) * limit;

    // Build where clause
    let where = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (filter === "warned") {
      where.warningCount = { gt: 0 };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          firstName: true,
          lastName: true,
          phone: true,
          jobTitle: true,
          company: true,
          location: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          warningCount: true,
          lastWarningAt: true,
          warnings: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              reason: true,
              warnedBy: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get stats
    const [totalUsersCount, warnedUsersCount, bannedIPsCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { warningCount: { gt: 0 } } }),
      prisma.bannedIP.count(),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalUsers: totalUsersCount,
        warnedUsers: warnedUsersCount,
        bannedIPs: bannedIPsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500, headers: securityHeaders }
    );
  }
}

