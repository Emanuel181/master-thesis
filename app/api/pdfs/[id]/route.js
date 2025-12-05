import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteFromS3, getPresignedDownloadUrl } from "@/lib/s3";
import { auth } from "@/auth";

// GET - Get a fresh presigned URL for viewing a PDF
export async function GET(request, { params }) {
  try {
    const session = await auth();

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

    // Find the PDF and verify it belongs to a use case owned by the user
    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        useCase: true,
      },
    });

    if (!pdf || pdf.useCase.userId !== user.id) {
      return NextResponse.json(
        { error: "PDF not found" },
        { status: 404 }
      );
    }

    // Generate a fresh presigned URL
    const url = await getPresignedDownloadUrl(pdf.s3Key);

    return NextResponse.json({
      pdf: {
        ...pdf,
        url, // Return fresh URL
      },
    });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a PDF from S3 and database
export async function DELETE(request, { params }) {
  try {
    const session = await auth();

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

    // Find the PDF and verify it belongs to a use case owned by the user
    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        useCase: true,
      },
    });

    // If PDF doesn't exist or doesn't belong to user, return success (idempotent)
    if (!pdf) {
      return NextResponse.json({ message: "PDF already deleted" });
    }

    if (pdf.useCase.userId !== user.id) {
      return NextResponse.json(
        { error: "PDF not found" },
        { status: 404 }
      );
    }

    // Delete from S3
    try {
      await deleteFromS3(pdf.s3Key);
    } catch (s3Error) {
      console.error("Failed to delete PDF from S3:", s3Error);
      // Continue with database deletion even if S3 delete fails
    }

    // Delete from database using deleteMany to avoid errors if already deleted
    await prisma.pdf.deleteMany({
      where: { id },
    });

    return NextResponse.json({ message: "PDF deleted successfully" });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    return NextResponse.json(
      { error: "Failed to delete PDF" },
      { status: 500 }
    );
  }
}
