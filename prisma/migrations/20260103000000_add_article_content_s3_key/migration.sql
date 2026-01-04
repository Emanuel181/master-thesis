-- Add contentS3Key column to Article table
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "contentS3Key" TEXT;

