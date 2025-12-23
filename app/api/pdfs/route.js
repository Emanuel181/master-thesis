import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getPresignedUploadUrl, generateS3Key } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
const ALLOWED_EXTENSIONS = ['.pdf'];
const ALLOWED_MIME_TYPE = 'application/pdf';
const MAX_FILENAME_LENGTH = 255;

// POST - Generate presigned URL for PDF upload
export async function POST(request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Rate limiting - 30 uploads per hour
        const rl = rateLimit({
            key: `pdfs:upload:${session.user.id}`,
            limit: 30,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429 }
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
        const { fileName, fileSize, useCaseId } = body;

        if (!fileName || !fileSize || !useCaseId) {
            return NextResponse.json(
                { error: "fileName, fileSize, and useCaseId are required" },
                { status: 400 }
            );
        }

        // SECURITY: Validate filename length
        if (typeof fileName !== 'string' || fileName.length > MAX_FILENAME_LENGTH) {
            return NextResponse.json(
                { error: `Filename must be less than ${MAX_FILENAME_LENGTH} characters` },
                { status: 400 }
            );
        }

        // SECURITY: Validate file extension
        const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            return NextResponse.json(
                { error: "Only PDF files are allowed" },
                { status: 400 }
            );
        }

        // SECURITY: Validate file size
        if (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size must be between 1 byte and ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // SECURITY: Sanitize filename to prevent path traversal
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Verify the use case belongs to the user
        const useCase = await prisma.knowledgeBaseCategory.findFirst({
            where: {
                id: useCaseId,
                userId: user.id,
            },
        });

        if (!useCase) {
            return NextResponse.json(
                { error: "Use case not found" },
                { status: 404 }
            );
        }

        // Generate S3 key with sanitized filename
        const s3Key = generateS3Key(user.id, useCaseId, sanitizedFileName);

        // Generate presigned upload URL with content-type restriction
        const uploadUrl = await getPresignedUploadUrl(s3Key, ALLOWED_MIME_TYPE);

        return NextResponse.json({ uploadUrl, s3Key }, { status: 200 });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL" },
            { status: 500 }
        );
    }
}