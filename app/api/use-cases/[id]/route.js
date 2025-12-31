import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";
import { auth } from "@/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { requireProductionMode } from "@/lib/api-middleware";

// Normalize text to prevent XSS - defense-in-depth
const normalizeText = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[\0\x08\x1a\x0b\x0c]/g, '').trim();
};

// Input validation schema for updates with XSS protection
const updateUseCaseSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters')
        .transform(normalizeText)
        .refine(v => !/[<>]/.test(v), { message: 'Title must not contain < or >' })
        .optional(),
    content: z.string()
        .max(10000, 'Content must be less than 10000 characters')
        .transform(normalizeText)
        .optional(),
    icon: z.string().max(50).optional(),
});

// GET - Fetch a single use case
export async function GET(request, { params }) {
  const demoBlock = requireProductionMode(request);
  if (demoBlock) return demoBlock;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders }
      );
    }

    // Rate limiting - 60 requests per minute
    const rl = await rateLimit({
      key: `use-cases:get:${session.user.id}`,
      limit: 60,
      windowMs: 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: securityHeaders }
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
        { status: 404, headers: securityHeaders }
      );
    }

    return NextResponse.json({ useCase }, { headers: securityHeaders });
  } catch (error) {
    console.error("Error fetching use case:", error);
    return NextResponse.json(
      { error: "Failed to fetch use case" },
      { status: 500, headers: securityHeaders }
    );
  }
}

// PUT - Update a use case
export async function PUT(request, { params }) {
  const demoBlock = requireProductionMode(request);
  if (demoBlock) return demoBlock;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders }
      );
    }

    // CSRF protection for state-changing operations
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Rate limiting - 20 updates per hour
    const rl = await rateLimit({
      key: `use-cases:update:${session.user.id}`,
      limit: 20,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: securityHeaders }
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
        { status: 404, headers: securityHeaders }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
    }

    // Validate input with Zod
    const validationResult = updateUseCaseSchema.safeParse(parsed.body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed" },
        { status: 400, headers: securityHeaders }
      );
    }

    const { title, content, icon } = validationResult.data;

    const updatedUseCase = await prisma.knowledgeBaseCategory.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(icon && { icon }),
      },
    });

    return NextResponse.json({ useCase: updatedUseCase }, { headers: securityHeaders });
  } catch (error) {
    console.error("Error updating use case:", error);
    return NextResponse.json(
      { error: "Failed to update use case" },
      { status: 500, headers: securityHeaders }
    );
  }
}

// DELETE - Delete a use case and its associated PDFs from S3
export async function DELETE(request, { params }) {
  const demoBlock = requireProductionMode(request);
  if (demoBlock) return demoBlock;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: securityHeaders }
      );
    }

    // CSRF protection for state-changing operations
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: securityHeaders }
      );
    }

    // Rate limiting - 10 deletes per hour
    const rl = await rateLimit({
      key: `use-cases:delete:${session.user.id}`,
      limit: 10,
      windowMs: 60 * 60 * 1000
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAt: rl.resetAt },
        { status: 429, headers: securityHeaders }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: securityHeaders }
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
        { status: 404, headers: securityHeaders }
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

    return NextResponse.json({ message: "Use case deleted successfully" }, { headers: securityHeaders });
  } catch (error) {
    console.error("Error deleting use case:", error);
    return NextResponse.json(
      { error: "Failed to delete use case" },
      { status: 500, headers: securityHeaders }
    );
  }
}
