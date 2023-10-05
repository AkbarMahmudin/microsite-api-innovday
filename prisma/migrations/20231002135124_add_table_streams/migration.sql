-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "streams" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "slidoId" TEXT NOT NULL,
    "key" TEXT,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStream" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "streamId" INTEGER NOT NULL,

    CONSTRAINT "UserStream_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "streams_postId_key" ON "streams"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "streams_key_key" ON "streams"("key");

-- AddForeignKey
ALTER TABLE "streams" ADD CONSTRAINT "streams_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStream" ADD CONSTRAINT "UserStream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStream" ADD CONSTRAINT "UserStream_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
