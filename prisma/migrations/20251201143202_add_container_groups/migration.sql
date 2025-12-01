-- AlterTable
ALTER TABLE "public"."organizational_group" ADD COLUMN     "containerGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."organizational_group" ADD CONSTRAINT "organizational_group_containerGroupId_fkey" FOREIGN KEY ("containerGroupId") REFERENCES "public"."organizational_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
