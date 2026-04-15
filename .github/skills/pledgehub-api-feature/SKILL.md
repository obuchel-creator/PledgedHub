---
name: pledgehub-api-feature
description: 'Create a new PledgeHub REST API feature end-to-end (raw SQL service + routes + auth + tests). Use when adding new /api endpoints, service-layer business logic, or DB-backed features.'
argument-hint: 'Feature name + endpoint (e.g., "donations GET /api/donations")'
user-invocable: true
---

# PledgeHub API Feature Workflow

Build a new backend feature using the project’s conventions: **raw SQL (no ORM)**, **service-layer business logic**, **Express routes under `/api`**, and **tests**.

## When to Use
- Adding a new `/api/...` endpoint
- Creating or updating a service in `backend/services/`
- Adding DB-backed functionality (new tables/columns/queries)
- Wiring up auth (JWT + roles) and keeping behavior testable via test mode

## Inputs (decide up front)
- Endpoint(s): method + path (e.g., `GET /api/reports/trial-balance`)
- Auth: public vs JWT-protected (`authenticateToken`) vs role-gated (`requireStaff`/`requireAdmin`)
- Data: which tables/columns are involved; whether a migration is needed
- Frontend impact: new screen/controls vs backend-only

## Procedure
1. Define the API contract
   - Response shape (required): `{ success: boolean, data?: any, error?: string }`
   - Status codes: use 2xx for success, 4xx for validation/not-found, 5xx for unexpected errors
   - Identify validation rules (required fields, types, ranges)

2. If schema changes are required, add a migration script
   - Create a new timestamped script in `backend/scripts/` (do not auto-migrate on startup)
   - Use parameterized SQL; keep the script idempotent when practical
   - Update thin model wrappers in `backend/models/` only if the project already uses them for that entity

3. Implement business logic in a service
   - Create/update `backend/services/<feature>Service.js`
   - Use `mysql2/promise` pool from `backend/config/db.js`
   - Always use `pool.execute()` with placeholders (never string concatenation)
   - Wrap in `try/catch` and return `{ success: false, error: error.message }` on failure

4. Add/extend the route file
   - Create/update `backend/routes/<feature>Routes.js`
    - Apply middleware in the standard order:
       - Public auth endpoints: rate limiter first (e.g., `securityService.rateLimiters.auth`), then handler
       - Protected endpoints: rate limiter first (e.g., `securityService.rateLimiters.api`/`securityService.rateLimiters.payment`), then `authenticateToken`, then `requireRole`/`requireStaff`/`requireAdmin` as needed
   - Keep route handlers thin: validate input → call service → return service result

5. Register the route in the server
   - In `backend/server.js`, mount under `/api/<feature>`
   - Confirm CORS/proxy assumptions remain valid for localhost dev

6. (If needed) Add frontend integration
   - Add/modify a screen in `frontend/src/screens/` (project uses React Router)
   - Call the backend via `/api/...` (Vite proxy handles localhost)
   - Include JWT in `Authorization: Bearer <token>` for protected endpoints

7. Add tests
   - Integration: extend `backend/scripts/test-all-features.js` following the existing `test()` helper pattern
     - Log clear pass/fail messages; store created IDs for follow-up tests
   - Unit (optional, when logic is non-trivial): add `backend/tests/<feature>.test.js` using Jest + Supertest
     - Mock models/services at the model boundary if that’s the local convention

8. Validate locally
   - Run integration tests: `node backend/scripts/test-all-features.js`
   - Run unit tests (if present): `cd backend && npm test`
   - Smoke test the endpoint manually (curl/Postman) if it’s hard to cover in tests

## Decision Points (common branches)
- **Auth vs public**: If it mutates state or exposes user data, default to `authenticateToken`.
- **Auth in tests**: Integration tests should obtain a real JWT via the auth endpoints; `backend/middleware/authMiddleware.js` does not support an auth-bypass test mode.
- **Roles**: Admin-only for system-wide actions; staff for operational workflows; user for self-scoped data.
- **AI usage**: Always guard with `aiService.isAIAvailable()` and provide a non-AI fallback.
- **Cron/automation**: If adding scheduled work, ensure timezone is `Africa/Kampala`.
- **Mobile money**: Normalize phone numbers to `256XXXXXXXXX` (no `+`, no leading `0`) before provider calls.

## Quality Checklist (done = safe to merge)
- Returns `{ success, data?, error? }` consistently
- All SQL is parameterized via `pool.execute()`
- No ORM introduced; model wrappers stay thin
- Auth middleware and role checks are correct (and test mode behavior remains sane)
- Integration test added/updated and passes
- Any new env vars are added to `backend/.env.example` (if applicable)
