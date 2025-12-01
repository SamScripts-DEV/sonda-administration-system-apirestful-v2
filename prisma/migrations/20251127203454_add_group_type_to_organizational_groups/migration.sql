-- CreateEnum
CREATE TYPE "public"."GroupType" AS ENUM ('CONTAINER', 'LEADERSHIP', 'OPERATIONAL');

-- AlterTable
ALTER TABLE "public"."organizational_group" ADD COLUMN     "groupType" "public"."GroupType" NOT NULL DEFAULT 'CONTAINER';
