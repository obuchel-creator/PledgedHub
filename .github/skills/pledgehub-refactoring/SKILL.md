---
name: pledgehub-refactoring
description: 'Refactor PledgeHub code safely (Express services/routes, raw SQL, React screens) without changing behavior. Use when removing duplication, simplifying route handlers, improving maintainability, or aligning response shapes. Triggers: refactor, cleanup, tech debt, rename, extract function, remove dead code, duplicate route, consistency.'
argument-hint: 'What module(s) to refactor and what must remain behavior-compatible?'
user-invocable: true
---

# PledgeHub Refactoring Workflow

Refactor with guardrails: keep behavior stable, preserve route contracts, and keep changes small and reviewable.

## When to Use
- Duplicate handlers in `backend/routes/*` (conflicting endpoints)
- Route handlers doing too much (logic belongs in `backend/services/`)
- Inconsistent response shapes or error handling
- Repeated SQL fragments or risky string concatenation
- Frontend components too large / repeated logic

## Constraints (Repo-specific)
- Raw SQL only (no ORM). Always parameterize queries.
- Keep route handlers thin; move business logic into `backend/services/`.
- Treat `backend/server.js` mounts + middleware as source of truth for auth.
- Don’t change behavior unless explicitly requested.

## Procedure

### 1) Define invariants (what must not change)
- Endpoint paths, status codes, and key JSON fields
- Auth/RBAC requirements
- DB query semantics
- UI behavior and routing

### 2) Build a safety net
- Identify the fastest verification point:
  - unit tests (Jest)
  - integration scripts (`backend/scripts/test-*.js`)
  - manual curl/postman reproducer
- If no tests exist for the area, consider adding minimal coverage only if the repo already uses tests for that layer.

### 3) Do the smallest refactor that improves structure
Common patterns:
- Extract: move logic from route handler → `backend/services/<feature>Service.js`
- Normalize response shape: `{ success, data, error }`
- Remove dead/duplicate routes to eliminate ambiguity
- Consolidate repeated SQL while keeping queries readable

### 4) Preserve compatibility
- Avoid renaming JSON fields returned to existing clients unless coordinated.
- If you must change response shape, update:
  - frontend callers
  - integration scripts
  - `docs/API_DOCUMENTATION.md`

### 5) Verify and document
- Re-run the safety net command.
- Make sure there are no new lint/type errors.
- Summarize the refactor with a short “before/after” explanation.

## Decision Points
- **Behavior change required?**
  - If no → refactor only.
  - If yes → treat as a feature change: update tests and docs.
- **Where does the logic belong?**
  - Request parsing + auth checks in routes.
  - DB + business rules in services.

## Quality Checklist
- No endpoint contract changes unless explicitly intended
- SQL remains parameterized
- Auth middleware remains correct and verified in `backend/server.js`
- Changes are small, readable, and easy to review
