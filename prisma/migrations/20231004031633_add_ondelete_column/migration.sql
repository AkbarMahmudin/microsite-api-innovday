-- DropForeignKey
ALTER TABLE "UserStream" DROP CONSTRAINT "UserStream_streamId_fkey";

-- DropForeignKey
ALTER TABLE "UserStream" DROP CONSTRAINT "UserStream_userId_fkey";

-- DropForeignKey
ALTER TABLE "streams" DROP CONSTRAINT "streams_postId_fkey";

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStream" ADD CONSTRAINT "UserStream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStream" ADD CONSTRAINT "UserStream_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
