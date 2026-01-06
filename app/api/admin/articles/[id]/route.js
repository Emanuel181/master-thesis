import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { securityHeaders } from "@/lib/api-security";

// GET /api/admin/articles/[id] - Get a single article for admin review
// Requires admin authentication
export async function GET(request, { params }) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  try {

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        reactions: {
          select: {
            id: true,
            type: true,
            userId: true,
            createdAt: true,
          },
        },
        media: {
          select: {
            id: true,
            type: true,
            fileName: true,
            url: true,
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error fetching article for admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/articles/[id] - Update article (admin can edit any field)
// Requires MASTER admin authentication for content modifications
export async function PATCH(request, { params }) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  // SECURITY: Only master admins can modify article content
  // Regular admins can only view articles and change status via the status endpoint
  if (!adminCheck.isMasterAdmin) {
    return NextResponse.json(
      { error: "Insufficient permissions. Only master admins can modify articles." },
      { status: 403, headers: securityHeaders }
    );
  }

  try {

    const { id } = await params;
    const body = await request.json();

    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const {
      title,
      excerpt,
      category,
      iconName,
      gradient,
      coverImage,
      coverType,
      content,
      contentJson,
      contentMarkdown,
    } = body;

    // Build update data
    let updateData = {
      ...(title !== undefined && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category !== undefined && { category }),
      ...(iconName !== undefined && { iconName }),
      ...(gradient !== undefined && { gradient }),
      ...(coverImage !== undefined && { coverImage }),
      ...(coverType !== undefined && { coverType }),
      ...(content !== undefined && { content }),
      ...(contentJson !== undefined && { contentJson }),
      ...(contentMarkdown !== undefined && { contentMarkdown }),
    };

    // Generate new slug if title changed
    if (title && title !== existingArticle.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingArticles = await prisma.article.findMany({
        where: {
          slug: { startsWith: baseSlug },
          id: { not: id },
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
      updateData.slug = slug;
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    // SECURITY: Audit log for article modifications
    console.log(`[Admin Audit] Article ${id} modified (PATCH) by ${adminCheck.email} (master admin) at ${new Date().toISOString()}`);

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/articles/[id] - Full article update including author reassignment
// Requires MASTER admin authentication
export async function PUT(request, { params }) {
  // Verify admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck.error) return adminCheck.error;

  // SECURITY: Only master admins can perform full article updates
  // This includes content modification and author reassignment
  if (!adminCheck.isMasterAdmin) {
    return NextResponse.json(
      { error: "Insufficient permissions. Only master admins can fully modify articles." },
      { status: 403, headers: securityHeaders }
    );
  }

  try {

    const { id } = await params;
    const body = await request.json();

    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const {
      title,
      excerpt,
      category,
      iconName,
      iconColor,
      gradient,
      coverImage,
      coverType,
      content,
      contentJson,
      contentMarkdown,
      authorId,
      authorName,
      authorEmail: newAuthorEmail,
      readTime,
      featured,
      showInMoreArticles,
      featuredOrder,
    } = body;

    // Build update data
    let updateData = {
      ...(title !== undefined && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(category !== undefined && { category }),
      ...(iconName !== undefined && { iconName }),
      ...(iconColor !== undefined && { iconColor }),
      ...(gradient !== undefined && { gradient }),
      ...(coverImage !== undefined && { coverImage }),
      ...(coverType !== undefined && { coverType }),
      ...(content !== undefined && { content }),
      ...(contentJson !== undefined && { contentJson }),
      ...(contentMarkdown !== undefined && { contentMarkdown }),
      ...(authorId !== undefined && { authorId }),
      ...(authorName !== undefined && { authorName }),
      ...(newAuthorEmail !== undefined && { authorEmail: newAuthorEmail }),
      ...(readTime !== undefined && { readTime }),
      ...(featured !== undefined && { featured }),
      ...(showInMoreArticles !== undefined && { showInMoreArticles }),
      ...(featuredOrder !== undefined && { featuredOrder }),
    };

    // Generate new slug if title changed
    if (title && title !== existingArticle.title) {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingArticles = await prisma.article.findMany({
        where: {
          slug: { startsWith: baseSlug },
          id: { not: id },
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
      updateData.slug = slug;
    }

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
    });

    // SECURITY: Audit log for full article updates
    console.log(`[Admin Audit] Article ${id} fully updated by ${adminCheck.email} (master admin) at ${new Date().toISOString()}`);

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating article (PUT):", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

