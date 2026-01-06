import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { securityHeaders } from "@/lib/api-security";

// GET /api/admin/articles/[id]/content - Get article content for admin
// Requires admin authentication
export async function GET(request, { params }) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  try {

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        contentJson: true,
        content: true,
        status: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      contentJson: article.contentJson,
      content: article.content,
    });
  } catch (error) {
    console.error("Error fetching article content for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch article content" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/articles/[id]/content - Update article content (admin autosave)
// Requires MASTER admin authentication
export async function PUT(request, { params }) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  // SECURITY: Only master admins can modify article content directly
  // This prevents unauthorized content tampering and provides clear accountability
  if (!adminCheck.isMasterAdmin) {
    return NextResponse.json(
      { error: "Insufficient permissions. Only master admins can modify article content." },
      { status: 403 }
    );
  }

  try {

    const { id } = await params;
    const body = await request.json();
    const { contentJson, contentMarkdown, content } = body;

    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Build update data
    const updateData = {};
    if (contentJson !== undefined) updateData.contentJson = contentJson;
    if (contentMarkdown !== undefined) updateData.contentMarkdown = contentMarkdown;
    if (content !== undefined) updateData.content = content;

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        contentJson: true,
        content: true,
        contentMarkdown: true,
      },
    });

    // SECURITY: Audit log for content modifications
    console.log(`[Admin Audit] Article ${id} content modified by ${adminCheck.email} (master admin) at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      article: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating article content (admin):", error);
    return NextResponse.json(
      { error: "Failed to update article content" },
      { status: 500 }
    );
  }
}

