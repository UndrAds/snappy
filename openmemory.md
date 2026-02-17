# Snappy - OpenMemory Guide

## Overview
Snappy is a web application for creating and managing web stories/ads. Stack: Node.js backend (Express), React/Vite frontend, PostgreSQL, Redis, Nginx.

## Architecture
- **Nginx** (port 80): Reverse proxy; routes /api to backend, static to frontend
- **Backend**: Express API on port 3000 (internal)
- **Frontend**: Static SPA served by nginx in container
- **PostgreSQL**: Database
- **Redis**: Cache

## User Defined Namespaces
- [Leave blank - user populates]

## Components
- deploy.sh: Zero-downtime deployment via rolling updates
- docker-compose.yml: Backend/frontend have no container_name (enables scaling)

## Patterns
- Rolling deploy: scale up → health check → remove old → scale down
- Backend has graceful SIGTERM shutdown for clean container stop
