/*
  Warnings:

  - You are about to drop the column `localRole` on the `user_tower` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."user_tower" DROP COLUMN "localRole";

-- CreateTable
CREATE TABLE "public"."user_role_local" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "towerId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "user_role_local_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."user_role_local" ADD CONSTRAINT "user_role_local_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_role_local" ADD CONSTRAINT "user_role_local_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "public"."tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_role_local" ADD CONSTRAINT "user_role_local_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
