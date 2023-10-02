-- CreateTable
CREATE TABLE "Olympics" (
    "id" SERIAL NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "databaseScript" TEXT NOT NULL,

    CONSTRAINT "Olympics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "olympicsId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "solution" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Olympics" ADD CONSTRAINT "Olympics_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_olympicsId_fkey" FOREIGN KEY ("olympicsId") REFERENCES "Olympics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
