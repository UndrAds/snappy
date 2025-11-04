-- Add embedConfig JSONB column to stories table
ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "embedConfig" JSONB;


