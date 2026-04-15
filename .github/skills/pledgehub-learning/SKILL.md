---
name: pledgehub-learning
description: 'Learn the PledgeHub codebase quickly with a guided reading path (architecture → request flow → data model → tests). Use when onboarding, explaining how a feature works, or tracing a bug from UI to SQL. Triggers: explain, how does this work, onboarding, walkthrough, architecture, trace, data flow.'
argument-hint: 'What feature/file do you want to understand (e.g., "analytics trends endpoint" or "login flow")?'
user-invocable: true
---

# PledgeHub Learning Workflow

A structured approach to understanding how PledgeHub works, grounded in the real code paths.

## When to Use
- You’re new to the repo and need to understand a feature
- You need a trace from frontend → backend → DB
- You want a “map” of where to edit safely

## Procedure

### 1) Start with architecture anchors
- Backend entry + route mounts: `backend/server.js`
- Auth/RBAC: `backend/middleware/authMiddleware.js`
- DB pool: `backend/config/db.js`
- Services: `backend/services/`
- Frontend routing: `frontend/src/App.jsx`
- Frontend screens: `frontend/src/screens/`

### 2) Trace a single request end-to-end
For a given endpoint or screen:
1. Find where it’s called (frontend or test script).
2. Confirm backend route mount prefix and middleware.
3. Inspect the route handler.
4. Follow into service(s) and SQL.
5. Identify response shape and how the UI renders it.

### 3) Understand data shapes
- DB columns are snake_case.
- JS tends toward camelCase, but some services intentionally map fields.
- Note any mapping layer (e.g., `donor_name` vs `donorName`).

### 4) Validate with a tiny experiment
- Run the smallest reproduction:
  - a curl request
  - a single integration script in `backend/scripts/`
  - a minimal UI action with servers running (`./scripts/dev.ps1`)

### 5) Summarize your understanding
Produce:
- “What it does”
- “Where to change it”
- “What could break if changed”
- “How to verify”

## Output Format
- Short overview
- Bullet list of key files
- A step-by-step flow diagram in text (request → middleware → handler → service → SQL → response)
