-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'post',
ADD COLUMN     "url" JSONB;
