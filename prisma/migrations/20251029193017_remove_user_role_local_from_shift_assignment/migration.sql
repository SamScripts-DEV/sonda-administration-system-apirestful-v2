/*
  Warnings:

  - You are about to drop the column `userRoleLocalId` on the `shift_assignment` table. All the data in the column will be lost.
  - You are about to drop the column `userRoleLocalId` on the `shift_type_role_local` table. All the data in the column will be lost.
  - Added the required column `areaRoleId` to the `shift_type_role_local` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."shift_assignment" DROP CONSTRAINT "shift_assignment_userRoleLocalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shift_type_role_local" DROP CONSTRAINT "shift_type_role_local_userRoleLocalId_fkey";

-- AlterTable
ALTER TABLE "public"."shift_assignment" DROP COLUMN "userRoleLocalId";

-- AlterTable
ALTER TABLE "public"."shift_type_role_local" DROP COLUMN "userRoleLocalId",
ADD COLUMN     "areaRoleId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."shift_type_role_local" ADD CONSTRAINT "shift_type_role_local_areaRoleId_fkey" FOREIGN KEY ("areaRoleId") REFERENCES "public"."area_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
