/**
 * Vectorization Utility
 * ======================
 *
 * Manages document vectorization in AWS Bedrock Knowledge Base.
 * Every uploaded PDF must be vectorized so it can be used by LLMs via RAG.
 *
 * **Per-User Isolation**: Each user gets their own Bedrock data source within
 * the shared Knowledge Base. This ensures that ingestion jobs only process
 * that user's S3 prefix (`users/{userId}/`), providing complete vector isolation.
 *
 * Flow:
 * 1. PDF uploaded to S3 → saved in DB with embeddingStatus="pending"
 * 2. triggerVectorization(pdfId, userId) resolves the user's data source
 *    (creating one if needed via getOrCreateUserDataSource)
 * 3. StartIngestionJobCommand starts a Bedrock ingestion job on the user's data source
 * 4. pollIngestionJob() polls Bedrock until the job completes
 * 5. On completion → sets vectorized=true, embeddingStatus="completed", vectorizedAt=now
 * 6. On failure   → sets embeddingStatus="failed"
 *
 * The vectorized documents are then retrieved via RAG queries during security review.
 */

import {
    BedrockAgentClient,
    StartIngestionJobCommand,
    GetIngestionJobCommand,
} from '@aws-sdk/client-bedrock-agent';
import prisma from '@/lib/prisma';
import { getOrCreateUserDataSource } from '@/lib/bedrock-datasource';
import { createFileNotification, NOTIFICATION_TYPES } from '@/lib/notifications';

const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
};

const bedrockAgentClient = new BedrockAgentClient(awsConfig);

// Polling configuration
const POLL_INTERVAL_MS = 5_000;   // 5 seconds between polls
const MAX_POLL_DURATION_MS = 10 * 60_000; // give up after 10 minutes

/**
 * Poll a Bedrock ingestion job until it reaches a terminal state.
 *
 * @param {string} knowledgeBaseId
 * @param {string} dataSourceId
 * @param {string} ingestionJobId
 * @returns {Promise<'COMPLETE' | 'FAILED' | 'STOPPED'>}
 */
