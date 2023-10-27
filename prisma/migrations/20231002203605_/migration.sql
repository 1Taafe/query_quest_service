/*
  Warnings:

  - Added the required column `databaseName` to the `Olympics` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Olympics" ADD COLUMN     "databaseName" TEXT NOT NULL;
