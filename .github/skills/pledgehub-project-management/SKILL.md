---
name: pledgehub-project-management
description: 'Plan and track PledgeHub work with clear milestones, acceptance criteria, and verification steps. Use when scoping a feature, coordinating backend+frontend+docs changes, or preparing a release/deployment checklist. Triggers: plan, roadmap, milestones, tasks, acceptance criteria, release, rollout, checklist.'
argument-hint: 'What are you trying to deliver, by when, and what must be true for it to be “done” ?'
user-invocable: true
---

# PledgeHub Project Management Workflow

A lightweight planning method that fits the repo’s structure (backend/services/routes, frontend/screens, docs, tests).

## When to Use
- Multi-step features crossing backend/frontend/docs
- Hard-to-define “done” criteria
- Coordinating integration scripts and documentation updates

## Procedure

### 1) Define scope and non-goals
- What is being delivered?
- What is explicitly out of scope?

### 2) Identify impacted areas
- Backend routes/services/SQL
- Auth/RBAC
- Frontend screens
- Tests (Jest + integration scripts)
- Docs (`docs/API_DOCUMENTATION.md`, guides)

### 3) Write acceptance criteria
Examples:
- Endpoint returns `200` with `{ success: true, data: ... }`
- Protected routes return `401` without JWT and `403` for wrong role
- Frontend screen loads without console errors and displays key metrics

### 4) Break into ordered tasks
- Keep tasks small, independently verifiable.
- Prefer “thin routes, services for logic, parameterized SQL”.

### 5) Verification plan
- Smallest reproducer
- Targeted test commands
- Optional broader test sweep

### 6) Change log / release notes (if needed)
- Summarize behavior changes
- Include any migration/runbook steps

## Output
- A short milestone list
- A verification checklist
- Open questions (max 3)
