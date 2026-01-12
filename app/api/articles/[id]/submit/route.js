import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/api-handler";

// POST /api/articles/[id]/submit - Submit article for review
export async function POST(request, { params }) {
  const requestId = generateRequestId();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", { status: 401, code: "UNAUTHORIZED", requestId });
    }

    const { id } = await params;

    // Verify ownership and get current status
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: {
        authorId: true,
        status: true,
        title: true,
        excerpt: true,
        content: true,
        contentJson: true,
      },
    });

    if (!existingArticle) {
      return errorResponse("Article not found", { status: 404, code: "NOT_FOUND", requestId });
    }

    if (existingArticle.authorId !== session.user.id) {
      return errorResponse("Unauthorized", { status: 403, code: "FORBIDDEN", requestId });
    }

    // Check current status and apply rules:
    // - IN_REVIEW: Cannot modify, must wait until published
    // - PENDING_REVIEW: Can resubmit (overwrites previous submission)
    // - DRAFT, REJECTED, SCHEDULED_FOR_DELETION: Can submit
    if (existingArticle.status === "IN_REVIEW") {
      return errorResponse(
        "Article is currently being reviewed. Please wait until the review is complete before making changes.",
        { status: 400, code: "IN_REVIEW", requestId }
      );
    }

    // Only allow submitting from these statuses
    if (
      ![
        "DRAFT",
        "REJECTED",
        "PENDING_REVIEW",
        "SCHEDULED_FOR_DELETION",
      ].includes(existingArticle.status)
    ) {
      return errorResponse("Cannot submit this article. It may already be published.", { 
        status: 400, 
        code: "VALIDATION_ERROR", 
        requestId 
      });
    }

    // Validate required fields
    if (!existingArticle.title || existingArticle.title === "Untitled Article") {
      return errorResponse("Please provide a title for your article", { status: 400, code: "VALIDATION_ERROR", requestId });
    }

    if (!existingArticle.excerpt) {
      return errorResponse("Please provide an excerpt for your article", { status: 400, code: "VALIDATION_ERROR", requestId });
    }

    if (!existingArticle.content && !existingArticle.contentJson) {
      return errorResponse("Please add content to your article", { status: 400, code: "VALIDATION_ERROR", requestId });
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        submittedAt: new Date(),
        adminFeedback: null, // Clear previous feedback
        rejectedAt: null, // Clear rejection date
        scheduledForDeletionAt: null, // Clear deletion schedule
      },
    });

    return successResponse({
      article: {
        id: article.id,
        status: article.status,
        submittedAt: article.submittedAt,
      },
      message:
        existingArticle.status === "PENDING_REVIEW"
          ? "Article resubmitted successfully. Your changes will replace the previous submission."
          : "Article submitted for review successfully.",
    }, { requestId });
  } catch (error) {
    console.error("Error submitting article:", error);
    return errorResponse("Failed to submit article", { status: 500, code: "INTERNAL_ERROR", requestId });
  }
}

