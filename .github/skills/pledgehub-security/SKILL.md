---
name: pledgehub-security
description: 'Audit and harden PledgeHub security basics (JWT auth, RBAC, middleware ordering, SQL safety, webhook exposure). Use when reviewing protected routes, investigating auth bugs, or adding new endpoints that must be secure by default. Triggers: security, auth, jwt, rbac, permissions, requireRole, requirePermission, sql injection, webhook, rate limit.'
argument-hint: 'What endpoint/feature are you securing or what vulnerability concern do you have?'
user-invocable: true
---

# PledgeHub Security Workflow

A pragmatic security checklist tailored to the repo conventions.

## When to Use
- Adding/modifying `/api/*` endpoints
- Investigating unauthorized access, role bugs, or leaked data
- Payments/webhooks work (public callbacks)
- Reviewing SQL safety

## Security Sources of Truth
- Auth + RBAC middleware: `backend/middleware/authMiddleware.js`
- Route mounting order: `backend/server.js`
- DB pool + parameterization: `backend/config/db.js`

## Procedure

### 1) Confirm auth posture
- Protected endpoints must include `authenticateToken`.
- Use role-based helpers (prefer `requireRole(...)` / `requirePermission(...)` when available).
- Use only real roles:
  - `donor`, `creator`, `support_staff`, `finance_admin`, `super_admin`

### 2) Verify middleware ordering
- Apply rate limiters early (where used).
- Payments callbacks must be mounted before protected payment routes.

### 3) Validate request validation
- Check required fields and types.
- Avoid trusting client-provided IDs without authorization checks.

### 4) SQL safety
- Always parameterize (`pool.execute('... WHERE id = ?', [id])`).
- Avoid string concatenation.

### 5) Response hygiene
- Avoid returning secrets/PII unnecessarily.
- Use consistent error shapes (`{ success: false, error, details? }`).

### 6) Verification
- Confirm `401` without JWT, `403` with wrong role.
- Add/extend tests or integration scripts for auth behavior where feasible.

## Output
- A short security finding list (risk + fix)
- Minimal code changes if requested
- Verification steps (curl/tests)
