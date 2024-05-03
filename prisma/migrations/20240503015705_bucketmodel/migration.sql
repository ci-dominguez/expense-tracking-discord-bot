/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Bucket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bucket_name_key" ON "Bucket"("name");
