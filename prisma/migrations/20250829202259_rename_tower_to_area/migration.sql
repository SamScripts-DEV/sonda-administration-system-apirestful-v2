/*
  Warnings:

  - You are about to drop the column `towerId` on the `user_role_local` table. All the data in the column will be lost.
  - You are about to drop the `tower` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tower_role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_tower` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `areaId` to the `user_role_local` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."tower_role" DROP CONSTRAINT "tower_role_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tower_role" DROP CONSTRAINT "tower_role_towerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_role_local" DROP CONSTRAINT "user_role_local_towerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_tower" DROP CONSTRAINT "user_tower_towerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_tower" DROP CONSTRAINT "user_tower_userId_fkey";

-- AlterTable
ALTER TABLE "public"."user_role_local" DROP COLUMN "towerId",
ADD COLUMN     "areaId" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."tower";

-- DropTable
DROP TABLE "public"."tower_role";

-- DropTable
DROP TABLE "public"."user_tower";

-- CreateTable
CREATE TABLE "public"."area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_area" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "user_area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."area_role" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "area_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "area_name_key" ON "public"."area"("name");

-- AddForeignKey
ALTER TABLE "public"."user_role_local" ADD CONSTRAINT "user_role_local_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_area" ADD CONSTRAINT "user_area_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_area" ADD CONSTRAINT "user_area_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."area_role" ADD CONSTRAINT "area_role_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."area_role" ADD CONSTRAINT "area_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
