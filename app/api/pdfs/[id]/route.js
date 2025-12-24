import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteFromS3, getPresignedDownloadUrl } from "@/lib/s3";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { z } from "zod";

// CUID validation pattern (starts with 'c', 25 chars, lowercase alphanumeric)
const cuidSchema = z.string().regex(/^c[a-z0-9]{24}$/, 'Invalid ID format');

const patchSchema = z.object({
  folderId: z.union([cuidSchema, z.null()]).optional(),
  order: z.number().int().min(0).max(100000).optional(),
  title: z.string().min(1).max(255).optional(),
}).strict();

// GET - Get a fresh presigned URL for viewing a PDF
export async function GET(request, { params }) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const headers = { ...securityHeaders, 'x-request-id': requestId };
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401, headers }
      );
    }

    // Rate limiting - 100 requests per minute for PDF downloads
    const rl = rateLimit({
      key: `pdfs:get:${session.user.id}`,
      limit: 100,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
        { status: 429, headers }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", requestId },
        { status: 404, headers }
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
        { error: "PDF not found", requestId },
        { status: 404, headers }
      );
    }

    // Generate a fresh presigned URL
    const url = await getPresignedDownloadUrl(pdf.s3Key);

    return NextResponse.json({
      pdf: {
        ...pdf,
        url,
      },
      requestId,
    }, { headers });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF", requestId },
      { status: 500, headers }
    );
  }
}

// DELETE - Delete a PDF from S3 and database
export async function DELETE(request, { params }) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const headers = { ...securityHeaders, 'x-request-id': requestId };
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401, headers }
      );
    }

    // CSRF protection for state-changing operations
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403, headers });
    }

    // Rate limiting - 30 deletes per hour
    const rl = rateLimit({
      key: `pdfs:delete:${session.user.id}`,
      limit: 30,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
        { status: 429, headers }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", requestId },
        { status: 404, headers }
      );
    }

    // Find the PDF and verify it belongs to a use case owned by the user
    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        useCase: true,
      },
    });

    // If PDF doesn't exist, return success (idempotent)
    if (!pdf) {
      return NextResponse.json({ message: "PDF already deleted", requestId }, { headers });
    }

    if (pdf.useCase.userId !== user.id) {
      return NextResponse.json(
        { error: "PDF not found", requestId },
        { status: 404, headers }
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

    return NextResponse.json({ message: "PDF deleted successfully", requestId }, { headers });
  } catch (error) {
    console.error("Error deleting PDF:", error);
    return NextResponse.json(
      { error: "Failed to delete PDF", requestId },
      { status: 500, headers }
    );
  }
}

// PATCH - Update PDF (move to folder, update order, rename)
export async function PATCH(request, { params }) {
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const headers = { ...securityHeaders, 'x-request-id': requestId };
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", requestId },
        { status: 401, headers }
      );
    }

    // CSRF protection for state-changing operations
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: 'Forbidden', requestId }, { status: 403, headers });
    }

    // Rate limiting - 120 updates per minute
    const rl = rateLimit({
      key: `pdfs:patch:${session.user.id}`,
      limit: 120,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
        { status: 429, headers }
      );
    }

    const { id } = await params;
    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400, headers });
    }

    const validation = patchSchema.safeParse(parsed.body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', requestId }, { status: 400, headers });
    }

    const { folderId, order, title } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", requestId },
        { status: 404, headers }
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
        { error: "PDF not found", requestId },
        { status: 404, headers }
      );
    }

    const updateData = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    // Handle moving to a folder (null means move to root)
    if (folderId !== undefined) {
      if (folderId !== null) {
        // Verify the folder exists and belongs to the same use case
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            useCaseId: pdf.useCaseId,
          },
        });

        if (!folder) {
          return NextResponse.json(
            { error: "Folder not found", requestId },
            { status: 404, headers }
          );
        }
      }
      updateData.folderId = folderId;
    }

    const updatedPdf = await prisma.pdf.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ pdf: updatedPdf, requestId }, { headers });
  } catch (error) {
    console.error("Error updating PDF:", error);
    return NextResponse.json(
      { error: "Failed to update PDF", requestId },
      { status: 500, headers }
    );
  }
}
