-- CreateTable
CREATE TABLE "Supporter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "occupation" TEXT NOT NULL,
    "company" TEXT,
    "contributionBio" TEXT NOT NULL,
    "personalBio" TEXT,
    "linkedinUrl" TEXT,
    "websiteUrl" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'supporter',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supporter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supporter_tier_idx" ON "Supporter"("tier");

-- CreateIndex
CREATE INDEX "Supporter_visible_idx" ON "Supporter"("visible");

-- CreateIndex
CREATE INDEX "Supporter_order_idx" ON "Supporter"("order");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
