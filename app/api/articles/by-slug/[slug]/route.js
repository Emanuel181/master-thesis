import { prisma } from "@/lib/prisma";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/api-handler";

// GET /api/articles/by-slug/[slug] - Get a single published article by slug
export async function GET(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    const { slug } = await params;

    const article = await prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        authorName: true,
        // Note: authorEmail intentionally excluded - not exposed to public
        iconName: true,
        iconPosition: true,
        iconColor: true,
        gradient: true,
        coverImage: true,
        coverType: true,
        readTime: true,
        publishedAt: true,
        contentMarkdown: true,
        content: true,
        contentJson: true,
        status: true,
      },
    });

    if (!article) {
      return errorResponse("Article not found", { status: 404, code: "NOT_FOUND", requestId });
    }

    // Only return published articles to the public
    if (article.status !== "PUBLISHED") {
      return errorResponse("Article not found", { status: 404, code: "NOT_FOUND", requestId });
    }

    // Transform to match the blog post structure
    const transformedArticle = {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      author: article.authorName,
      // Note: authorEmail not exposed to public API
      date: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      readTime: article.readTime || "5 min read",
      iconName: article.iconName || "Shield",
      iconPosition: article.iconPosition || "center",
      iconColor: article.iconColor || "white",
      gradient: article.gradient,
      coverImage: article.coverImage,
      coverType: article.coverType || "gradient",
      featured: false,
      content: article.contentMarkdown || article.content || "",
      contentJson: article.contentJson,
      isUserSubmitted: true,
    };

    return successResponse(transformedArticle, { requestId });
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return errorResponse("Failed to fetch article", { status: 500, code: "INTERNAL_ERROR", requestId });
  }
}

