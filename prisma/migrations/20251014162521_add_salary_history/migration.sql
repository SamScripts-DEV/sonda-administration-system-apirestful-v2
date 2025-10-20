-- CreateTable
CREATE TABLE "public"."salary_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,

    CONSTRAINT "salary_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."salary_history" ADD CONSTRAINT "salary_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
