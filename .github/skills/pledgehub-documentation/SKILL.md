---
name: pledgehub-documentation
description: 'Keep PledgeHub documentation accurate and link-first by auditing docs against real code mounts, auth/RBAC, and response shapes. Use when docs drift, endpoints change, or troubleshooting/runbooks need updates. Triggers: docs, documentation, README, API documentation, guide, troubleshooting, deployment guide.'
argument-hint: 'Which doc is wrong/outdated and what behavior should it reflect?'
user-invocable: true
---

# PledgeHub Documentation Alignment Workflow

This skill encodes the “docs must match reality” methodology used in this repo.

## When to Use
- `docs/API_DOCUMENTATION.md` mismatches actual endpoints
- Auth/RBAC in docs differs from `backend/server.js` mounts
- Examples are outdated (request/response fields)
- Run commands in docs don’t match `package.json` scripts or PowerShell scripts

## Sources of Truth (verify before editing docs)
- Route prefixes + middleware: `backend/server.js`
- Auth/RBAC roles and helpers: `backend/middleware/authMiddleware.js`
- DB + SQL behavior: `backend/services/*`, `backend/config/db.js`
- Frontend entry points: `frontend/src/App.jsx`, `frontend/vite.config.js`
- Build/test commands: `backend/package.json`, `frontend/package.json`, `scripts/*.ps1`

## Procedure

### 1) Locate the doc section
- Search for the endpoint/feature name.

### 2) Verify actual behavior
- Confirm mount path and auth middleware in `backend/server.js`.
- Inspect route handler and note:
  - request body/query params
  - response shape + status codes

### 3) Patch docs minimally
- Fix incorrect auth claims first (public vs protected).
- Fix paths and request/response JSON examples.
- Add/remove endpoints only when confirmed in code.

### 4) Keep docs navigable
- Prefer short examples and bullet lists.
- Link to deeper docs instead of duplicating long content.

### 5) Verify consistency
- Postman list and curl examples should not 401/404 due to missing headers or wrong paths.

## Output
- List the files edited
- Summarize what drift was fixed
- Note any remaining ambiguities (max 3)
