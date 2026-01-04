-- Add user warning fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastWarningAt" TIMESTAMP(3);

-- Create UserWarning table
CREATE TABLE IF NOT EXISTS "UserWarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "warnedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWarning_pkey" PRIMARY KEY ("id")
);

-- Create index on UserWarning.userId
CREATE INDEX IF NOT EXISTS "UserWarning_userId_idx" ON "UserWarning"("userId");

-- Add foreign key for UserWarning -> User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UserWarning_userId_fkey'
    ) THEN
        ALTER TABLE "UserWarning" ADD CONSTRAINT "UserWarning_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create BannedEmail table if not exists
CREATE TABLE IF NOT EXISTS "BannedEmail" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT,
    "bannedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedEmail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BannedEmail_email_key" ON "BannedEmail"("email");

-- Create BannedIP table if not exists
CREATE TABLE IF NOT EXISTS "BannedIP" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT,
    "bannedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedIP_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BannedIP_ip_key" ON "BannedIP"("ip");

-- Create Notification table if not exists
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "metadata" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- Add foreign key for Notification -> User
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey'
    ) THEN
        ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create Article table if not exists
CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentJson" JSONB,
    "contentMarkdown" TEXT,
    "content" TEXT NOT NULL,
    "contentS3Key" TEXT,
    "excerpt" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "iconName" TEXT NOT NULL DEFAULT 'Shield',
    "iconPosition" TEXT NOT NULL DEFAULT 'center',
    "iconColor" TEXT NOT NULL DEFAULT 'white',
    "gradient" TEXT,
    "coverImage" TEXT,
    "coverType" TEXT NOT NULL DEFAULT 'gradient',
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "adminFeedback" TEXT,
    "readTime" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "showInMoreArticles" BOOLEAN NOT NULL DEFAULT true,
    "featuredOrder" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "scheduledForDeletionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Article_slug_key" ON "Article"("slug");
CREATE INDEX IF NOT EXISTS "Article_status_idx" ON "Article"("status");
CREATE INDEX IF NOT EXISTS "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX IF NOT EXISTS "Article_status_submittedAt_idx" ON "Article"("status", "submittedAt");
CREATE INDEX IF NOT EXISTS "Article_slug_idx" ON "Article"("slug");
CREATE INDEX IF NOT EXISTS "Article_scheduledForDeletionAt_idx" ON "Article"("scheduledForDeletionAt");
CREATE INDEX IF NOT EXISTS "Article_featured_idx" ON "Article"("featured");

-- Add article columns if they were missing (for existing tables)
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "showInMoreArticles" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "scheduledForDeletionAt" TIMESTAMP(3);
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "iconPosition" TEXT NOT NULL DEFAULT 'center';
ALTER TABLE "Article" ADD COLUMN IF NOT EXISTS "iconColor" TEXT NOT NULL DEFAULT 'white';

-- Create ArticleMedia table if not exists
CREATE TABLE IF NOT EXISTS "ArticleMedia" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'image',
    "filename" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArticleMedia_articleId_idx" ON "ArticleMedia"("articleId");

-- Add foreign key for ArticleMedia -> Article
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ArticleMedia_articleId_fkey'
    ) THEN
        ALTER TABLE "ArticleMedia" ADD CONSTRAINT "ArticleMedia_articleId_fkey"
        FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create ArticleReaction table if not exists
CREATE TABLE IF NOT EXISTS "ArticleReaction" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleReaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArticleReaction_articleId_idx" ON "ArticleReaction"("articleId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleReaction_articleId_userId_type_key" ON "ArticleReaction"("articleId", "userId", "type");

-- Add foreign key for ArticleReaction -> Article
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ArticleReaction_articleId_fkey'
    ) THEN
        ALTER TABLE "ArticleReaction" ADD CONSTRAINT "ArticleReaction_articleId_fkey"
        FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;


