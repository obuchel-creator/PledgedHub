---
name: pledgehub-devops
description: 'Run and operate PledgeHub locally (Windows-first), including dev startup, environment setup, ports/proxies, and smoke checks. Use when setting up a new machine, debugging server startup, or preparing a deployment checklist. Triggers: devops, run, start, setup, env, .env, port, proxy, deployment, build.'
argument-hint: 'What are you trying to run (dev, tests, build, deploy) and what error do you see?'
user-invocable: true
---

# PledgeHub DevOps Workflow (Local + Basic Ops)

This skill focuses on reliably running PledgeHub and diagnosing environment/runtime issues.

## When to Use
- New dev machine setup
- Backend won’t start / can’t connect to MySQL
- Frontend can’t hit backend (`/api` issues)
- Need a quick pre-deploy sanity checklist

## Local Dev (Windows-first)

### Preferred: start both servers
- `./scripts/dev.ps1`

### Backend
- Install: `cd backend; npm install`
- Run: `npm run dev` (port `5001`)
- Needs MySQL config in `backend/.env`

### Frontend
- Install: `cd frontend; npm install`
- Run: `npm run dev` (port `5173`)
- Proxy: `frontend/vite.config.js` proxies `/api` → `http://localhost:5001`

## Procedure

### 1) Confirm ports and reachability
- Backend should respond on `http://localhost:5001`.
- Frontend should respond on `http://localhost:5173`.
- If frontend API calls fail:
  - verify Vite proxy config
  - verify backend is running

### 2) Validate environment configuration
- Backend: `backend/.env` should contain DB credentials + any third-party keys.
- AI is optional and should fail gracefully if missing key.

### 3) Smoke checks (minimal)
- Start servers and hit:
  - `GET /api/ai/status` (requires JWT + staff)
  - `GET /api/analytics/platform-stats` (public)
- Run a targeted integration script if available:
  - `node backend/scripts/test-all-features.js`

### 4) Deployment-oriented checklist (high level)
- Ensure DB migrations are applied
- Verify webhook endpoints are mounted before protected payment routes
- Confirm JWT secret/env vars configured
- Confirm timezone-sensitive cron jobs use `Africa/Kampala`

For a full deployment runbook, link to the canonical guide instead of duplicating steps here:
- `docs/DEPLOYMENT_GUIDE.md`

## Output
- A short “runbook” of the commands to execute
- The likely root cause buckets if something fails (ports, env, DB, auth)
