import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createReactionNotification } from "@/lib/notifications";

// GET /api/articles/[id]/reactions - Get reactions for an article
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const [reactions, counts] = await Promise.all([
      prisma.articleReaction.findMany({
        where: { articleId: id },
        select: {
          id: true,
          userId: true,
          type: true,
          createdAt: true,
        },
      }),
      prisma.articleReaction.groupBy({
        by: ["type"],
        where: { articleId: id },
        _count: true,
      }),
    ]);

    const countByType = counts.reduce((acc, { type, _count }) => {
      acc[type] = _count;
      return acc;
    }, {});

    return NextResponse.json({
      reactions,
      counts: countByType,
      total: reactions.length,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// POST /api/articles/[id]/reactions - Add a reaction
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type = "like" } = body;

    // Check if article exists and is published
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authorId: true,
        status: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (article.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Can only react to published articles" },
        { status: 400 }
      );
    }

    // Check if user already reacted
    const existingReaction = await prisma.articleReaction.findUnique({
      where: {
        articleId_userId: {
          articleId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingReaction) {
      // Update reaction type if different
      if (existingReaction.type !== type) {
        const updated = await prisma.articleReaction.update({
          where: { id: existingReaction.id },
          data: { type },
        });
        return NextResponse.json({ reaction: updated, updated: true });
      }
      return NextResponse.json({ reaction: existingReaction, exists: true });
    }

    // Create new reaction
    const reaction = await prisma.articleReaction.create({
      data: {
        articleId: id,
        userId: session.user.id,
        type,
      },
    });

    // Notify author (if not self-reacting)
    if (article.authorId !== session.user.id) {
      try {
        await createReactionNotification({
          articleId: id,
          articleTitle: article.title,
          authorId: article.authorId,
          reactorName: session.user.name || "Someone",
          reactionType: type,
        });
      } catch (notifError) {
        console.error("Failed to create reaction notification:", notifError);
        // Don't fail the reaction if notification fails
      }
    }

    return NextResponse.json({ reaction, created: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding reaction:", error);
    return NextResponse.json(
      { error: "Failed to add reaction" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/[id]/reactions - Remove a reaction
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find and delete the user's reaction
    const reaction = await prisma.articleReaction.findUnique({
      where: {
        articleId_userId: {
          articleId: id,
          userId: session.user.id,
        },
      },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    await prisma.articleReaction.delete({
      where: { id: reaction.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}

