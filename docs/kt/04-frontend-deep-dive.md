# 04. Frontend Deep Dive

Frontend root:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend`

## 1. App Bootstrap and Route Topology

Bootstrap:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/main.tsx`

App routes:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/App.tsx`

Routing behavior:
- Protected route wrapper requires authenticated user.
- Admin protected wrapper enforces role.
- Admin user auto-redirects from dashboard root to `/admin`.

## 2. API Integration Layer

File:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/lib/api.ts`

Responsibilities:
- Central Axios instance + baseURL.
- Request interceptor adds auth token.
- Response interceptor handles 401 by clearing session and redirecting to login.
- Domain-specific API modules:
  - `authAPI`
  - `userAPI`
  - `storyAPI`
  - `rssAPI`
  - `uploadAPI`
  - `contentAPI`
  - `analyticsAPI`
  - `adminAPI`

Why this abstraction:
- Keeps pages focused on UI logic and state transitions.

## 3. Auth State and Session Management

Hook:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/hooks/useAuth.ts`

How it works:
- Reads user/token from localStorage on app init.
- Mutations for login/register/updateProfile.
- Refreshes profile from backend to capture latest role/state.
- Logout clears local storage + query cache.

## 4. Main UX Modules

### 4.1 Dashboard Shell
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/components/DashboardLayout.tsx`

Purpose:
- Shared layout for authenticated areas.
- Sidebar entries vary by role.
- Theme toggle and profile actions.

### 4.2 Story Creation and Metadata Editing
- Create page: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/CreateSnapPage.tsx`
- Edit page: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/EditStoryPage.tsx`

Capabilities:
- Basic story metadata.
- Format/device settings.
- Dynamic RSS config + ad insertion strategy.
- Publisher image upload.
- Admin advertiser assignment.
- Trigger transition into full editor.

### 4.3 Full Story Editor
- Main page: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/editor/EditorPage.tsx`
- Layout: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/editor/EditorLayout.tsx`
- Supporting components under `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/editor/components`

Core editor behaviors:
- Load by uniqueId and map DB frames to editor state.
- Add/remove/duplicate/reorder frames.
- Add/update/remove elements.
- Manage backgrounds and frame properties.
- Save complete story payload.
- Trigger preview/embed/export modals.

### 4.4 Analytics Pages
- Summary analytics: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/AnalyticsPage.tsx`
- Story detail analytics: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/StoryAnalyticsPage.tsx`
- Admin per-user analytics: `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/UserAnalyticsPage.tsx`

Usage:
- Fetch aggregated and day-wise analytics.
- Display totals, trends, CTR, viewability, revenue (using CPM).

### 4.5 Admin Console
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/src/pages/AdminDashboardPage.tsx`

Capabilities:
- Platform stats
- Users table with search/pagination/sort
- Stories table with filtering/edit/delete
- Link to user-level analytics

## 5. Embed Runtime Script

File:
- `/Users/devscript/Documents/UndrAds/Snappy/apps/frontend/public/webstory-embed.js`

What it does:
- Discovers embed containers (`ins[id^='snappy-webstory-']`).
- Fetches public story payload.
- Renders iframe player with frame progression.
- Supports regular + floater mode using embed config.
- Sends analytics events back to backend.

Why this is critical:
- It is the distribution runtime used outside the main frontend app.
- It must stay backward compatible with already embedded snippets.

## 6. Frontend Connection to Backend (Practical)

Key endpoint usage by module:
- Auth pages -> `/api/auth/*`
- Dashboard pages -> `/api/stories`, `/api/analytics`
- Editor -> `/api/stories/*` CRUD + `/api/uploads/*`
- Dynamic controls -> `/api/rss/*`
- Export modal -> `/api/stories/:id/export/*`
- Admin pages -> `/api/admin/*`

## 7. Why Frontend Is Structured This Way

- Clear split between metadata pages and deep editor for performance and maintainability.
- Shared API module reduces endpoint drift and duplicated request code.
- Separate embed runtime avoids forcing host websites to run full React app.
- Role-aware route wrappers reduce accidental admin feature exposure.
