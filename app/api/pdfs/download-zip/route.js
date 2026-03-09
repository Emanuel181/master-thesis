/**
 * POST /api/pdfs/download-zip
 * ============================
 * Stream a zip archive containing the requested PDFs.
 *
 * Body: { pdfIds: string[] }
 * Auth: session + Bearer unlockToken (biometric)
 *
 * Streams PDF objects directly from S3 into an archiver zip so memory usage
 * stays low even for large batches. Maximum 200 files per request.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getS3ObjectStream } from "@/lib/s3-env";
import { verifyUnlockToken } from "@/lib/user-passkey";
import { isDemoRequest } from "@/lib/demo-mode";
import { rateLimit } from "@/lib/rate-limit";
import archiver from "archiver";
import { PassThrough } from "stream";

const MAX_FILES = 200;

export async function POST(request) {
    try {
        // ── Auth ──
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit zip downloads
        const rl = await rateLimit(session.user.id, { limit: 20, windowMs: 60 * 60 * 1000, keyPrefix: 'pdfs:download-zip' });
        if (!rl.allowed) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        // ── Biometric token ──
        const authHeader = request.headers.get("authorization") || "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (!token) {
            return NextResponse.json({ error: "Biometric authentication required" }, { status: 403 });
        }
        try {
            const { userId } = verifyUnlockToken(token);
            if (userId !== session.user.id) {
                return NextResponse.json({ error: "Token/user mismatch" }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: "Invalid biometric token" }, { status: 403 });
        }

        // ── Body ──
        const body = await request.json();
        const pdfIds = body?.pdfIds;
        if (!Array.isArray(pdfIds) || pdfIds.length === 0) {
            return NextResponse.json({ error: "pdfIds array is required" }, { status: 400 });
        }
        if (pdfIds.length > MAX_FILES) {
            return NextResponse.json({ error: `Maximum ${MAX_FILES} files per download` }, { status: 400 });
        }

        // ── Fetch PDFs owned by this user ──
        const pdfs = await prisma.pdf.findMany({
            where: {
                id: { in: pdfIds },
                useCase: { userId: session.user.id },
            },
            include: {
                useCase: { select: { name: true } },
                folder: { select: { name: true } },
            },
        });

        if (pdfs.length === 0) {
            return NextResponse.json({ error: "No PDFs found" }, { status: 404 });
        }

        const env = isDemoRequest(request) ? "demo" : "prod";

        // ── Stream zip ──
        const passthrough = new PassThrough();
        const archive = archiver("zip", { zlib: { level: 5 } });

        archive.on("error", (err) => {
            console.error("[download-zip] archiver error:", err);
            passthrough.destroy(err);
        });

        archive.pipe(passthrough);

        // Add each PDF to the archive with folder structure:
        // <UseCaseName>/<FolderName>/<filename.pdf>
        const usedNames = new Set();
        for (const pdf of pdfs) {
            try {
                const stream = await getS3ObjectStream(env, pdf.s3Key);
                const ucName = (pdf.useCase?.name || "Unknown").replace(/[/\\:*?"<>|]/g, "_");
                const folderName = pdf.folder?.name ? pdf.folder.name.replace(/[/\\:*?"<>|]/g, "_") : "";
                let name = (pdf.title || pdf.originalName || "document.pdf").replace(/[/\\:*?"<>|]/g, "_");

                // Build path
                let path = folderName ? `${ucName}/${folderName}/${name}` : `${ucName}/${name}`;

                // Deduplicate
                let counter = 1;
                while (usedNames.has(path.toLowerCase())) {
                    const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
                    const base = ext ? name.slice(0, -ext.length) : name;
                    const dedupName = `${base} (${counter})${ext}`;
                    path = folderName ? `${ucName}/${folderName}/${dedupName}` : `${ucName}/${dedupName}`;
                    counter++;
                }
                usedNames.add(path.toLowerCase());

                archive.append(stream, { name: path });
            } catch (err) {
                console.error(`[download-zip] Failed to stream PDF ${pdf.id}:`, err.message);
                // Skip failed files, don't abort entire zip
            }
        }

        archive.finalize();

        // Convert Node PassThrough to Web ReadableStream
        const readable = new ReadableStream({
            start(controller) {
                passthrough.on("data", (chunk) => controller.enqueue(chunk));
                passthrough.on("end", () => controller.close());
                passthrough.on("error", (err) => controller.error(err));
            },
        });

        const rawName = pdfs.length === 1
            ? (pdfs[0].title || pdfs[0].originalName || "document").replace(/\.pdf$/i, "") + ".zip"
            : "knowledge-base-documents.zip";

        // Sanitize filename: strip quotes, newlines, and non-ASCII to prevent header injection
        const zipName = rawName
            .replace(/["\r\n\\]/g, "")
            .replace(/[^\x20-\x7E]/g, "_")
            .slice(0, 200) || "documents.zip";

        return new Response(readable, {
            status: 200,
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${zipName}"`,
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("[download-zip] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

