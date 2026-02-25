/**
 * Manual migration script to add virus scan fields to the Pdf table.
 * Run: node scripts/migrate-virus-scan.js
 */
const { Client } = require('pg');
require('dotenv').config();

async function main() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    console.log('Connected to database');

    try {
        await client.query(`ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScanStatus" TEXT NOT NULL DEFAULT 'pending'`);
        console.log('Added virusScanStatus column');

        await client.query(`ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScannedAt" TIMESTAMP(3)`);
        console.log('Added virusScannedAt column');

        await client.query(`ALTER TABLE "Pdf" ADD COLUMN IF NOT EXISTS "virusScanId" TEXT`);
        console.log('Added virusScanId column');

        await client.query(`CREATE INDEX IF NOT EXISTS "Pdf_virusScanStatus_idx" ON "Pdf"("virusScanStatus")`);
        console.log('Created virusScanStatus index');

        // Mark all existing PDFs as 'skipped' since they were uploaded before VT integration
        const result = await client.query(`UPDATE "Pdf" SET "virusScanStatus" = 'skipped' WHERE "virusScanStatus" = 'pending'`);
        console.log(`Marked ${result.rowCount} existing PDFs as skipped`);

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();

