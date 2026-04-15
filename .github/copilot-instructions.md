# PledgeHub – Project Guidelines

PledgeHub is a pledge management system with AI automation, reminders, OAuth, payments, analytics, and accounting. The repo is Windows-first (PowerShell scripts).

## Architecture

### Backend (Node.js + Express + MySQL)
- Raw SQL only (no ORM). Use the `mysql2/promise` pool from `backend/config/db.js`.
- Business logic lives in `backend/services/`; route handlers should stay thin.
- Routes live in `backend/routes/` and are mounted in `backend/server.js` under `/api/...`.
- Auth + RBAC lives in `backend/middleware/authMiddleware.js`.
  - JWT auth is required for protected routes; there is no auth-bypass test mode.
  - Roles are: `donor`, `creator`, `support_staff`, `finance_admin`, `super_admin`.
  - Prefer `requireRole(...)` / `requirePermission(...)`; `requireAdmin`/`requireStaff` are legacy helpers.

### Frontend (React + Vite)
- Dev server is `5173`.
- Vite proxies `/api` to the backend at `http://localhost:5001` (see `frontend/vite.config.js`).
- React Router is used for navigation; screens live under `frontend/src/screens/`.

### Automation (cron)
- Cron jobs run in Africa/Kampala timezone (see `backend/services/advancedCronScheduler.js`).

### Payments
- MTN/Airtel callbacks are public webhook endpoints and must be mounted before protected payment routes (see `backend/server.js`).
- Normalize Uganda phone numbers before provider calls: `256XXXXXXXXX` (no `+`, no leading `0`).

## Build and Test

### Fastest local dev (Windows)
- Start both servers: `./scripts/dev.ps1`

### Backend
- Install: `cd backend; npm install`
- Run: `npm run dev` (server on `5001`)
- Integration tests: `node scripts/test-all-features.js`
- Unit tests: `npm test` (Jest `--runInBand`)

### Frontend
- Install: `cd frontend; npm install`
- Run: `npm run dev` (Vite on `5173`)
- Tests: `npm test`

## Core Conventions

### Service response shape
- Service-layer functions should return: `{ success: boolean, data?: any, error?: string }`.

### SQL rules
- Always parameterize: `pool.execute('... WHERE id = ?', [id])`.
- DB columns are snake_case; JS is typically camelCase.
- Money values should be stored as `DECIMAL(15,2)`.

### Middleware ordering (follow the repo)
- Apply endpoint rate-limiters early (see `securityService.rateLimiters` usage in `backend/server.js`).
- Protected route patterns generally look like:
  - `rate limiter` → `authenticateToken` → `requireRole`/`requireStaff`/`requireAdmin` → router

### AI usage
- Always guard AI calls and provide fallbacks (see `backend/services/aiService.js` and `backend/services/messageGenerator.js`).

## Where to Look First
- Backend app + route mounting: `backend/server.js`
- Auth/RBAC: `backend/middleware/authMiddleware.js`
- DB pool: `backend/config/db.js`
- Integration test runner: `backend/scripts/test-all-features.js`
- Frontend routing: `frontend/App.jsx`

## Docs (link, don’t embed)
- Features overview: `docs/FEATURES_OVERVIEW.md`
- API reference: `docs/API_DOCUMENTATION.md`
- Deployment: `docs/DEPLOYMENT_GUIDE.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
- Frontend architecture: `docs/FRONTEND_ARCHITECTURE.md`
- Analytics: `docs/ANALYTICS_DASHBOARD.md`
- Accounting (repo-level docs): `ACCOUNTING_FEATURES_QUICK_START.md` and `ACCOUNTING_SYSTEM_COMPLETE.md`
- Analytics (repo-level index): `ANALYTICS_DOCUMENTATION_INDEX.md`

## Repo Copilot Customizations
- Index: `.github/AGENTS.md`
- Agents: `.github/agents/`
- Skills: `.github/skills/`
- Prompts: `.github/prompts/`
