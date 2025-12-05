import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";

// GET - Fetch a single use case
export async function GET(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const useCase = await prisma.knowledgeBaseCategory.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        pdfs: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: "Use case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ useCase });
  } catch (error) {
    console.error("Error fetching use case:", error);
    return NextResponse.json(
      { error: "Failed to fetch use case" },
      { status: 500 }
    );
  }
}

// PUT - Update a use case
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the use case belongs to the user
    const existingUseCase = await prisma.knowledgeBaseCategory.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingUseCase) {
      return NextResponse.json(
        { error: "Use case not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, icon } = body;

    const updatedUseCase = await prisma.knowledgeBaseCategory.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(icon && { icon }),
      },
    });

    return NextResponse.json({ useCase: updatedUseCase });
  } catch (error) {
    console.error("Error updating use case:", error);
    return NextResponse.json(
      { error: "Failed to update use case" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a use case and its associated PDFs from S3
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if the use case belongs to the user and get associated PDFs
    const useCase = await prisma.knowledgeBaseCategory.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        pdfs: true,
      },
    });

    if (!useCase) {
      return NextResponse.json(
        { error: "Use case not found" },
        { status: 404 }
      );
    }

    // Delete all PDFs from S3
    for (const pdf of useCase.pdfs) {
      try {
        await deleteFromS3(pdf.s3Key);
      } catch (s3Error) {
        console.error(`Failed to delete PDF from S3: ${pdf.s3Key}`, s3Error);
        // Continue with deletion even if S3 delete fails
      }
    }

    // Delete the use case (PDFs will be cascade deleted)
    await prisma.knowledgeBaseCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Use case deleted successfully" });
  } catch (error) {
    console.error("Error deleting use case:", error);
    return NextResponse.json(
      { error: "Failed to delete use case" },
      { status: 500 }
    );
  }
}

