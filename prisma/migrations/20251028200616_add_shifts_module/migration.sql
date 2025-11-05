-- CreateTable
CREATE TABLE "public"."shift_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isRotative" BOOLEAN NOT NULL DEFAULT false,
    "isStandby" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "shift_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_schedule" (
    "id" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "shift_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_type_role_local" (
    "id" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "userRoleLocalId" TEXT NOT NULL,

    CONSTRAINT "shift_type_role_local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_assignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "observation" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "originalUserId" TEXT,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT true,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isWeekend" BOOLEAN NOT NULL DEFAULT false,
    "isStandby" BOOLEAN NOT NULL DEFAULT false,
    "areaId" TEXT NOT NULL,
    "userRoleLocalId" TEXT NOT NULL,

    CONSTRAINT "shift_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_hours" (
    "id" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "worked" INTEGER NOT NULL DEFAULT 0,
    "ordinary" INTEGER NOT NULL DEFAULT 0,
    "extra" INTEGER NOT NULL DEFAULT 0,
    "extraordinary" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "shift_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shift_event" (
    "id" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observation" TEXT,

    CONSTRAINT "shift_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shift_hours_shiftAssignmentId_key" ON "public"."shift_hours"("shiftAssignmentId");

-- AddForeignKey
ALTER TABLE "public"."shift_schedule" ADD CONSTRAINT "shift_schedule_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "public"."shift_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_type_role_local" ADD CONSTRAINT "shift_type_role_local_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "public"."shift_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_type_role_local" ADD CONSTRAINT "shift_type_role_local_userRoleLocalId_fkey" FOREIGN KEY ("userRoleLocalId") REFERENCES "public"."user_role_local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_assignment" ADD CONSTRAINT "shift_assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_assignment" ADD CONSTRAINT "shift_assignment_originalUserId_fkey" FOREIGN KEY ("originalUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_assignment" ADD CONSTRAINT "shift_assignment_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "public"."shift_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_assignment" ADD CONSTRAINT "shift_assignment_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_assignment" ADD CONSTRAINT "shift_assignment_userRoleLocalId_fkey" FOREIGN KEY ("userRoleLocalId") REFERENCES "public"."user_role_local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_hours" ADD CONSTRAINT "shift_hours_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "public"."shift_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_event" ADD CONSTRAINT "shift_event_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "public"."shift_assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shift_event" ADD CONSTRAINT "shift_event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
