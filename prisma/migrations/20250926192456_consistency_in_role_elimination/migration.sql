-- DropForeignKey
ALTER TABLE "public"."area_role" DROP CONSTRAINT "area_role_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_role_local" DROP CONSTRAINT "user_role_local_roleId_fkey";

-- AddForeignKey
ALTER TABLE "public"."user_role_local" ADD CONSTRAINT "user_role_local_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."area_role" ADD CONSTRAINT "area_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
