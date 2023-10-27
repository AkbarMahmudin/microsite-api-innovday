/*
  Warnings:

  - You are about to drop the column `endDate` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `keyPost` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `slidoId` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `youtubeId` on the `posts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "posts_keyPost_key";

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "endDate",
DROP COLUMN "keyPost",
DROP COLUMN "slidoId",
DROP COLUMN "startDate",
DROP COLUMN "youtubeId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaKeywords" TEXT,
ADD COLUMN     "metaTitle" TEXT;
