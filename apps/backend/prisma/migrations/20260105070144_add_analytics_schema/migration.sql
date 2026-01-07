-- CreateTable
CREATE TABLE "story_analytics" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "avgPostsSeen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTimeSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgAdsSeen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_analytics_events" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "frameIndex" INTEGER,
    "value" DOUBLE PRECISION,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "story_analytics_storyId_key" ON "story_analytics"("storyId");

-- CreateIndex
CREATE INDEX "story_analytics_events_storyId_idx" ON "story_analytics_events"("storyId");

-- CreateIndex
CREATE INDEX "story_analytics_events_storyId_eventType_idx" ON "story_analytics_events"("storyId", "eventType");

-- CreateIndex
CREATE INDEX "story_analytics_events_storyId_createdAt_idx" ON "story_analytics_events"("storyId", "createdAt");

-- AddForeignKey
ALTER TABLE "story_analytics" ADD CONSTRAINT "story_analytics_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_analytics_events" ADD CONSTRAINT "story_analytics_events_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
