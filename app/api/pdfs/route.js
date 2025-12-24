import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getPresignedUploadUrl, generateS3Key } from "@/lib/s3";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";
import { z } from "zod";

// Security constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max
const ALLOWED_EXTENSIONS = ['.pdf'];
const ALLOWED_MIME_TYPE = 'application/pdf';
const MAX_FILENAME_LENGTH = 255;

const uploadSchema = z.object({
    fileName: z.string().min(1).max(MAX_FILENAME_LENGTH),
    fileSize: z.number().finite().positive().max(MAX_FILE_SIZE),
    useCaseId: z.string().min(1).max(50),
}).strict();

// POST - Generate presigned URL for PDF upload
export async function POST(request) {
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
            return NextResponse.json(
                { error: 'Forbidden', requestId },
                { status: 403, headers }
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
                { error: 'Rate limit exceeded', retryAt: rl.resetAt, requestId },
                { status: 429, headers }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found", requestId },
                { status: 404, headers }
            );
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body', requestId }, { status: 400, headers });
        }

        const validation = uploadSchema.safeParse(parsed.body);
        if (!validation.success) {
            return NextResponse.json({ error: 'Validation failed', requestId }, { status: 400, headers });
        }

        const { fileName, fileSize, useCaseId } = validation.data;

        // Validate file extension
        const fileExtension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            return NextResponse.json(
                { error: "Only PDF files are allowed", requestId },
                { status: 400, headers }
            );
        }

        // Sanitize filename to prevent path traversal
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
                { error: "Use case not found", requestId },
                { status: 404, headers }
            );
        }

        const s3Key = generateS3Key(user.id, useCaseId, sanitizedFileName);
        const uploadUrl = await getPresignedUploadUrl(s3Key, ALLOWED_MIME_TYPE);

        return NextResponse.json({ uploadUrl, s3Key, requestId }, { status: 200, headers });
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return NextResponse.json(
            { error: "Failed to generate upload URL", requestId },
            { status: 500, headers }
        );
    }
}