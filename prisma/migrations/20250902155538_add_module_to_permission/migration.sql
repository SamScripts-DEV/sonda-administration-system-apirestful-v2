/*
  Warnings:

  - Added the required column `module` to the `permission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."permission" ADD COLUMN     "module" TEXT NOT NULL;
