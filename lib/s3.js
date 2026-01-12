import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "amz-s3-pdfs-gp";

// Maximum key length to prevent DoS via extremely long keys
const MAX_KEY_LENGTH = 1024;

/**
 * Validate S3 key to prevent path traversal and injection attacks
 * @param {string} key - The S3 object key to validate
 * @throws {Error} If key is invalid
 */
function validateS3Key(key) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new Error('S3 key must be a non-empty string');
  }
  if (key.length > MAX_KEY_LENGTH) {
    throw new Error(`S3 key exceeds maximum length of ${MAX_KEY_LENGTH}`);
  }
  // Prevent path traversal attacks
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) {
    throw new Error('Invalid S3 key: path traversal not allowed');
  }
  // Only allow safe characters
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(key)) {
    throw new Error('Invalid S3 key: contains disallowed characters');
  }
}

/**
 * Generate a presigned URL for uploading a file to S3
 * @param {string} key - The S3 object key (file path)
 * @param {string} contentType - The content type of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600, max: 7 days)
 * @returns {Promise<string>} - The presigned URL
 */
export async function getPresignedUploadUrl(key, contentType = "application/pdf", expiresIn = 3600) {
  validateS3Key(key);
  
  // Cap expiration to 7 days (AWS maximum for presigned URLs)
  const safeExpiresIn = Math.min(Math.max(60, expiresIn), 604800);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: safeExpiresIn });
}

/**
 * Generate a presigned URL for downloading/viewing a file from S3
 * @param {string} key - The S3 object key (file path)
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600, max: 7 days)
 * @returns {Promise<string>} - The presigned URL
 */
export async function getPresignedDownloadUrl(key, expiresIn = 3600) {
  validateS3Key(key);
  
  // Cap expiration to 7 days (AWS maximum for presigned URLs)
  const safeExpiresIn = Math.min(Math.max(60, expiresIn), 604800);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: safeExpiresIn });
}

/**
 * Delete a file from S3
 * @param {string} key - The S3 object key (file path)
 */
export async function deleteFromS3(key) {
  validateS3Key(key);
  
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate a unique S3 key for a PDF file
 * @param {string} userId - The user's ID
 * @param {string} useCaseId - The use case ID
 * @param {string} fileName - The original file name
 * @returns {string} - The S3 key
 */
export function generateS3Key(userId, useCaseId, fileName) {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `users/${userId}/use-cases/${useCaseId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Upload text content to S3
 * @param {string} key - The S3 object key
 * @param {string} text - The text content to upload
 * @returns {Promise<void>}
 */
export async function uploadTextToS3(key, text) {
  validateS3Key(key);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: text,
    ContentType: "text/plain",
  });

  await s3Client.send(command);
}

/**
 * Download text content from S3
 * @param {string} key - The S3 object key
 * @returns {Promise<string>} - The text content
 */
export async function downloadTextFromS3(key) {
  validateS3Key(key);
  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  const text = await response.Body.transformToString();
  return text;
}

/**
 * Generate a unique S3 key for a prompt
 * @param {string} userId - The user's ID
 * @param {string} agent - The agent type
 * @returns {string} - The S3 key
 */
export function generatePromptS3Key(userId, agent) {
  const timestamp = Date.now();
  return `users/${userId}/prompts/${agent}/${timestamp}.txt`;
}

export { s3Client, BUCKET_NAME };
