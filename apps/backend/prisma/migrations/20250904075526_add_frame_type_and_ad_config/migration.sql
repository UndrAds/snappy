-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "publisherName" TEXT NOT NULL,
    "publisherPic" TEXT,
    "largeThumbnail" TEXT,
    "smallThumbnail" TEXT,
    "ctaType" TEXT,
    "ctaValue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "format" TEXT NOT NULL DEFAULT 'portrait',
    "deviceFrame" TEXT NOT NULL DEFAULT 'mobile',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_frames" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'story',
    "hasContent" BOOLEAN NOT NULL DEFAULT false,
    "storyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adConfig" JSONB,

    CONSTRAINT "story_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_elements" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "frameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "style" JSONB,

    CONSTRAINT "story_elements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_backgrounds" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "opacity" DOUBLE PRECISION,
    "rotation" DOUBLE PRECISION,
    "zoom" DOUBLE PRECISION,
    "filter" TEXT,
    "offsetX" DOUBLE PRECISION,
    "offsetY" DOUBLE PRECISION,
    "frameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "stories_uniqueId_key" ON "stories"("uniqueId");

-- CreateIndex
CREATE UNIQUE INDEX "story_backgrounds_frameId_key" ON "story_backgrounds"("frameId");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_frames" ADD CONSTRAINT "story_frames_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_elements" ADD CONSTRAINT "story_elements_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "story_frames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_backgrounds" ADD CONSTRAINT "story_backgrounds_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "story_frames"("id") ON DELETE CASCADE ON UPDATE CASCADE;
