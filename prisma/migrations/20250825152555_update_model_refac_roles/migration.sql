/*
  Warnings:

  - You are about to drop the column `towerId` on the `users` table. All the data in the column will be lost.
  - Added the required column `scope` to the `role` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_towerId_fkey";

-- AlterTable
ALTER TABLE "public"."role" ADD COLUMN     "scope" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "towerId";

-- CreateTable
CREATE TABLE "public"."UserTower" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "localRole" TEXT,

    CONSTRAINT "UserTower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TowerRole" (
    "id" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "TowerRole_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."UserTower" ADD CONSTRAINT "UserTower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserTower" ADD CONSTRAINT "UserTower_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "public"."tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TowerRole" ADD CONSTRAINT "TowerRole_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "public"."tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TowerRole" ADD CONSTRAINT "TowerRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
