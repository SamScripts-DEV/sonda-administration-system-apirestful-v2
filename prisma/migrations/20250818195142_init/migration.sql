/*
  Warnings:

  - You are about to drop the column `activo` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `apellidos` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `cargoId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `cedula` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `imgUrl` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `nombres` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `torreId` on the `users` table. All the data in the column will be lost.
  - Added the required column `lastname` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_cedula_key";

-- DropIndex
DROP INDEX "public"."users_email_key";

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "activo",
DROP COLUMN "apellidos",
DROP COLUMN "cargoId",
DROP COLUMN "cedula",
DROP COLUMN "email",
DROP COLUMN "imgUrl",
DROP COLUMN "nombres",
DROP COLUMN "passwordHash",
DROP COLUMN "phone",
DROP COLUMN "torreId",
ADD COLUMN     "lastname" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
