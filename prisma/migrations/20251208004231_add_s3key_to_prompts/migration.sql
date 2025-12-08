/*
  Warnings:

  - Added the required column `s3Key` to the `Prompt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN     "s3Key" TEXT NOT NULL;
