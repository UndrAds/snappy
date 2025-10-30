-- AlterTable
ALTER TABLE "stories" ADD COLUMN     "rssConfig" JSONB,
ADD COLUMN     "storyType" TEXT NOT NULL DEFAULT 'static';
