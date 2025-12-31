/**
 * Environment-aware S3 client factory
 * =============================================================================
 * Ensures demo-mode cannot access production S3 buckets or prefixes.
 * 
 * ISOLATION PRINCIPLES:
 * 1. Demo uses a different bucket (DEMO_S3_BUCKET) OR a hard-separated prefix.
 * 2. All S3 key generation enforces required prefix for the environment.
 * 3. Prod-environment functions NEVER use demo bucket/prefix and vice-versa.
 * 
 * AWS IAM recommendations (applied outside this code):
 * - Demo ECS task role: s3:* limited to demo bucket or demo/* prefix in prod bucket
 * - Prod ECS task role: s3:* denied on demo bucket / prefix
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---------------------------------------------------------------------------
// Configuration – all values from environment; demo fallback to prod bucket
// ---------------------------------------------------------------------------

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const PROD_BUCKET = process.env.AWS_S3_BUCKET_NAME || "amz-s3-pdfs-gp";
const DEMO_BUCKET = process.env.DEMO_S3_BUCKET_NAME || PROD_BUCKET; // fallback: same bucket, prefix isolation

// Prefix enforcement: demo objects MUST start with this prefix if sharing a bucket
const DEMO_PREFIX = "demo/";
const PROD_PREFIX = "users/"; // prod objects live under users/

/**
 * @typedef {'prod' | 'demo'} Env
 */

// ---------------------------------------------------------------------------
// Client singletons (one per env to allow future credential separation)
// ---------------------------------------------------------------------------

/** @type {S3Client | null} */
let prodClient = null;
/** @type {S3Client | null} */
let demoClient = null;

function getProdS3Client() {
    if (!prodClient) {
        prodClient = new S3Client({
            region: AWS_REGION,
            credentials: process.env.AWS_ACCESS_KEY_ID
                ? {
                      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  }
                : undefined, // use default credential chain (IAM role)
        });
    }
    return prodClient;
}

function getDemoS3Client() {
    // Could point at different credentials in future; currently shares prod creds
    if (!demoClient) {
        demoClient = new S3Client({
            region: AWS_REGION,
            credentials: process.env.DEMO_AWS_ACCESS_KEY_ID
                ? {
                      accessKeyId: process.env.DEMO_AWS_ACCESS_KEY_ID,
                      secretAccessKey: process.env.DEMO_AWS_SECRET_ACCESS_KEY,
                  }
                : process.env.AWS_ACCESS_KEY_ID
                ? {
                      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                  }
                : undefined,
        });
    }
    return demoClient;
}

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

/**
 * Get bucket and client for the given environment
 * @param {Env} env
 */
export function getS3Config(env) {
    if (env === "demo") {
        return { client: getDemoS3Client(), bucket: DEMO_BUCKET, prefix: DEMO_PREFIX };
    }
    return { client: getProdS3Client(), bucket: PROD_BUCKET, prefix: PROD_PREFIX };
}

/**
 * Validate that a key starts with the required prefix for the environment.
 * Throws if the key violates prefix isolation.
 * @param {Env} env
 * @param {string} key
 */
export function assertKeyPrefix(env, key) {
    const { prefix } = getS3Config(env);
    if (!key.startsWith(prefix)) {
        throw new Error(
            `S3 key "${key.slice(0, 30)}..." does not start with required prefix "${prefix}" for env=${env}`
        );
    }
}

// ---------------------------------------------------------------------------
// Environment-aware operations (replacements for lib/s3.js exports)
// ---------------------------------------------------------------------------

/**
 * Generate presigned upload URL
 * @param {Env} env
 * @param {string} key
 * @param {string} contentType
 * @param {number} expiresIn
 */
export async function getPresignedUploadUrl(env, key, contentType = "application/pdf", expiresIn = 3600) {
    assertKeyPrefix(env, key);
    const { client, bucket } = getS3Config(env);
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
    return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate presigned download URL
 * @param {Env} env
 * @param {string} key
 * @param {number} expiresIn
 */
export async function getPresignedDownloadUrl(env, key, expiresIn = 3600) {
    assertKeyPrefix(env, key);
    const { client, bucket } = getS3Config(env);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete object from S3
 * @param {Env} env
 * @param {string} key
 */
export async function deleteFromS3(env, key) {
    assertKeyPrefix(env, key);
    const { client, bucket } = getS3Config(env);
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await client.send(command);
}

/**
 * Upload text to S3
 * @param {Env} env
 * @param {string} key
 * @param {string} text
 */
export async function uploadTextToS3(env, key, text) {
    assertKeyPrefix(env, key);
    const { client, bucket } = getS3Config(env);
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: text, ContentType: "text/plain" });
    await client.send(command);
}

/**
 * Download text from S3
 * @param {Env} env
 * @param {string} key
 */
export async function downloadTextFromS3(env, key) {
    assertKeyPrefix(env, key);
    const { client, bucket } = getS3Config(env);
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);
    return response.Body.transformToString();
}

// ---------------------------------------------------------------------------
// Key generators (now env-aware, prepend correct prefix)
// ---------------------------------------------------------------------------

/**
 * Generate S3 key for PDF
 * @param {Env} env
 * @param {string} userId
 * @param {string} useCaseId
 * @param {string} fileName
 */
export function generateS3Key(env, userId, useCaseId, fileName) {
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const { prefix } = getS3Config(env);
    // Note: prod prefix already is "users/", demo prefix is "demo/"
    if (env === "demo") {
        return `${prefix}users/${userId}/use-cases/${useCaseId}/${timestamp}-${sanitized}`;
    }
    return `${prefix}${userId}/use-cases/${useCaseId}/${timestamp}-${sanitized}`;
}

/**
 * Generate S3 key for prompt text
 * @param {Env} env
 * @param {string} userId
 * @param {string} agent
 */
export function generatePromptS3Key(env, userId, agent) {
    const timestamp = Date.now();
    const { prefix } = getS3Config(env);
    if (env === "demo") {
        return `${prefix}users/${userId}/prompts/${agent}/${timestamp}.txt`;
    }
    return `${prefix}${userId}/prompts/${agent}/${timestamp}.txt`;
}

/**
 * Generate profile image S3 key
 * @param {Env} env
 * @param {string} userId
 * @param {string} fileName
 * @param {string} ext
 */
export function generateProfileImageS3Key(env, userId, fileName, ext) {
    const timestamp = Date.now();
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_") || "image";
    const { prefix } = getS3Config(env);
    if (env === "demo") {
        return `${prefix}users/${userId}/profile-images/${timestamp}-${sanitized}.${ext}`;
    }
    return `${prefix}${userId}/profile-images/${timestamp}-${sanitized}.${ext}`;
}
