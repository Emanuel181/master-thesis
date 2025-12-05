/*
  Warnings:

  - Added the required column `updatedAt` to the `KnowledgeBaseCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `s3Key` to the `Pdf` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pdf" DROP CONSTRAINT "Pdf_useCaseId_fkey";

-- AlterTable
ALTER TABLE "KnowledgeBaseCategory" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT 'File',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Pdf" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "s3Key" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Pdf" ADD CONSTRAINT "Pdf_useCaseId_fkey" FOREIGN KEY ("useCaseId") REFERENCES "KnowledgeBaseCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