async function pollIngestionJob(knowledgeBaseId, dataSourceId, ingestionJobId) {
    const deadline = Date.now() + MAX_POLL_DURATION_MS;

    while (Date.now() < deadline) {
        try {
            const command = new GetIngestionJobCommand({
                knowledgeBaseId,
                dataSourceId,
                ingestionJobId,
            });

            const response = await bedrockAgentClient.send(command);
            const status = response.ingestionJob?.status;

            console.log(`[vectorization] Ingestion job ${ingestionJobId} status: ${status}`);

            // Terminal states
            if (status === 'COMPLETE') return 'COMPLETE';
            if (status === 'FAILED')   return 'FAILED';
            if (status === 'STOPPED')  return 'STOPPED';

            // Non-terminal → wait and retry
        } catch (err) {
            console.error(`[vectorization] Error polling ingestion job ${ingestionJobId}:`, err.message);
            // Network blip — keep trying until deadline
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    console.warn(`[vectorization] Ingestion job ${ingestionJobId} polling timed out after ${MAX_POLL_DURATION_MS / 1000}s`);
    return 'FAILED'; // treat timeout as failure
}

/**
 * Mark one or more PDFs as successfully vectorized in the database.
 */
async function markCompleted(pdfIds) {
    await prisma.pdf.updateMany({
        where: { id: { in: Array.isArray(pdfIds) ? pdfIds : [pdfIds] } },
        data: {
            vectorized: true,
            embeddingStatus: 'completed',
            vectorizedAt: new Date(),
        },
    });
}

/**
 * Mark one or more PDFs as failed in the database.
 */
async function markFailed(pdfIds) {
    await prisma.pdf.updateMany({
        where: { id: { in: Array.isArray(pdfIds) ? pdfIds : [pdfIds] } },
        data: { embeddingStatus: 'failed' },
    }).catch(dbErr => console.error('[vectorization] Failed to update status:', dbErr));
}

/**
 * Resolve the data source ID for a given user.
 *
 * Uses the per-user data source (creating one if needed). Falls back to
 * the global BEDROCK_DATA_SOURCE_ID env var for backwards compatibility.
 *
 * @param {string} userId - The user's database ID
 * @returns {Promise<string>} - The Bedrock data source ID
 */
async function resolveDataSourceId(userId) {
    if (userId) {
        try {
            return await getOrCreateUserDataSource(userId);
        } catch (err) {
            console.warn(`[vectorization] Failed to get/create per-user data source for user ${userId}:`, err.message);
            // Fall through to global fallback
        }
    }

    const globalDs = process.env.BEDROCK_DATA_SOURCE_ID;
    if (!globalDs) {
        throw new Error('No data source available: per-user creation failed and BEDROCK_DATA_SOURCE_ID not configured');
    }
    console.warn('[vectorization] Falling back to global BEDROCK_DATA_SOURCE_ID');
    return globalDs;
}

/**
 * Resolve the userId that owns a PDF (via useCase → user chain).
 *
 * @param {string} pdfId
 * @returns {Promise<string|null>}
 */
async function resolveUserIdFromPdf(pdfId) {
    const pdf = await prisma.pdf.findUnique({
        where: { id: pdfId },
        select: {
            useCase: {
                select: { userId: true },
            },
        },
    });
    return pdf?.useCase?.userId || null;
}

/**
 * Trigger vectorization for a single PDF document.
 *
 * Starts a Bedrock Knowledge Base ingestion job on the user's own data source,
 * then polls in the background until it completes. The returned promise resolves
 * as soon as the ingestion job is *started*; the background poll updates the DB
 * when the job finishes.
 *
 * @param {string} pdfId - The database ID of the PDF to vectorize
 * @param {string} [userId] - The owning user's ID (resolved from DB if not provided)
 * @param {string} [fileName] - Original file name for notifications
 * @returns {Promise<{ingestionJobId: string} | null>}
 */
export async function triggerVectorization(pdfId, userId, fileName) {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;

    if (!knowledgeBaseId) {
        console.warn('[vectorization] BEDROCK_KNOWLEDGE_BASE_ID not configured — skipping vectorization');
        return null;
    }

    try {
        // Resolve the user who owns this PDF (needed for per-user data source)
        const resolvedUserId = userId || await resolveUserIdFromPdf(pdfId);
        const dataSourceId = await resolveDataSourceId(resolvedUserId);

        // Resolve fileName from DB if not provided
        let resolvedFileName = fileName;
        if (!resolvedFileName) {
            const pdf = await prisma.pdf.findUnique({ where: { id: pdfId }, select: { title: true } });
            resolvedFileName = pdf?.title || 'Document';
        }

        // Mark document as processing
        await prisma.pdf.update({
            where: { id: pdfId },
            data: { embeddingStatus: 'processing' },
        });

        // Notify user that vectorization started
        await createFileNotification({
            userId: resolvedUserId,
            type: NOTIFICATION_TYPES.VECTORIZATION_STARTED,
            fileName: resolvedFileName,
            pdfId,
        });

        console.log(`[vectorization] Starting ingestion job for PDF ${pdfId} (user: ${resolvedUserId}, dataSource: ${dataSourceId})`);

        const command = new StartIngestionJobCommand({ knowledgeBaseId, dataSourceId });
        const response = await bedrockAgentClient.send(command);
        const ingestionJobId = response.ingestionJob?.ingestionJobId;

        console.log(`[vectorization] Ingestion job started: ${ingestionJobId} for PDF ${pdfId}`);

        // Save the data source reference on the PDF
        await prisma.pdf.update({
            where: { id: pdfId },
            data: { bedrockDataSourceId: dataSourceId },
        });

        // Poll in the background — don't block the caller
        pollIngestionJob(knowledgeBaseId, dataSourceId, ingestionJobId)
            .then(async (terminalStatus) => {
                if (terminalStatus === 'COMPLETE') {
                    await markCompleted(pdfId);
                    console.log(`[vectorization] PDF ${pdfId} vectorized successfully`);
                    await createFileNotification({
                        userId: resolvedUserId,
                        type: NOTIFICATION_TYPES.VECTORIZATION_COMPLETED,
                        fileName: resolvedFileName,
                        pdfId,
                    });
                } else {
                    await markFailed(pdfId);
                    console.error(`[vectorization] PDF ${pdfId} vectorization ended with status: ${terminalStatus}`);
                    await createFileNotification({
                        userId: resolvedUserId,
                        type: NOTIFICATION_TYPES.VECTORIZATION_FAILED,
                        fileName: resolvedFileName,
                        pdfId,
                    });
                }
            })
            .catch(async (err) => {
                console.error(`[vectorization] Background poll error for PDF ${pdfId}:`, err);
                await markFailed(pdfId);
                await createFileNotification({
                    userId: resolvedUserId,
                    type: NOTIFICATION_TYPES.VECTORIZATION_FAILED,
                    fileName: resolvedFileName,
                    pdfId,
                });
            });

        return { ingestionJobId };
    } catch (error) {
        console.error(`[vectorization] Failed to start vectorization for PDF ${pdfId}:`, error);
        await markFailed(pdfId);
        throw error;
    }
}

/**
 * Trigger vectorization for multiple PDF documents at once.
 * Uses a single ingestion job on the user's own data source.
 *
 * @param {string[]} pdfIds - Array of PDF database IDs to vectorize
 * @param {string} [userId] - The owning user's ID (resolved from first PDF if not provided)
 * @returns {Promise<{ingestionJobId: string, count: number} | null>}
 */
export async function triggerBulkVectorization(pdfIds, userId) {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;

    if (!knowledgeBaseId) {
        console.warn('[vectorization] BEDROCK_KNOWLEDGE_BASE_ID not configured — skipping vectorization');
        return null;
    }

    if (!pdfIds || pdfIds.length === 0) return null;

    try {
        // Resolve the user who owns these PDFs
        const resolvedUserId = userId || await resolveUserIdFromPdf(pdfIds[0]);
        const dataSourceId = await resolveDataSourceId(resolvedUserId);

        await prisma.pdf.updateMany({
            where: { id: { in: pdfIds } },
            data: { embeddingStatus: 'processing' },
        });

        console.log(`[vectorization] Starting bulk ingestion job for ${pdfIds.length} PDFs (user: ${resolvedUserId}, dataSource: ${dataSourceId})`);

        const command = new StartIngestionJobCommand({ knowledgeBaseId, dataSourceId });
        const response = await bedrockAgentClient.send(command);
        const ingestionJobId = response.ingestionJob?.ingestionJobId;

        console.log(`[vectorization] Bulk ingestion job started: ${ingestionJobId}`);

        // Poll in the background
        pollIngestionJob(knowledgeBaseId, dataSourceId, ingestionJobId)
            .then(async (terminalStatus) => {
                if (terminalStatus === 'COMPLETE') {
                    await markCompleted(pdfIds);
                    console.log(`[vectorization] ${pdfIds.length} PDFs vectorized successfully`);
                } else {
                    await markFailed(pdfIds);
                    console.error(`[vectorization] Bulk vectorization ended with status: ${terminalStatus}`);
                }
            })
            .catch(async (err) => {
                console.error('[vectorization] Background bulk poll error:', err);
                await markFailed(pdfIds);
            });

        return { ingestionJobId, count: pdfIds.length };
    } catch (error) {
        console.error('[vectorization] Failed to start bulk vectorization:', error);
        await markFailed(pdfIds);
        throw error;
    }
}

/**
 * Synchronous version: start ingestion AND wait for it to finish.
 * Use this when the caller MUST have vectorized documents before continuing
 * (e.g. workflow/start needs documents ready before the Lambda runs).
 *
 * If Bedrock Knowledge Base is not configured, returns a skip result
 * instead of throwing, allowing the workflow to proceed without RAG.
 *
 * @param {string[]} pdfIds
 * @param {string} [userId] - The owning user's ID (resolved from first PDF if not provided)
 * @returns {Promise<{status: string, ingestionJobId?: string, skipped?: boolean}>}
 */
export async function vectorizeAndWait(pdfIds, userId) {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;

    if (!knowledgeBaseId) {
        console.warn(
            '[vectorization] BEDROCK_KNOWLEDGE_BASE_ID not configured. ' +
            'Skipping vectorization — documents will be used as raw context without RAG vector search.'
        );
        return { status: 'skipped', skipped: true };
    }

    if (!pdfIds || pdfIds.length === 0) {
        throw new Error('No PDF IDs provided for vectorization');
    }

    // Resolve user-specific data source
    let dataSourceId;
    try {
        const resolvedUserId = userId || await resolveUserIdFromPdf(pdfIds[0]);
        dataSourceId = await resolveDataSourceId(resolvedUserId);
    } catch (err) {
        console.warn('[vectorization] Could not resolve per-user data source, skipping:', err.message);
        return { status: 'skipped', skipped: true };
    }

    // Mark processing
    await prisma.pdf.updateMany({
        where: { id: { in: pdfIds } },
        data: { embeddingStatus: 'processing' },
    });

    console.log(`[vectorization] Starting ingestion (blocking) for ${pdfIds.length} PDFs (dataSource: ${dataSourceId})`);

    const command = new StartIngestionJobCommand({ knowledgeBaseId, dataSourceId });
    const response = await bedrockAgentClient.send(command);
    const ingestionJobId = response.ingestionJob?.ingestionJobId;

    console.log(`[vectorization] Ingestion job ${ingestionJobId} started — waiting for completion...`);

    const terminalStatus = await pollIngestionJob(knowledgeBaseId, dataSourceId, ingestionJobId);

    if (terminalStatus === 'COMPLETE') {
        await markCompleted(pdfIds);
        console.log(`[vectorization] ${pdfIds.length} PDFs vectorized successfully (blocking)`);
        return { status: 'completed', ingestionJobId };
    }

    await markFailed(pdfIds);
    throw new Error(`Vectorization ended with status: ${terminalStatus}`);
}

/**
 * Check the vectorization readiness of specific documents.
 *
 * @param {string[]} pdfIds
 * @returns {Promise<{ready: object[], notReady: object[]}>}
 */
export async function getVectorizationReadiness(pdfIds) {
    const pdfs = await prisma.pdf.findMany({
        where: { id: { in: pdfIds } },
        select: {
            id: true,
            title: true,
            vectorized: true,
            embeddingStatus: true,
            s3Key: true,
        },
    });

    const ready = pdfs.filter(p => p.vectorized && p.embeddingStatus === 'completed');
    const notReady = pdfs.filter(p => !p.vectorized || p.embeddingStatus !== 'completed');

    return { ready, notReady };
}
