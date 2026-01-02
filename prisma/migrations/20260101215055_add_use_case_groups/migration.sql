-- AlterTable
ALTER TABLE "KnowledgeBaseCategory" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UseCaseGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Folder',
    "color" TEXT NOT NULL DEFAULT 'default',
    "order" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UseCaseGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UseCaseGroup_userId_idx" ON "UseCaseGroup"("userId");

-- CreateIndex
CREATE INDEX "UseCaseGroup_parentId_idx" ON "UseCaseGroup"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseCategory_groupId_idx" ON "KnowledgeBaseCategory"("groupId");

-- AddForeignKey
ALTER TABLE "KnowledgeBaseCategory" ADD CONSTRAINT "KnowledgeBaseCategory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "UseCaseGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UseCaseGroup" ADD CONSTRAINT "UseCaseGroup_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "UseCaseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
