-- CreateTable (RateLimit already exists in database, this captures drift)
CREATE TABLE IF NOT EXISTS "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- Add color column to KnowledgeBaseCategory if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'KnowledgeBaseCategory' AND column_name = 'color'
    ) THEN
        ALTER TABLE "KnowledgeBaseCategory" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'default';
    END IF;
END $$;
