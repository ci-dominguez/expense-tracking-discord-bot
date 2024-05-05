/*
  Warnings:

  - You are about to drop the column `description` on the `Split` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Split` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Split_description_key";

-- AlterTable
ALTER TABLE "Split" DROP COLUMN "description",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'New Split';

-- CreateIndex
CREATE UNIQUE INDEX "Split_name_key" ON "Split"("name");
