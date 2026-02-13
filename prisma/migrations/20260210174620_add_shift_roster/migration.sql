-- AlterTable
ALTER TABLE "public"."shift_assignment" ADD COLUMN     "shiftRosterId" TEXT;

-- CreateTable
CREATE TABLE "public"."shift_roster" (
    "id" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_roster_user" (
    "id" TEXT NOT NULL,
    "shiftRosterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "shift_roster_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_roster_shift_type" (
    "id" TEXT NOT NULL,
    "shiftRosterId" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,

    CONSTRAINT "shift_roster_shift_type_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."shift_assignment" ADD CONSTRAINT "shift_assignment_shiftRosterId_fkey" FOREIGN KEY ("shiftRosterId") REFERENCES "public"."shift_roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_roster" ADD CONSTRAINT "shift_roster_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_roster_user" ADD CONSTRAINT "shift_roster_user_shiftRosterId_fkey" FOREIGN KEY ("shiftRosterId") REFERENCES "public"."shift_roster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_roster_user" ADD CONSTRAINT "shift_roster_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_roster_shift_type" ADD CONSTRAINT "shift_roster_shift_type_shiftRosterId_fkey" FOREIGN KEY ("shiftRosterId") REFERENCES "public"."shift_roster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_roster_shift_type" ADD CONSTRAINT "shift_roster_shift_type_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "public"."shift_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
