import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth"; // ⬅ NEW v5 session API

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

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                useCases: {
                    include: { pdfs: true },
                    orderBy: [{ createdAt: "desc" }],
                },
            },
        });


        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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

        return NextResponse.json({ useCases: transformedUseCases });
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
        const session = await auth(); // ⬅ replaces getServerSession

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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
