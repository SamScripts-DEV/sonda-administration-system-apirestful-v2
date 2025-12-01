-- CreateTable
CREATE TABLE "public"."organizational_group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaId" TEXT,
    "parentId" TEXT,
    "hierarchyLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizational_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_organizational_group" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_organizational_group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_organizational_group_userId_groupId_key" ON "public"."user_organizational_group"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "public"."organizational_group" ADD CONSTRAINT "organizational_group_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "public"."area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizational_group" ADD CONSTRAINT "organizational_group_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."organizational_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_organizational_group" ADD CONSTRAINT "user_organizational_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_organizational_group" ADD CONSTRAINT "user_organizational_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."organizational_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
