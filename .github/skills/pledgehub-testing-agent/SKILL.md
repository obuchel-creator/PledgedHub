---
name: pledgehub-testing-agent
description: 'Run, debug, and extend PledgeHub tests (PowerShell runner, backend Jest, frontend Jest, and backend integration scripts like test-all-features.js). Use when a test fails, before merging a feature, or when adding coverage for new /api endpoints.'
argument-hint: 'What to test or failure snippet (e.g., "backend unit tests", "test-all-features payments failing 403", "frontend jest failing AuthScreen")'
user-invocable: true
---

# PledgeHub Testing Agent Workflow

A repeatable workflow for running the right test suite, diagnosing failures quickly, and adding minimal new coverage that matches existing repo patterns.

## When to Use
- A CI/local test is failing and you need to isolate root cause
- You added/changed an endpoint under `/api/...` and need coverage
- You changed SQL, auth/RBAC, or payments and want targeted verification
- You want a “pre-merge” sanity pass across backend + frontend

## Test Entry Points (choose the smallest scope that reproduces)

### Full workspace (Windows)
- `./scripts/run-tests.ps1` (runs `npm test` in `backend/` and `frontend/` if present)
- `./scripts/dev.ps1` (starts both servers for manual/integration testing)

### Backend
- Unit tests: `cd backend; npm test`
- Coverage: `cd backend; npm run coverage`
- Integration runner (requires backend running + DB available): `node backend/scripts/test-all-features.js`
- Targeted integration scripts: `node backend/scripts/test-<feature>.js`

### Frontend
- Unit tests: `cd frontend; npm test`
- Coverage: `cd frontend; npm run test:coverage`

## Procedure
1. Identify test type and runtime dependencies
   - Unit tests (Jest) should run without the backend server.
   - Integration scripts under `backend/scripts/` typically require:
     - backend running at `http://localhost:5001`
     - a working MySQL connection via `backend/.env`

2. Reproduce with the smallest command
  - Default order: run unit tests first (fast signal).
    - Backend: `cd backend; npm test`
    - Frontend: `cd frontend; npm test`
  - If you touched both, run `./scripts/run-tests.ps1`.
  - If failure looks like auth/DB/routing, reproduce via the specific integration script (or `test-all-features.js`).

3. Triage quickly (common buckets)
   - **Auth/RBAC (401/403)**
     - Protected routes require real JWT auth (no auth-bypass test mode).
     - Confirm the test obtains a token via `/api/auth/login` and sends `Authorization: Bearer <token>`.
     - Confirm the test user’s role matches repo roles: `donor`, `creator`, `support_staff`, `finance_admin`, `super_admin`.
       - Note: some older scripts may still set role to `admin` (legacy). That role is not recognized by current RBAC helpers; prefer setting `role = 'super_admin'` when an integration script needs admin-only access.
   - **DB (ECONNREFUSED / ER_ACCESS_DENIED / missing columns)**
     - Verify `backend/.env` values and that MySQL is running.
     - If a column/table is missing, run the relevant migration script in `backend/scripts/`.
   - **Route mounting / 404**
     - Confirm `backend/server.js` mounts the router under the expected `/api/...` prefix.
   - **Frontend API calls**
     - Confirm Vite proxy (see `frontend/vite.config.js`) and backend port `5001`.

4. Fix at the root cause
   - Prefer changing the implementation over weakening tests.
   - Keep fixes minimal and consistent with existing patterns.

5. Add/adjust coverage (only for the change you made)
   - For new endpoints: add a block to `backend/scripts/test-all-features.js` following the existing `test(name, fn)` pattern.
   - For backend unit tests: add/update `backend/tests/**/*.test.js` (Jest + Supertest). Mirror existing mocking conventions.
   - For frontend: add/update `frontend/src/**/__tests__/**/*.test.jsx` using Testing Library.

6. Verify
   - Re-run the exact failing command first.
   - Then run one broader suite (`./scripts/run-tests.ps1` or `node backend/scripts/test-all-features.js`) if time allows.

## Decision Points
- **Which suite first?**
  - Default: unit tests first (fast + isolated).
  - If you changed routes/auth/SQL or are chasing a 401/403/404/DB error: integration script next (after ensuring server + DB are up).
- **Where to add coverage?**
  - End-to-end feature behavior: integration runner.
  - Pure function behavior: unit tests.
  - UI behavior: frontend tests.

## Standardization (recommended)
- If an integration script needs elevated access (endpoints protected by `requireAdmin`), standardize on `super_admin` for the test user role.

## Quality Checklist
- Failure is reproduced locally with a minimal command
- Fix is root-cause (not a flaky retry / timing hack)
- New coverage is targeted and matches existing style
- Backend service response shape stays consistent: `{ success, data?, error? }`
- All SQL touched remains parameterized (`pool.execute`)
