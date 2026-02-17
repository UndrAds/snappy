# 11. Operations, Deployment, and Runbook

## 1. Runtime Modes

1. Local workspace mode
- `npm run dev` runs backend + frontend concurrently.

2. Docker compose mode
- Starts postgres, redis, backend, frontend, nginx.

3. Deployment script mode
- Zero-downtime deployment via rolling service update.

## 2. Key Infra Files

- `/Users/devscript/Documents/UndrAds/Snappy/docker-compose.yml`
- `/Users/devscript/Documents/UndrAds/Snappy/deploy.sh`
- `/Users/devscript/Documents/UndrAds/Snappy/nginx.conf`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/Dockerfile`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/Dockerfile`

## 3. Local Setup Checklist

1. Install deps: `npm install`
2. Create env files from examples:
- backend: `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/env.example`
- frontend: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/env.example`
3. Ensure PostgreSQL and Redis available.
4. Run DB migrations.
5. Start app: `npm run dev`.

## 4. Deployment Script Behavior

File:
- `/Users/devscript/Documents/UndrAds/Snappy/deploy.sh`

What it does:
1. Preflight checks env + docker availability.
2. Ensures infra services running.
3. Builds backend/frontend images.
4. Rolls backend with health checks.
5. Applies prisma migrations (unless skipped).
6. Initializes admin user script.
7. Rolls frontend.
8. Ensures nginx is up and reloaded.

Control flags:
- `DRY_RUN=1`
- `NO_CACHE=1`
- `REBUILD_NGINX=1`
- `SKIP_MIGRATE=1`

## 5. Health and Verification Endpoints

- Backend direct: `http://localhost:3000/health`
- Through nginx: `http://localhost/health`

Infra smoke script:
- `/Users/devscript/Documents/UndrAds/Snappy/test-setup.sh`

## 6. Admin Bootstrap and User Operations

Scripts:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/scripts/init-admin.ts`
- `/Users/devscript/Documents/UndrAds/Snappy/apps/backend/scripts/create-user.ts`

Use these for:
- Initial admin bootstrapping.
- Manual user creation/role fixes.

## 7. Incident Triage Order (Practical)

When something breaks, check in this order:
1. `/health` endpoint
2. DB connectivity
3. Redis connectivity
4. Queue stats (for RSS issues)
5. S3 credentials (for upload/export image issues)
6. Nginx routing and headers
7. Application logs for the exact failing path

## 8. What to Monitor in Production

Minimum monitoring signals:
- API 5xx rate
- Queue failure count
- RSS processing duration
- DB connection pool errors/timeouts
- Upload failure rate
- Analytics ingestion volume anomalies

## 9. KT Session Recommendation for Ops

If handing over ops to intern:
1. Walk through `docker-compose.yml` service-by-service.
2. Dry run deployment script.
3. Simulate one failure per subsystem (DB, Redis, S3, nginx path).
4. Have intern execute a full deploy in staging-like environment.
