# 01. System Overview

## What Snappy Is

Snappy is a story platform for advertisers and admins.

Core output of the system:
- Stories with multiple frames.
- Static stories (manually authored).
- Dynamic stories (auto-generated from RSS).
- Embeddable stories on external websites.
- Analytics and monetization metrics.
- Exportable ad packages (Google H5 style ZIP).

## Business Intent

Why this system exists:
- Let non-technical users create story creatives quickly.
- Support automation for content-heavy publishers via RSS.
- Support ad placement in story flow.
- Allow external distribution via embed script.
- Measure engagement and downstream value (CTR, impressions, revenue using CPM).

## User Personas

1. Advertiser
- Creates and edits stories.
- Uses analytics pages for own stories.
- Uses embed/export for distribution.

2. Admin
- Does everything advertiser can.
- Can manage all users/stories.
- Can assign stories to advertisers.
- Can view platform-wide stats.

3. Viewer (external)
- Consumes stories via embedded player.
- Generates analytics events.

## Product Pillars (High-Level Features)

1. Account + Access Control
- JWT-based auth.
- Role-aware UI and API.

2. Story Authoring
- Create metadata in Create/Edit pages.
- Compose frames/elements/backgrounds in editor.
- Support both story and ad frames.

3. Dynamic Automation
- RSS feed parsing.
- Queue-driven periodic refresh.
- Automated frame generation and ad insertion.

4. Distribution
- Public story endpoint by unique ID.
- External embed runtime (`webstory-embed.js`).

5. Insights + Revenue Tracking
- Event ingestion from embed player.
- Aggregated metrics + day-wise views.

6. Export
- Story assets packaged for ad-platform upload.

## High-Level Tech Summary

- Frontend: React + Vite + TypeScript + React Query
- Backend: Express + TypeScript + Prisma
- DB: PostgreSQL
- Queue/Scheduler: Bull + Redis
- Media storage: AWS S3
- Proxy/runtime: Nginx + Docker Compose

## Repository Top View

- Root workspace: `/Users/devscript/Documents/UndrAds/Snappy`
- Backend app: `/Users/devscript/Documents/UndrAds/Snappy/apps/backend`
- Frontend app: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend`
- Shared contracts: `/Users/devscript/Documents/UndrAds/Snappy/packages/shared-types`
- Flow docs index: `/Users/devscript/Documents/UndrAds/Snappy/docs/kt/README.md`
