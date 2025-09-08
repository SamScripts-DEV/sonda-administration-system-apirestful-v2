-- DropForeignKey
ALTER TABLE "public"."user_area" DROP CONSTRAINT "user_area_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_role_local" DROP CONSTRAINT "user_role_local_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."user_role_local" ADD CONSTRAINT "user_role_local_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_area" ADD CONSTRAINT "user_area_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
