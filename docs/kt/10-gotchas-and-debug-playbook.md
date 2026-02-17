# 10. Gotchas and Debug Playbook

This file captures practical gotcha moments in this project and how to debug them quickly.

## 1. Role Name Mismatch (`publisher` vs `advertiser`)

Symptom:
- User role behavior looks inconsistent between old and new records.

Cause:
- Legacy code/data used `publisher`, current runtime logic uses `advertiser`.

Where to inspect:
- `/Users/devscript/Documents/UndrAds/Snappy/packages/shared-types/src/index.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/scripts/convert-publishers-to-advertisers.ts`

Fix:
- Run conversion script for existing data.
- Standardize all new logic on `advertiser`.

## 2. Dynamic Story Not Updating

Symptom:
- Dynamic story created, but frames do not refresh.

Checklist:
1. Redis up?
2. Bull queue active?
3. Story has `storyType=dynamic` and non-null `rssConfig`?
4. `rssConfig.isActive=true`?
5. Feed URL valid and returns items?

Where to inspect:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/schedulerService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/rssService.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/controllers/rssController.ts`

Quick test:
- Use `GET /api/rss/test-processing/:storyId` then inspect queue stats endpoint.

## 3. RSS Jobs Stuck or Slow

Symptom:
- Processing status remains `processing` or repeated failures.

Likely causes:
- Feed source is slow/unreachable.
- DB pool exhaustion under heavy processing.
- Large feed causing transaction pressure.

Design note:
- Queue concurrency is intentionally `1` to reduce DB connection contention.

Action:
- Check backend logs for timeout/connection errors.
- Verify DB pool settings and Redis health.
- Reduce `maxPosts` temporarily for isolation.

## 4. Editor Save Looks Successful but Unexpected Frame State Appears

Symptom:
- After save/reload, frame IDs/order/content differ from current editor memory.

Cause:
- `save-complete` replaces frame tree, not incremental patch.

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/storyService.ts` (`saveCompleteStory`)

Debug approach:
- Log outbound editor payload.
- Confirm payload ordering and frame IDs.
- Reload story by uniqueId and compare server state.

## 5. Embed Script Shows Wrong API Origin

Symptom:
- Embed cannot load story due to wrong API host.

Cause:
- Script origin resolution fallback may use host page origin.

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/public/webstory-embed.js`

Fix:
- Set explicit `data-api-url` in embed tag.
- Verify script source and CORS/proxy behavior.

## 6. Analytics Delayed on Dashboard

Symptom:
- Event calls visible in network, but aggregate metrics lag briefly.

Cause:
- Debounced aggregation window (~5 seconds idle by story).

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/analyticsService.ts`

Expected behavior:
- Raw events immediate.
- Aggregated metrics eventually consistent by design.

## 7. Export Fails or ZIP Too Large

Symptom:
- Export endpoint returns warnings/failure, or ad-platform rejects ZIP.

Causes:
- Too many assets.
- Large source images.
- Invalid destination URL.

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/controllers/exportController.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/exportService.ts`

Fix:
- Check `export/info` constraints before final export.
- Reduce image count/size.

## 8. S3 Upload Errors in Runtime

Symptom:
- Upload endpoint returns config error or S3 permission errors.

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/services/s3Service.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/docs/S3_SETUP.md`

Checklist:
- All S3 env vars set.
- Bucket policy allows object reads.
- IAM credentials valid and permissioned.
- `S3_BASE_URL` matches bucket endpoint.

## 9. Admin Actions Work in UI but API Returns Forbidden

Symptom:
- Admin page reachable but admin API fails.

Cause:
- Stale user role in frontend local storage/JWT.

Fix:
- Re-login to refresh token claims.
- Confirm backend profile returns admin role.
- Verify middleware `requireAdmin` path.

## 10. Nginx Routing Surprises

Symptom:
- SPA routes work, but API or embed script returns wrong content type/404.

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/nginx.conf`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/nginx.conf`

Checklist:
- `/api/` proxy path correct.
- `/webstory-embed.js` served as JS, not index.html.
- Static file fallback order is correct.

## 11. Test Coverage Is Limited

Symptom:
- Feature regressions not caught in CI/local tests.

Current tests cover mainly:
- auth endpoints
- upload endpoints

Where:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/src/__tests__`

Recommendation:
- Add tests for RSS scheduling, analytics aggregation, export constraints, and admin permission boundaries.

## Fast Debug Command Checklist

From repo root:
1. `npm run dev`
2. `curl http://localhost:3000/health`
3. `docker-compose ps` (if containerized)
4. Check backend logs for queue/DB errors
5. Validate story via `GET /api/stories/public/:uniqueId`
6. Confirm analytics event posting in browser network tab

