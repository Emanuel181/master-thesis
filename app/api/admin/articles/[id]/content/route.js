import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List of allowed admin emails - supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// GET /api/admin/articles/[id]/content - Get article content for admin
export async function GET(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail) {
      return NextResponse.json({ error: "Unauthorized - No admin email" }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized - Email not allowed" }, { status: 401 });
    }

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
export async function PUT(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

