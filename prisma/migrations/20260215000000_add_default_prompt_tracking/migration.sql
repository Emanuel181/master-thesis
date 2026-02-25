-- Add default prompt tracking fields to Prompt table
-- This migration adds fields to track which prompts are default prompts
-- and allows resetting them to their original content

-- Add isDefault column (defaults to false for existing prompts)
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Add defaultKey column (nullable, used to identify which default prompt this is)
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "defaultKey" TEXT;

-- Add index for querying default prompts efficiently
CREATE INDEX IF NOT EXISTS "Prompt_userId_isDefault_idx" ON "Prompt"("userId", "isDefault");

