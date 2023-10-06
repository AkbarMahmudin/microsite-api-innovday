/*
  Warnings:

  - You are about to drop the `UserStream` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserStream" DROP CONSTRAINT "UserStream_streamId_fkey";

-- DropForeignKey
ALTER TABLE "UserStream" DROP CONSTRAINT "UserStream_userId_fkey";

-- DropTable
DROP TABLE "UserStream";

-- CreateTable
CREATE TABLE "user_streams" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "streamId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "user_streams_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_streams" ADD CONSTRAINT "user_streams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streams" ADD CONSTRAINT "user_streams_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
