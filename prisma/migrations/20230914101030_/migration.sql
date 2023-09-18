/*
  Warnings:

  - You are about to drop the column `companyId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `course` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_companyId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "companyId",
ADD COLUMN     "course" INTEGER NOT NULL,
ADD COLUMN     "group" INTEGER NOT NULL,
ADD COLUMN     "surname" TEXT NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "Company";

-- DropTable
DROP TABLE "Post";
