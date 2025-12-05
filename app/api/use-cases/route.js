import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../api/auth/[...nextauth]/route";

// GET - Fetch all use cases for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        useCases: {
          include: {
            pdfs: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ useCases: user.useCases });
  } catch (error) {
    console.error("Error fetching use cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch use cases" },
      { status: 500 }
    );
  }
}

// POST - Create a new use case
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, icon } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const useCase = await prisma.knowledgeBaseCategory.create({
      data: {
        title,
        content,
        icon: icon || "File",
        userId: user.id,
      },
    });

    return NextResponse.json({ useCase }, { status: 201 });
  } catch (error) {
    console.error("Error creating use case:", error);
    return NextResponse.json(
      { error: "Failed to create use case" },
      { status: 500 }
    );
  }
}
