-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_olympicsId_fkey";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_olympicsId_fkey" FOREIGN KEY ("olympicsId") REFERENCES "Olympics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
