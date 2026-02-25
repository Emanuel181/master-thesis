-- AlterTable: Add virus scanning fields to Pdf model
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScanStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScannedAt" TIMESTAMP(3);
ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScanId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Pdf_virusScanStatus_idx" ON "Pdf"("virusScanStatus");

