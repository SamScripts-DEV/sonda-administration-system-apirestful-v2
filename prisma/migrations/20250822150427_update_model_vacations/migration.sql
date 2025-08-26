-- CreateTable
CREATE TABLE "public"."vacation_request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysRequested" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "observation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacation_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vacation_balance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "daysAvailable" INTEGER NOT NULL,
    "daysTaken" INTEGER NOT NULL DEFAULT 0,
    "daysOwed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacation_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vacation_action_log" (
    "id" TEXT NOT NULL,
    "vacationRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionById" TEXT NOT NULL,
    "actionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "vacation_action_log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."vacation_request" ADD CONSTRAINT "vacation_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacation_request" ADD CONSTRAINT "vacation_request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacation_balance" ADD CONSTRAINT "vacation_balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacation_action_log" ADD CONSTRAINT "vacation_action_log_vacationRequestId_fkey" FOREIGN KEY ("vacationRequestId") REFERENCES "public"."vacation_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacation_action_log" ADD CONSTRAINT "vacation_action_log_actionById_fkey" FOREIGN KEY ("actionById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
