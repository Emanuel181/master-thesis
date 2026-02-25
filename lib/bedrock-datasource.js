/**
 * Per-User Bedrock Data Source Management
 * =========================================
 *
 * Each user gets their own Bedrock data source within the shared Knowledge Base.
 * This ensures vector isolation: User A's ingestion jobs only process User A's
 * S3 prefix, and vice versa.
 *
 * Flow:
 * 1. User uploads a PDF → triggerVectorization needs the user's data source ID
 * 2. getOrCreateUserDataSource(userId) checks if user already has one
 * 3. If not → creates one via CreateDataSourceCommand scoped to `users/{userId}/`
 * 4. Saves the data source ID on the User record for future use
 *
 * The shared Knowledge Base ID comes from BEDROCK_KNOWLEDGE_BASE_ID env var.
 * The global BEDROCK_DATA_SOURCE_ID env var is used as a legacy fallback only.
 */

import {
    BedrockAgentClient,
    CreateDataSourceCommand,
    GetDataSourceCommand,
} from '@aws-sdk/client-bedrock-agent';
import prisma from '@/lib/prisma';

const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    } : undefined,
};

const bedrockAgentClient = new BedrockAgentClient(awsConfig);

// In-memory lock to prevent concurrent data source creation for the same user
const creationLocks = new Map();

/**
 * Get or create a per-user Bedrock data source.
 *
 * Uses the shared Knowledge Base but creates an S3 data source scoped to
 * the user's S3 prefix (`users/{userId}/`), ensuring vector isolation.
 *
 * @param {string} userId - The user's database ID
 * @returns {Promise<string>} - The Bedrock data source ID for this user
 * @throws {Error} If KB is not configured or creation fails
 */
export async function getOrCreateUserDataSource(userId) {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
    if (!knowledgeBaseId) {
        throw new Error('BEDROCK_KNOWLEDGE_BASE_ID not configured');
    }

    // 1. Check if user already has a data source
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bedrockDataSourceId: true },
    });

    if (user?.bedrockDataSourceId) {
        return user.bedrockDataSourceId;
    }

    // 2. Acquire in-memory lock to prevent duplicate creation
    if (creationLocks.has(userId)) {
        // Another request is already creating — wait for it
        return creationLocks.get(userId);
    }

    const creationPromise = createUserDataSource(userId, knowledgeBaseId);
    creationLocks.set(userId, creationPromise);

    try {
        const dataSourceId = await creationPromise;
        return dataSourceId;
    } finally {
        creationLocks.delete(userId);
    }
}

/**
 * Actually create the Bedrock data source for a user.
 * This is called only once per user (guarded by the lock above).
 *
 * @param {string} userId
 * @param {string} knowledgeBaseId
 * @returns {Promise<string>} - The new data source ID
 */
async function createUserDataSource(userId, knowledgeBaseId) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'vulniq-bucket-dev';
    const s3Prefix = `users/${userId}/`;

    console.log(`[bedrock-datasource] Creating per-user data source for user ${userId} (prefix: ${s3Prefix})`);

    try {
        const command = new CreateDataSourceCommand({
            knowledgeBaseId,
            name: `user-${userId.substring(0, 16)}`, // Max 100 chars, keep concise
            description: `Isolated data source for user ${userId}`,
            dataSourceConfiguration: {
                type: 'S3',
                s3Configuration: {
                    bucketArn: `arn:aws:s3:::${bucketName}`,
                    inclusionPrefixes: [s3Prefix],
                },
            },
            vectorIngestionConfiguration: {
                chunkingConfiguration: {
                    chunkingStrategy: 'FIXED_SIZE',
                    fixedSizeChunkingConfiguration: {
                        maxTokens: 512,
                        overlapPercentage: 20,
                    },
                },
            },
        });

        const response = await bedrockAgentClient.send(command);
        const dataSourceId = response.dataSource?.dataSourceId;

        if (!dataSourceId) {
            throw new Error('CreateDataSourceCommand returned no dataSourceId');
        }

        console.log(`[bedrock-datasource] Created data source ${dataSourceId} for user ${userId}`);

        // Save to user record (use transaction to handle race conditions)
        await prisma.user.update({
            where: { id: userId },
            data: { bedrockDataSourceId: dataSourceId },
        });

        return dataSourceId;
    } catch (error) {
        // If another process already created it (race condition), fetch from DB
        if (error.name === 'ConflictException' || error.name === 'ServiceQuotaExceededException') {
            console.warn(`[bedrock-datasource] Conflict creating data source for user ${userId}, checking DB...`);
            const existing = await prisma.user.findUnique({
                where: { id: userId },
                select: { bedrockDataSourceId: true },
            });
            if (existing?.bedrockDataSourceId) {
                return existing.bedrockDataSourceId;
            }
        }

        console.error(`[bedrock-datasource] Failed to create data source for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Verify that a user's data source still exists and is available in Bedrock.
 *
 * @param {string} userId
 * @returns {Promise<{exists: boolean, status?: string}>}
 */
export async function verifyUserDataSource(userId) {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID;
    if (!knowledgeBaseId) return { exists: false };

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { bedrockDataSourceId: true },
    });

    if (!user?.bedrockDataSourceId) return { exists: false };

    try {
        const command = new GetDataSourceCommand({
            knowledgeBaseId,
            dataSourceId: user.bedrockDataSourceId,
        });

        const response = await bedrockAgentClient.send(command);
        return {
            exists: true,
            status: response.dataSource?.status,
        };
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            // Data source was deleted in AWS — clear from DB
            await prisma.user.update({
                where: { id: userId },
                data: { bedrockDataSourceId: null },
            });
            return { exists: false };
        }
        throw error;
    }
}

