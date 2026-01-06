import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/articles/[id]/content - Get article content
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        contentJson: true,
        content: true,
        status: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Only allow author to see non-published articles
    if (article.authorId !== session.user.id && article.status !== "APPROVED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Sanitize output to prevent accidental exposure of secrets
    const SENSITIVE_KEYS = new Set([
      "password",
      "pass",
      "secret",
      "token",
      "apiKey",
      "apikey",
      "key",
      "accessToken",
      "refreshToken",
      "authorization",
      "clientSecret",
      "privateKey",
      "sshKey",
      "cookie",
      "session",
    ]);

    const sanitizeText = (text) => {
      if (typeof text !== "string") return text;
      let t = text;
      // Redact private key blocks
      t = t.replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]");
      // Redact bearer tokens and JWTs
      t = t.replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/gi, "Bearer [REDACTED]");
      t = t.replace(/\beyJ[0-9A-Za-z_-]+\.[0-9A-Za-z_-]+\.[0-9A-Za-z_-]+\b/g, "[REDACTED_JWT]");
      // Redact AWS-style keys and generic long secrets
      t = t.replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_KEY]");
      t = t.replace(/\b(?=[A-Za-z0-9\/+=]{40}\b)[A-Za-z0-9\/+=]{40}\b/g, "[REDACTED_SECRET]");
      // Redact generic secret-like tokens
      t = t.replace(/\b(?:api|secret|token|key|password|pass)[\s:=_-]*[A-Za-z0-9\-._~]{6,}\b/gi, "[REDACTED]");
      return t;
    };

    const sanitizeValue = (val, keyName) => {
      if (SENSITIVE_KEYS.has(String(keyName).toLowerCase())) {
        return "[REDACTED]";
      }
      if (typeof val === "string") return sanitizeText(val);
      if (Array.isArray(val)) return val.map((v) => sanitizeValue(v));
      if (val && typeof val === "object") {
        const out = {};
        for (const k of Object.keys(val)) {
          out[k] = sanitizeValue(val[k], k);
        }
        return out;
      }
      return val;
    };

    const safeContentJson = sanitizeValue(article.contentJson, "contentJson");
    const safeContent = sanitizeText(article.content);

    return NextResponse.json({
      contentJson: safeContentJson,
      content: safeContent,
    });
  } catch (error) {
    console.error("Error fetching article content");
    return NextResponse.json(
      { error: "Failed to fetch article content" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/[id]/content - Update article content (autosave)
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { contentJson, contentMarkdown, content } = body;

    // Verify ownership
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: { authorId: true, status: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (existingArticle.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Don't allow editing approved articles
    if (existingArticle.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot edit published articles" },
        { status: 400 }
      );
    }

    // Calculate read time from content (rough estimate: 200 words per minute)
    let readTime = null;
    if (content || contentMarkdown) {
      const text = content || contentMarkdown || "";
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(wordCount / 200));
      readTime = `${minutes} min read`;
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(contentJson !== undefined && { contentJson }),
        ...(contentMarkdown !== undefined && { contentMarkdown }),
        ...(content !== undefined && { content }),
        ...(readTime && { readTime }),
      },
      select: {
        id: true,
        updatedAt: true,
        readTime: true,
      },
    });

    return NextResponse.json({
      success: true,
      updatedAt: article.updatedAt,
      readTime: article.readTime,
    });
  } catch (error) {
    console.error("Error updating article content:", error);
    return NextResponse.json(
      { error: "Failed to update article content" },
      { status: 500 }
    );
  }
}

