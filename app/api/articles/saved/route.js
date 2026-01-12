import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/api-handler";

// GET /api/articles/saved - Get user's saved articles
export async function GET(request) {
  const requestId = generateRequestId();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", { status: 401, code: "UNAUTHORIZED", requestId });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = parseInt(searchParams.get("skip") || "0");

    // Get total count
    const total = await prisma.savedArticle.count({
      where: { 
        userId: session.user.id,
        article: { status: "PUBLISHED" }
      },
    });

    const savedArticles = await prisma.savedArticle.findMany({
      where: { 
        userId: session.user.id,
        article: { status: "PUBLISHED" }
      },
      include: {
        article: {
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            category: true,
            authorName: true,
            iconName: true,
            iconColor: true,
            gradient: true,
            coverImage: true,
            coverType: true,
            readTime: true,
            publishedAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const articles = savedArticles.map((sa) => ({
      ...sa.article,
      savedAt: sa.createdAt,
    }));

    return successResponse({ articles, total }, { requestId });
  } catch (error) {
    console.error("Error fetching saved articles:", error);
    return errorResponse("Failed to fetch saved articles", { status: 500, code: "INTERNAL_ERROR", requestId });
  }
}

// POST /api/articles/saved - Save an article
export async function POST(request) {
  const requestId = generateRequestId();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", { status: 401, code: "UNAUTHORIZED", requestId });
    }

    const body = await request.json();
    const { articleId } = body;
    
    if (!articleId) {
      return errorResponse("Article ID is required", { status: 400, code: "VALIDATION_ERROR", requestId });
    }

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article || article.status !== "PUBLISHED") {
      return errorResponse("Article not found", { status: 404, code: "NOT_FOUND", requestId });
    }

    // Check if already saved
    const existing = await prisma.savedArticle.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return successResponse({ message: "Already saved", saved: true }, { requestId });
    }

    await prisma.savedArticle.create({
      data: {
        articleId,
        userId: session.user.id,
      },
    });

    return successResponse({ message: "Article saved", saved: true }, { requestId });
  } catch (error) {
    console.error("Error saving article:", error.message, error.stack);
    return errorResponse("Failed to save article", { status: 500, code: "INTERNAL_ERROR", requestId });
  }
}

// DELETE /api/articles/saved - Unsave an article
export async function DELETE(request) {
  const requestId = generateRequestId();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", { status: 401, code: "UNAUTHORIZED", requestId });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return errorResponse("Article ID is required", { status: 400, code: "VALIDATION_ERROR", requestId });
    }

    await prisma.savedArticle.deleteMany({
      where: {
        articleId,
        userId: session.user.id,
      },
    });

    return successResponse({ message: "Article unsaved", saved: false }, { requestId });
  } catch (error) {
    console.error("Error unsaving article:", error);
    return errorResponse("Failed to unsave article", { status: 500, code: "INTERNAL_ERROR", requestId });
  }
}
