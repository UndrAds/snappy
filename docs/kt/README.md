# Snappy KT Documentation (Flow-Based)

This KT set is split into multiple documents so a new intern can learn the system top-down and flow-by-flow.

## Suggested Reading Order

1. `docs/kt/01-system-overview.md`
2. `docs/kt/02-architecture-and-connections.md`
3. `docs/kt/03-backend-deep-dive.md`
4. `docs/kt/04-frontend-deep-dive.md`
5. `docs/kt/05-flow-auth-and-access.md`
6. `docs/kt/06-flow-story-creation-and-editing.md`
7. `docs/kt/07-flow-dynamic-rss-automation.md`
8. `docs/kt/08-flow-embed-and-analytics.md`
9. `docs/kt/09-flow-export-and-delivery.md`
10. `docs/kt/10-gotchas-and-debug-playbook.md`
11. `docs/kt/11-operations-deploy-and-runbook.md`

## Quick Scope Map

- Backend: API, business logic, DB schema, queue jobs, S3 integration.
- Frontend: dashboards, editor UI, admin UI, analytics pages, API client.
- Connection points: frontend <-> backend APIs, embed script <-> backend public APIs, backend <-> DB/Redis/S3.
- Critical behaviors: dynamic RSS story generation, analytics aggregation, H5 export generation, role-based access.

---

If you are handing over KT in sessions, use one file per session in the order above.
