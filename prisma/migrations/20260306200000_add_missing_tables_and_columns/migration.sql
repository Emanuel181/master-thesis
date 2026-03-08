-- Migration: Add all missing tables, columns, indexes, and foreign keys
-- This migration brings the database in sync with the Prisma schema.
-- All statements use IF NOT EXISTS / IF NOT EXISTS for idempotency.

-- ============================================================
-- 1. Enums
-- ============================================================
DO $$ BEGIN
    CREATE TYPE "FixStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'APPLIED', 'PR_CREATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- 2. Alter existing tables – add missing columns
-- ============================================================

-- User: add bedrockDataSourceId
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bedrockDataSourceId" TEXT;

-- Pdf: add RAG and vectorization columns
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "vectorized" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "vectorizedAt" TIMESTAMP(3);
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "bedrockDataSourceId" TEXT;
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "embeddingStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "chunkCount" INTEGER NOT NULL DEFAULT 0;

-- Pdf: virus scan columns (may already exist from 20260224 migration)
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScanStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScannedAt" TIMESTAMP(3);
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScanId" TEXT;

-- Prompt: add default tracking columns (may already exist from 20260215 migration)
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Prompt" ADD COLUMN IF NOT EXISTS "defaultKey" TEXT;

-- ============================================================
-- 3. Create new tables
-- ============================================================

-- WorkflowRun
CREATE TABLE IF NOT EXISTS "WorkflowRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sfnExecutionArn" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalUseCases" INTEGER NOT NULL DEFAULT 0,
    "completedUseCases" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "pdfPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- WorkflowUseCaseRun
CREATE TABLE IF NOT EXISTS "WorkflowUseCaseRun" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "useCaseTitle" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewerCompleted" BOOLEAN NOT NULL DEFAULT false,
    "implementerCompleted" BOOLEAN NOT NULL DEFAULT false,
    "testerCompleted" BOOLEAN NOT NULL DEFAULT false,
    "reporterCompleted" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowUseCaseRun_pkey" PRIMARY KEY ("id")
);

-- Vulnerability
CREATE TABLE IF NOT EXISTS "Vulnerability" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "useCaseId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "vulnerableCode" TEXT,
    "explanation" TEXT,
    "bestPractices" TEXT,
    "exploitExamples" TEXT,
    "attackPath" TEXT,
    "cweId" TEXT,
    "documentReferences" JSONB,
    "dataFlow" JSONB,
    "cvssAnalysis" JSONB,
    "debateLog" JSONB,
    "lineNumber" INTEGER,
    "columnNumber" INTEGER,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "falsePositive" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- DebateRound
CREATE TABLE IF NOT EXISTS "DebateRound" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT NOT NULL,
    "vulnerabilityId" TEXT,
    "round" INTEGER NOT NULL DEFAULT 1,
    "agentRole" TEXT NOT NULL,
    "modelId" TEXT,
    "argument" TEXT NOT NULL,
    "verdict" TEXT,
    "confidence" DOUBLE PRECISION,
    "citations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebateRound_pkey" PRIMARY KEY ("id")
);

-- CodeFix
CREATE TABLE IF NOT EXISTS "CodeFix" (
    "id" TEXT NOT NULL,
    "vulnerabilityId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalCode" TEXT NOT NULL,
    "startLine" INTEGER,
    "endLine" INTEGER,
    "language" TEXT,
    "fixedCode" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "FixStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "prUrl" TEXT,
    "prNumber" INTEGER,
    "branchName" TEXT,
    "commitSha" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeFix_pkey" PRIMARY KEY ("id")
);

-- AgentConfiguration
CREATE TABLE IF NOT EXISTS "AgentConfiguration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" TEXT NOT NULL,
    "modelId" TEXT,
    "customPrompt" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfiguration_pkey" PRIMARY KEY ("id")
);

-- ApiKey
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- MfaConfig
CREATE TABLE IF NOT EXISTS "MfaConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "method" TEXT NOT NULL DEFAULT 'totp',
    "totpSecret" TEXT,
    "backupCodes" TEXT,
    "phoneNumber" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MfaConfig_pkey" PRIMARY KEY ("id")
);

-- UserPasskey
CREATE TABLE IF NOT EXISTS "UserPasskey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "webauthnUserId" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT,
    "aaguid" TEXT,
    "deviceName" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPasskey_pkey" PRIMARY KEY ("id")
);

-- UserPasskeyChallenge
CREATE TABLE IF NOT EXISTS "UserPasskeyChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPasskeyChallenge_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- 4. Indexes (idempotent – CREATE INDEX IF NOT EXISTS)
-- ============================================================

-- Pdf indexes
CREATE INDEX IF NOT EXISTS "Pdf_vectorized_idx" ON "Pdf"("vectorized");
CREATE INDEX IF NOT EXISTS "Pdf_embeddingStatus_idx" ON "Pdf"("embeddingStatus");
CREATE INDEX IF NOT EXISTS "Pdf_virusScanStatus_idx" ON "Pdf"("virusScanStatus");

