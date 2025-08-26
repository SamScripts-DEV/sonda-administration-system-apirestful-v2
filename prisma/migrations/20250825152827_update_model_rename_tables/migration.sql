/*
  Warnings:

  - You are about to drop the `TowerRole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserTower` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TowerRole" DROP CONSTRAINT "TowerRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TowerRole" DROP CONSTRAINT "TowerRole_towerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTower" DROP CONSTRAINT "UserTower_towerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserTower" DROP CONSTRAINT "UserTower_userId_fkey";

-- DropTable
DROP TABLE "public"."TowerRole";

-- DropTable
DROP TABLE "public"."UserTower";

-- CreateTable
CREATE TABLE "public"."user_tower" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "localRole" TEXT,

    CONSTRAINT "user_tower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tower_role" (
    "id" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "tower_role_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."user_tower" ADD CONSTRAINT "user_tower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_tower" ADD CONSTRAINT "user_tower_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "public"."tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tower_role" ADD CONSTRAINT "tower_role_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "public"."tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tower_role" ADD CONSTRAINT "tower_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
