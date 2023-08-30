/*
  Warnings:

  - A unique constraint covering the columns `[keyPost]` on the table `posts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "keyPost" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "posts_keyPost_key" ON "posts"("keyPost");
