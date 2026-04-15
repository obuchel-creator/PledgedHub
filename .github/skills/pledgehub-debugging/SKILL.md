---
name: pledgehub-debugging
description: 'Debug PledgeHub backend/frontend issues using a repeatable workflow (repro → isolate → inspect mounts/auth/SQL → fix → verify). Use when chasing 401/403/404, DB errors, crashing routes, broken UI flows, or flaky tests. Triggers: debug, bug, error, stack trace, 500, 404, 401, 403, ECONNREFUSED, ER_ACCESS_DENIED, mysql, jwt.'
argument-hint: 'What is broken + the exact error output (and which command/action reproduces it)?'
user-invocable: true
---

# PledgeHub Debugging Workflow

A fast, repeatable debugging loop tuned to this repo’s architecture (Express + raw SQL + JWT/RBAC + React/Vite) and Windows-first tooling.

## When to Use
- Backend endpoint returns `401/403/404/500`
- DB errors: `ECONNREFUSED`, `ER_ACCESS_DENIED_ERROR`, missing table/column
- Frontend fails to load data or shows blank/error states
- Integration scripts fail (`backend/scripts/test-*.js`)
- You suspect middleware ordering or route mounting issues

## Procedure

### 1) Reproduce with the smallest action
- Prefer a single request (curl/Postman) or a single test script command.
- Capture:
  - endpoint + method
  - request body/query
  - status code + response JSON
  - backend console output/stack trace

### 2) Classify the failure (choose branch)

#### A) `401 Unauthorized` / `403 Forbidden`
1. Verify route protection in `backend/server.js` (mount order + middleware).
2. Confirm the caller sends `Authorization: Bearer <token>`.
3. Confirm role requirements using `backend/middleware/authMiddleware.js`.
4. Use real roles only:
   - `donor`, `creator`, `support_staff`, `finance_admin`, `super_admin`
   - There is no auth-bypass test mode.
5. If a test script fails:
   - Ensure it performs login/register and attaches JWT headers.
   - If admin-only routes are needed, standardize on `super_admin` in tests.

#### B) `404 Not Found`
1. Confirm the route is mounted in `backend/server.js` under the expected `/api/...` prefix.
2. Confirm the route exists in the router file under `backend/routes/`.
3. Look for duplicate or conflicting route handlers in the same router.

#### C) `500` or runtime crash
1. Find the first stack trace line pointing to your code.
2. Inspect the route handler, then the corresponding service in `backend/services/`.
3. Validate common causes:
   - undefined request fields
   - missing `await`
   - thrown errors not caught
   - unexpected DB result shapes

#### D) DB errors
1. Confirm MySQL connectivity and `backend/.env` configuration.
2. Check raw SQL for:
   - missing `?` parameterization
   - wrong column names (DB is snake_case)
   - incorrect joins
3. If schema mismatch is suspected:
   - locate and run the relevant migration/seed scripts under `backend/scripts/`.

#### E) Frontend API / data loading
1. Confirm Vite proxy in `frontend/vite.config.js` (`/api` → `http://localhost:5001`).
2. Confirm backend is running on `5001`.
3. Verify the endpoint auth requirements match what the frontend sends.
4. Check browser network tab for status/response and correlate with backend logs.

### 3) Inspect “source of truth” files
- Route mounting + auth: `backend/server.js`
- Auth + RBAC helpers: `backend/middleware/authMiddleware.js`
- DB pool: `backend/config/db.js`
- Business logic: `backend/services/`
- Frontend routing + screens: `frontend/src/App.jsx`, `frontend/src/screens/`

### 4) Fix the root cause (minimal change)
- Prefer fixing implementation/config over weakening tests.
- Preserve existing public APIs unless required.
- Service-layer functions should prefer returning `{ success: boolean, data?: any, error?: string }`.

### 5) Verify
- Re-run the exact reproducer first.
- Then run the narrowest suite that covers the change:
  - Backend: `cd backend; npm test` (if applicable)
  - Frontend: `cd frontend; npm test` (if applicable)
  - Integration: `node backend/scripts/test-<feature>.js`
  - Full: `./scripts/run-tests.ps1`

## Quality Checklist
- Repro steps are written and reliable
- Fix addresses root cause (not a timing hack)
- SQL touched is parameterized
- Auth/RBAC claims are verified in `backend/server.js`
- Tests/docs updated only if behavior changed
