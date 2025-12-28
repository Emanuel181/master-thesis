import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin, readJsonBody, securityHeaders } from "@/lib/api-security";

// Normalize text to prevent XSS - defense-in-depth
const normalizeText = (value) => {
    if (typeof value !== 'string') return value;
    // Remove control characters except newlines/tabs
    return value.replace(/[\0\x08\x1a\x0b\x0c]/g, '').trim();
};

// Input validation schema with XSS protection
const createUseCaseSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters')
        .transform(normalizeText)
        .refine(v => !/[<>]/.test(v), { message: 'Title must not contain < or >' }),
    content: z.string()
        .min(1, 'Content is required')
        .max(10000, 'Content must be less than 10000 characters')
        .transform(normalizeText),
    icon: z.string().max(50).optional(),
});

// Helper to format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper to truncate description
function truncateText(text, maxLength = 100) {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// Helper to truncate description by words
function truncateByWords(text, maxWords = 20) {
    if (!text) return null;
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}

// GET - Fetch all use cases for the current user
export async function GET() {
    try {
        const session = await auth(); // ⬅ replaces getServerSession

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: securityHeaders });
        }

        // Rate limiting - 60 requests per minute
        const rl = rateLimit({
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

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                useCases: {
                    include: { pdfs: true },
                    orderBy: [{ createdAt: "desc" }],
                },
            },
        });


        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401, headers: securityHeaders });
        }

        // Transform the response to include formatted data
        const transformedUseCases = user.useCases.map(uc => ({
            ...uc,
            fullContent: uc.content, // Keep full content for "Show More"
            shortContent: truncateText(uc.content, 100), // Character-based truncation
            shortDescription: truncateByWords(uc.content, 20), // Word-based truncation for cards
            pdfs: uc.pdfs.map(pdf => ({
                ...pdf,
                formattedSize: formatFileSize(pdf.size),
            })),
            pdfCount: uc.pdfs.length,
            totalSize: uc.pdfs.reduce((sum, pdf) => sum + (pdf.size || 0), 0),
            formattedTotalSize: formatFileSize(uc.pdfs.reduce((sum, pdf) => sum + (pdf.size || 0), 0)),
        }));

        return NextResponse.json({ useCases: transformedUseCases }, { headers: securityHeaders });
    } catch (error) {
        console.error("Error fetching use cases:", error);
        return NextResponse.json(
            { error: "Failed to fetch use cases" },
            { status: 500, headers: securityHeaders }
        );
    }
}

// POST - Create a new use case
export async function POST(request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: securityHeaders });
        }

        // CSRF protection for state-changing operations
        if (!isSameOrigin(request)) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403, headers: securityHeaders }
            );
        }

        // Rate limiting - 20 use cases per hour
        const rl = rateLimit({
            key: `use-cases:create:${session.user.id}`,
            limit: 20,
            windowMs: 60 * 60 * 1000
        });
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', retryAt: rl.resetAt },
                { status: 429, headers: securityHeaders }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404, headers: securityHeaders });
        }

        const parsed = await readJsonBody(request);
        if (!parsed.ok) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: securityHeaders });
        }

        // Validate input with Zod
        const validationResult = createUseCaseSchema.safeParse(parsed.body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Validation failed" },
                { status: 400, headers: securityHeaders }
            );
        }

        const { title, content, icon } = validationResult.data;

        const useCase = await prisma.knowledgeBaseCategory.create({
            data: {
                title,
                content,
                icon: icon || "File",
                userId: user.id,
            },
        });

        return NextResponse.json({ useCase }, { status: 201, headers: securityHeaders });
    } catch (error) {
        console.error("Error creating use case:", error);
        return NextResponse.json(
            { error: "Failed to create use case" },
            { status: 500, headers: securityHeaders }
        );
    }
}
