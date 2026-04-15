---
name: pledgehub-scaffold-api-feature
description: 'Scaffold a new PledgeHub backend /api feature (service + routes + server mount + integration test skeleton) using raw SQL and project conventions.'
argument-hint: 'Endpoint + feature (e.g., "GET /api/donations donations" or "POST /api/reports/trial-balance reports")'
agent: agent
---

You are working in the PledgeHub repo.

Task: scaffold a new backend REST API feature end-to-end (skeletons + wiring), following the workflow in [.github/skills/pledgehub-api-feature/SKILL.md](../skills/pledgehub-api-feature/SKILL.md).

Inputs: use the user-provided argument as the starting spec. If critical details are missing (auth level, DB tables, request/response fields), ask up to 3 clarifying questions before writing code.

Requirements (must follow):
- Raw SQL only (no ORM). Use `mysql2/promise` pool from `backend/config/db.js`.
- Parameterized queries only: `pool.execute('... WHERE x = ?', [value])`.
- Service response format is mandatory: `{ success: boolean, data?: any, error?: string }`.
- Keep route handlers thin: validate input → call service → return the service result.
- Auth:
  - Protected endpoints use `authenticateToken`.
  - Role gates use `requireStaff`/`requireAdmin` after auth.
   - Do NOT add a test-mode auth bypass; integration tests should obtain a real JWT via the auth endpoints.

What to generate (minimal skeleton):
1) `backend/services/<feature>Service.js`
   - Export stub function(s) for the endpoint(s)
   - Include TODO placeholders for SQL and validation

2) `backend/routes/<feature>Routes.js`
   - Define the route(s) under `/` (mounted later under `/api/<feature>`)
   - Apply appropriate middleware (rate limiter → auth → role gate)

3) Update `backend/server.js`
   - Mount the router: `app.use('/api/<feature>', <feature>Routes)`

4) Update `backend/scripts/test-all-features.js`
   - Add an integration test stub using the existing `test()` helper pattern
   - If endpoint is protected, use the existing `authHeaders()` helper

Non-goals:
- Do not implement full UI/screens unless explicitly requested.
- Do not add unrelated refactors.

Output:
- Make the edits directly in the repo.
- After changes, briefly list the files touched and how to run the integration test.
