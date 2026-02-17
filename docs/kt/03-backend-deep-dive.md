# 03. Backend Deep Dive

Backend root:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend`

## 1. Entry Point and Startup Lifecycle

Entry file:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/index.ts`

Startup sequence:
1. Load app and middleware.
2. Register routes.
3. Connect database via Prisma.
4. Initialize RSS scheduler (`SchedulerService.initializeScheduler()`).
5. Start HTTP server.
6. Attach graceful shutdown handlers for SIGTERM/SIGINT.

Why this matters:
- RSS dynamic stories become active immediately after server restart.
- Graceful shutdown is required for near-zero downtime deployments.

## 2. Configuration and Environment

Config files:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/config/config.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/config/database.ts`

Important variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `REDIS_HOST`, `REDIS_PORT`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_BASE_URL`

Notable implementation detail:
- `database.ts` appends pool settings (`connection_limit`, `pool_timeout`) if missing.

## 3. Middleware Stack

Location:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/middleware`

Key middleware:
- `auth.ts`: JWT verification and `req.user` population.
- `admin.ts`: admin-only enforcement.
- `validateRequest.ts`: express-validator error wiring.
- `validateZod.ts`: zod body validation helper.
- `errorHandler.ts`: normalized error shape.
- `notFound.ts`: fallback 404.

## 4. Route Modules and Responsibilities

Location:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/routes`

Route modules:
- `auth.ts`: register/login
- `users.ts`: profile get/update
- `stories.ts`: story/frame/element/background CRUD + export
- `uploads.ts`: image upload APIs
- `content.ts`: URL scraping
- `rss.ts`: RSS validation/config/toggle/trigger/status
- `analytics.ts`: event ingestion + read APIs
- `admin.ts`: admin dashboards and management APIs

## 5. Controllers vs Services (Pattern)

Controllers:
- Handle request/response mapping.
- Validate access context.
- Invoke service methods.

Services:
- Own business logic, DB operations, third-party integration logic.

Main service files:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/storyService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/rssService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/schedulerService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/analyticsService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/exportService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/uploadService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/s3Service.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/contentScraperService.ts`

## 6. Data Model (Prisma)

Schema file:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/prisma/schema.prisma`

Main tables:
- `users`
- `stories`
- `story_frames`
- `story_elements`
- `story_backgrounds`
- `story_analytics`
- `story_analytics_events`

Modeling choices:
- Frame + element + background split gives flexible editor persistence.
- JSON fields (`rssConfig`, `embedConfig`, `adConfig`, style) support evolving UI features without frequent migrations.
- Separate raw event table and aggregated table to balance write speed and dashboard read performance.

## 7. Auth and Role Behavior

Auth controller:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/controllers/authController.ts`

Behavior:
- Register hashes password with bcrypt (12 rounds), creates user, returns JWT.
- Login checks user/password and returns JWT.
- Token includes role so most checks avoid DB roundtrip.

Role semantics:
- Runtime behavior uses `admin` and `advertiser`.
- Legacy `publisher` appears in historical/migration scripts only.

## 8. Story Service Internals

File:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/storyService.ts`

Key behavior:
- Generates `uniqueId` from title + random hash.
- Supports user-scoped and admin-scoped CRUD variants.
- `saveCompleteStory` deletes and recreates frame tree for consistency.
- Dynamic story creation can trigger RSS scheduling.
- RSS generation uses transaction + retry strategy for connection/timeout errors.

Why this design:
- Full replace on save reduces partial-drift between editor state and persisted state.
- Admin-specific methods avoid repeated permission branching in higher layers.

## 9. RSS and Scheduling Internals

Files:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/rssService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/schedulerService.ts`

RSS service:
- Parses feed and extracts title/link/image from multiple tag patterns.
- Supports repetition logic if feed has fewer items than required.

Scheduler service:
- Creates Bull queue with retry/backoff/timeouts.
- Processes with concurrency=1 to reduce DB pool exhaustion risk.
- Schedules immediate + recurring jobs.
- Writes status snapshots to Redis for frontend polling.

## 10. Analytics Internals

File:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/analyticsService.ts`

Ingestion model:
- Event tracking endpoint writes event quickly.
- Aggregation is deferred with debounce (5 seconds inactivity by story).

Aggregated metrics include:
- views (from `player_viewport`)
- avgPostsSeen
- avgTimeSpent
- impressions (>=50% frames seen threshold)
- clicks, ctr
- viewability

Why debounce:
- Prevent expensive re-aggregation on every event during active playback.

## 11. Export Internals

File:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/exportService.ts`

Pipeline:
1. Resolve story and keep only story frames (ad frames excluded).
2. Collect image URLs from publisher/frame assets.
3. Download and compress images.
4. Generate and minify HTML payload.
5. Package ZIP and stream it.
6. Cleanup temp files.

Constraint checks:
- Standard vs app-campaign export have different size/file limits.

## 12. Upload + S3 Internals

Files:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/uploadService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/s3Service.ts`

Behavior:
- Accept only image mime types.
- 10MB upload size limit.
- Memory upload -> S3 PutObject.
- Return stable URL for frontend persistence.

## 13. Admin Backend Behavior

Controller:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/controllers/adminController.ts`

Main capability groups:
- Global stats
- User search/list
- Advertiser lookup for assignment
- Per-user analytics
- Global story listing with filters
- Admin story update/delete

## 14. Backend Scripts and Ops Helpers

Scripts directory:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/scripts`

Scripts:
- `init-admin.ts`: ensures default admin exists.
- `create-user.ts`: create/update user from CLI.
- `convert-publishers-to-advertisers.ts`: legacy role migration helper.

Use cases:
- Bootstrap and maintenance in pre-production/production.
