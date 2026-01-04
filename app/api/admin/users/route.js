import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get admin emails from environment
function getAdminEmails() {
  const adminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  const singleAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (singleAdmin && !adminEmails.includes(singleAdmin)) {
    adminEmails.push(singleAdmin);
  }
  return adminEmails;
}

// Check if email is admin
function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

// GET /api/admin/users - Get all users
export async function GET(request) {
  try {
    const adminEmail = request.headers.get("x-admin-email");
    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      { status: 500 }
    );
  }
}

