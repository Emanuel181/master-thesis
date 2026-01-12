import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { 
  successResponse, 
  errorResponse, 
  generateRequestId 
} from "@/lib/api-handler";

// GET /api/articles/saved/check?articleId=xxx - Check if article is saved
export async function GET(request) {
  const requestId = generateRequestId();
  
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return successResponse({ saved: false, authenticated: false }, { requestId });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return errorResponse("Article ID is required", { status: 400, code: "VALIDATION_ERROR", requestId });
    }

    const saved = await prisma.savedArticle.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: session.user.id,
        },
      },
    });

    return successResponse({ saved: !!saved, authenticated: true }, { requestId });
  } catch (error) {
    console.error("Error checking saved status:", error);
    return errorResponse("Failed to check saved status", { status: 500, code: "INTERNAL_ERROR", requestId });
  }
}
