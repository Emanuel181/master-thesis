import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

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

function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

// GET /api/admin/users/[id] - Get user details
export async function GET(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");
    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
        warnings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reason: true,
            warnedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id] - Warn user
export async function POST(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");
    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent warning admin users
    if (isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: "Cannot warn admin users" },
        { status: 403 }
      );
    }

    if (action === "warn") {
      if (!reason || reason.trim().length === 0) {
        return NextResponse.json(
          { error: "Warning reason is required" },
          { status: 400 }
        );
      }

      // Create warning record
      await prisma.userWarning.create({
        data: {
          userId: id,
          reason: reason.trim(),
          warnedBy: adminEmail,
        },
      });

      // Update user warning count
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          warningCount: { increment: 1 },
          lastWarningAt: new Date(),
        },
      });

      // Create notification for user
      await createNotification({
        userId: id,
        type: "WARNING",
        title: "Account Warning",
        message: `You have received a warning: ${reason.trim()}`,
        link: "/dashboard",
        metadata: { warnedBy: adminEmail, reason: reason.trim() },
      });

      return NextResponse.json({
        success: true,
        message: "User warned successfully",
        warningCount: updatedUser.warningCount,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error warning user:", error);
    return NextResponse.json(
      { error: "Failed to warn user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/warning/[warningId] - Remove a specific warning
export async function DELETE(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");
    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const warningId = searchParams.get("warningId");

    if (warningId) {
      // Delete specific warning
      await prisma.userWarning.delete({
        where: { id: warningId },
      });

      // Decrement warning count
      await prisma.user.update({
        where: { id },
        data: {
          warningCount: { decrement: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Warning removed",
      });
    }

    return NextResponse.json({ error: "Warning ID required" }, { status: 400 });
  } catch (error) {
    console.error("Error removing warning:", error);
    return NextResponse.json(
      { error: "Failed to remove warning" },
      { status: 500 }
    );
  }
}

