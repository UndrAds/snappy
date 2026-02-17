#!/bin/bash

# Snappy - Production Zero-Downtime Deployment Script
# Usage: ./deploy.sh
#
# Environment variables:
#   APP_PORT       - Nginx port (default: 80)
#   NO_CACHE       - Set to 1 for full rebuild
#   REBUILD_NGINX  - Set to 1 to rebuild nginx (after nginx.conf changes)
#   SKIP_MIGRATE   - Set to 1 to skip database migrations
#   DRY_RUN        - Set to 1 to validate only, no deploy

set -euo pipefail

# --- Configuration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_PORT="${APP_PORT:-80}"
export APP_PORT

# --- Logging ---
log() { echo "[$(date +%Y-%m-%dT%H:%M:%S)] $*"; }
err() { echo "[$(date +%Y-%m-%dT%H:%M:%S)] ❌ $*" >&2; }
ok()  { echo "[$(date +%Y-%m-%dT%H:%M:%S)] ✅ $*"; }

# --- Cleanup on failure ---
DEPLOY_FAILED=0
cleanup_on_fail() {
  if [ $DEPLOY_FAILED -eq 1 ]; then
    err "Deployment failed. Services may be in inconsistent state."
    err "Check logs: docker-compose logs -f"
    err "Rollback: git checkout <previous-commit> && ./deploy.sh"
  fi
}
trap cleanup_on_fail EXIT

# --- Pre-flight checks ---
preflight() {
  log "Running pre-flight checks..."

  # 1. Required files
  for f in docker-compose.yml apps/backend/.env apps/frontend/.env; do
    if [ ! -f "$f" ]; then
      err "Missing required file: $f"
      [ "$f" = "apps/backend/.env" ] && err "  Copy from apps/backend/env.example"
      [ "$f" = "apps/frontend/.env" ] && err "  Copy from apps/frontend/env.example"
      exit 1
    fi
  done

  # 2. Docker available
  if ! command -v docker >/dev/null 2>&1; then
    err "Docker is not installed or not in PATH"
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    err "Docker daemon is not running"
    exit 1
  fi

  # 3. docker-compose available
  if ! docker-compose version >/dev/null 2>&1; then
    err "docker-compose is not available"
    exit 1
  fi

  # 4. Production JWT secret check
  if grep -q "your-super-secret-jwt-key-change-this" apps/backend/.env 2>/dev/null; then
    err "JWT_SECRET must be changed in apps/backend/.env for production"
    exit 1
  fi

  ok "Pre-flight checks passed"
}

# --- Nginx reload (zero-downtime) ---
reload_nginx() {
  if docker ps -q -f name=snappy-nginx 2>/dev/null | grep -q .; then
    log "Reloading nginx..."
    docker exec snappy-nginx nginx -s reload 2>/dev/null || true
  fi
}

# --- Rolling update ---
rolling_update() {
  local service=$1
  local health_port=$2
  local health_path=${3:-/health}
  local max_wait=${4:-60}

  echo ""
  log "Rolling update: $service"

  local old_id
  old_id=$(docker ps -q --filter "label=com.docker.compose.service=$service" 2>/dev/null | tail -n1 || true)

  log "  Scaling $service to 2..."
  if ! docker-compose up -d --no-deps --scale "$service=2" --no-recreate "$service"; then
    err "Failed to scale $service"
    return 1
  fi

  local new_id
  new_id=$(docker ps -q --filter "label=com.docker.compose.service=$service" 2>/dev/null | head -n1)
  if [ -z "$new_id" ]; then
    err "Failed to start new $service container"
    docker-compose up -d --no-deps --scale "$service=1" --no-recreate "$service" 2>/dev/null || true
    return 1
  fi

  log "  Waiting for health (max ${max_wait}s)..."
  local waited=0
  while [ $waited -lt "$max_wait" ]; do
    if docker exec "$new_id" curl -sf "http://localhost:${health_port}${health_path}" >/dev/null 2>&1; then
      ok "  New container healthy"
      break
    fi
    sleep 2
    waited=$((waited + 2))
    echo -n "."
  done

  if [ $waited -ge "$max_wait" ]; then
    echo ""
    err "Health check failed for $service after ${max_wait}s"
    docker-compose up -d --no-deps --scale "$service=1" --no-recreate "$service" 2>/dev/null || true
    return 1
  fi

  reload_nginx

  if [ -n "$old_id" ] && [ "$old_id" != "$new_id" ]; then
    log "  Removing old container..."
    docker stop "$old_id" 2>/dev/null || true
    docker rm "$old_id" 2>/dev/null || true
    reload_nginx
  fi

  docker-compose up -d --no-deps --scale "$service=1" --no-recreate "$service"
  reload_nginx
  ok "  $service updated"
}

# --- Main ---
main() {
  log "Snappy Zero-Downtime Deploy (port ${APP_PORT})"
  echo ""

  preflight

  if [ "${DRY_RUN:-0}" = "1" ]; then
    ok "Dry run - validation passed. Run without DRY_RUN=1 to deploy."
    exit 0
  fi

  mkdir -p uploads

  # Infra
  log "Ensuring postgres and redis are running..."
  docker-compose up -d postgres redis
  sleep 5

  # Build
  BUILD_ARGS="${NO_CACHE:+--no-cache}"
  log "Building backend and frontend..."
  docker-compose build $BUILD_ARGS backend frontend

  # Backend rolling update
  rolling_update "backend" 3000 "/health" 90 || { DEPLOY_FAILED=1; exit 1; }

  # Migrations (never reset in production)
  if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
    echo ""
    log "Running database migrations..."
    if ! docker-compose exec -T backend npx prisma migrate deploy; then
      err "Migration failed. Fix migrations manually. Do NOT run migrate reset in production."
      DEPLOY_FAILED=1
      exit 1
    fi
    ok "Migrations applied"
  fi

  # Admin init
  echo ""
  log "Initializing admin user..."
  sleep 3
  if docker-compose ps backend 2>/dev/null | grep -q "Up"; then
    docker-compose exec -T backend sh -c "npx tsx /app/apps/backend/scripts/init-admin.ts" 2>/dev/null || {
      log "Admin init skipped (may already exist)"
    }
  fi

  # Frontend rolling update
  rolling_update "frontend" 80 "/health" 30 || { DEPLOY_FAILED=1; exit 1; }

  # Nginx
  echo ""
  log "Ensuring nginx is up..."
  if [ "${REBUILD_NGINX:-0}" = "1" ]; then
    docker-compose build nginx
    docker-compose up -d --force-recreate nginx
  else
    docker-compose up -d --no-recreate nginx
  fi
  reload_nginx

  # Summary
  echo ""
  log "Service status:"
  docker-compose ps
  echo ""
  ok "Deployment complete - zero downtime"
  echo ""
  echo "  App:   http://localhost:${APP_PORT}"
  echo "  API:   http://localhost:${APP_PORT}/api"
  echo "  Health: http://localhost:${APP_PORT}/health"
  echo ""
  echo "  Logs:  docker-compose logs -f"
  echo "  Rebuild nginx: REBUILD_NGINX=1 ./deploy.sh"
  echo ""
}

main "$@"
