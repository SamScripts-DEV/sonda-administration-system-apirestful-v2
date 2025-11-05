/*
  Warnings:

  - You are about to drop the column `extraordinary` on the `shift_hours` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."shift_hours" DROP COLUMN "extraordinary",
ADD COLUMN     "supplementary" INTEGER NOT NULL DEFAULT 0;
