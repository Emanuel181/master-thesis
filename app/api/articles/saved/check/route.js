import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET /api/articles/saved/check?articleId=xxx - Check if article is saved
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ saved: false, authenticated: false });
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    const saved = await prisma.savedArticle.findUnique({
      where: {
        articleId_userId: {
          articleId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ saved: !!saved, authenticated: true });
  } catch (error) {
    console.error("Error checking saved status:", error);
    return NextResponse.json(
      { error: "Failed to check saved status" },
      { status: 500 }
    );
  }
}
