import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List of allowed admin emails - supports both ADMIN_EMAILS (comma-separated) and ADMIN_EMAIL (single)
const ADMIN_EMAILS = [
  ...(process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : [])
].filter(Boolean);

// GET /api/admin/articles/[id] - Get a single article for admin review
export async function GET(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
export async function PATCH(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
export async function PUT(request, { params }) {
  try {
    const adminEmail = request.headers.get("x-admin-email");

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail.toLowerCase())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json({ article });
  } catch (error) {
    console.error("Error updating article (PUT):", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

