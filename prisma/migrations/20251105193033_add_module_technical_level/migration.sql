-- CreateTable
CREATE TABLE "public"."technical_level" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "technical_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_technical_level" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "technicalLevelId" TEXT NOT NULL,

    CONSTRAINT "user_technical_level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "technical_level_name_key" ON "public"."technical_level"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_technical_level_userId_technicalLevelId_key" ON "public"."user_technical_level"("userId", "technicalLevelId");

-- AddForeignKey
ALTER TABLE "public"."user_technical_level" ADD CONSTRAINT "user_technical_level_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_technical_level" ADD CONSTRAINT "user_technical_level_technicalLevelId_fkey" FOREIGN KEY ("technicalLevelId") REFERENCES "public"."technical_level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