-- Prompt indexes
CREATE INDEX IF NOT EXISTS "Prompt_userId_isDefault_idx" ON "Prompt"("userId", "isDefault");

-- WorkflowRun indexes
CREATE INDEX IF NOT EXISTS "WorkflowRun_userId_idx" ON "WorkflowRun"("userId");
CREATE INDEX IF NOT EXISTS "WorkflowRun_status_idx" ON "WorkflowRun"("status");
CREATE INDEX IF NOT EXISTS "WorkflowRun_startedAt_idx" ON "WorkflowRun"("startedAt");

-- WorkflowUseCaseRun indexes
CREATE INDEX IF NOT EXISTS "WorkflowUseCaseRun_workflowRunId_idx" ON "WorkflowUseCaseRun"("workflowRunId");
CREATE INDEX IF NOT EXISTS "WorkflowUseCaseRun_useCaseId_idx" ON "WorkflowUseCaseRun"("useCaseId");
CREATE INDEX IF NOT EXISTS "WorkflowUseCaseRun_status_idx" ON "WorkflowUseCaseRun"("status");

-- Vulnerability indexes
CREATE INDEX IF NOT EXISTS "Vulnerability_workflowRunId_idx" ON "Vulnerability"("workflowRunId");
CREATE INDEX IF NOT EXISTS "Vulnerability_useCaseId_idx" ON "Vulnerability"("useCaseId");
CREATE INDEX IF NOT EXISTS "Vulnerability_severity_idx" ON "Vulnerability"("severity");
CREATE INDEX IF NOT EXISTS "Vulnerability_resolved_idx" ON "Vulnerability"("resolved");
CREATE INDEX IF NOT EXISTS "Vulnerability_createdAt_idx" ON "Vulnerability"("createdAt");

-- DebateRound indexes
CREATE INDEX IF NOT EXISTS "DebateRound_workflowRunId_idx" ON "DebateRound"("workflowRunId");
CREATE INDEX IF NOT EXISTS "DebateRound_vulnerabilityId_idx" ON "DebateRound"("vulnerabilityId");

-- CodeFix indexes
CREATE INDEX IF NOT EXISTS "CodeFix_vulnerabilityId_idx" ON "CodeFix"("vulnerabilityId");
CREATE INDEX IF NOT EXISTS "CodeFix_status_idx" ON "CodeFix"("status");
CREATE INDEX IF NOT EXISTS "CodeFix_fileName_idx" ON "CodeFix"("fileName");

-- AgentConfiguration indexes
CREATE INDEX IF NOT EXISTS "AgentConfiguration_userId_idx" ON "AgentConfiguration"("userId");
CREATE INDEX IF NOT EXISTS "AgentConfiguration_agentType_idx" ON "AgentConfiguration"("agentType");
CREATE UNIQUE INDEX IF NOT EXISTS "AgentConfiguration_userId_agentType_key" ON "AgentConfiguration"("userId", "agentType");

-- ApiKey indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");
CREATE INDEX IF NOT EXISTS "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- MfaConfig indexes
CREATE UNIQUE INDEX IF NOT EXISTS "MfaConfig_userId_key" ON "MfaConfig"("userId");
CREATE INDEX IF NOT EXISTS "MfaConfig_userId_idx" ON "MfaConfig"("userId");

-- UserPasskey indexes
CREATE UNIQUE INDEX IF NOT EXISTS "UserPasskey_credentialId_key" ON "UserPasskey"("credentialId");
CREATE INDEX IF NOT EXISTS "UserPasskey_userId_idx" ON "UserPasskey"("userId");
CREATE INDEX IF NOT EXISTS "UserPasskey_credentialId_idx" ON "UserPasskey"("credentialId");

-- UserPasskeyChallenge indexes
CREATE INDEX IF NOT EXISTS "UserPasskeyChallenge_userId_idx" ON "UserPasskeyChallenge"("userId");
CREATE INDEX IF NOT EXISTS "UserPasskeyChallenge_expiresAt_idx" ON "UserPasskeyChallenge"("expiresAt");

-- ============================================================
-- 5. Foreign keys (use DO blocks to skip if already exists)
-- ============================================================

-- WorkflowUseCaseRun -> WorkflowRun
DO $$ BEGIN
    ALTER TABLE "WorkflowUseCaseRun" ADD CONSTRAINT "WorkflowUseCaseRun_workflowRunId_fkey"
        FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vulnerability -> WorkflowRun
DO $$ BEGIN
    ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_workflowRunId_fkey"
        FOREIGN KEY ("workflowRunId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CodeFix -> Vulnerability
DO $$ BEGIN
    ALTER TABLE "CodeFix" ADD CONSTRAINT "CodeFix_vulnerabilityId_fkey"
        FOREIGN KEY ("vulnerabilityId") REFERENCES "Vulnerability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ApiKey -> User
DO $$ BEGIN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- MfaConfig -> User
DO $$ BEGIN
    ALTER TABLE "MfaConfig" ADD CONSTRAINT "MfaConfig_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- UserPasskey -> User
DO $$ BEGIN
    ALTER TABLE "UserPasskey" ADD CONSTRAINT "UserPasskey_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

