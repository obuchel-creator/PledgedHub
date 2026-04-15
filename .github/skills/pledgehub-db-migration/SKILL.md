---
name: pledgehub-db-migration
description: 'Create and run PledgeHub MySQL schema migrations safely using the repo’s Node.js scripts (raw SQL via mysql2/promise pool). Use when adding/changing tables/columns/indexes, fixing production schema drift, or preparing a deploy. Triggers: migration, migrate, schema, alter table, index, column, table, mysql, database change.'
argument-hint: 'What schema change do you need (tables/columns/indexes) and is it safe to be destructive?'
user-invocable: true
---

# PledgeHub DB Migration Workflow

PledgeHub uses **raw SQL** and migration-style **Node scripts** under `backend/scripts/` (not an ORM migration system). This workflow keeps schema changes safe, repeatable, and easy to verify.

## When to Use
- Add/alter tables, columns, constraints, or indexes
- Fix schema drift (dev/staging/prod differences)
- Create one-off backfills or data corrections that must be tracked

## Repo Conventions
- DB access: use the `mysql2/promise` pool from `backend/config/db.js`.
- Prefer parameterized SQL for data operations; DDL often uses static SQL strings.
- Name scripts consistently (examples already in repo):
  - `backend/scripts/migrate-<feature>.js`
  - `backend/scripts/migration-YYYYMMDD-<change>.js`

## Procedure

### 1) Define the change precisely
- What objects change? (table/column/index)
- Is it additive (safe) or destructive (drops/renames)?
- Does the app code expect snake_case columns?

### 2) Search existing migrations first
- Check `backend/scripts/` for existing scripts touching the same tables.
- Avoid creating a second migration that re-does the same schema work.

### 3) Write a migration script (recommended pattern)
- Create a new file under `backend/scripts/` with a descriptive name.
- Use `const { pool } = require('../config/db');`.
  - Start from the template: [migration-template.js](./assets/migration-template.js)
- Prefer:
  - `CREATE TABLE IF NOT EXISTS ...`
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` (if supported on your MySQL version)
  - `DROP TABLE IF EXISTS ...` only when explicitly intended
- Use a single connection (`await pool.getConnection()`), and always release it.
- If multiple steps must be atomic, wrap them in a transaction:
  - `BEGIN` → statements → `COMMIT` (and `ROLLBACK` on error)

### 4) Add safety guards
- Log each step clearly (start, each DDL, done).
- If destructive, add an explicit guard (env var / confirmation) before proceeding.
- Make scripts re-runnable when possible (idempotent).

### 5) Run locally
- Ensure `backend/.env` points to the intended DB.
- Run:
  - `node backend/scripts/<your-migration>.js`

### 6) Verify
- Check schema:
  - `SHOW CREATE TABLE <table>;`
  - `SHOW INDEX FROM <table>;`
- Run the narrowest validation:
  - the endpoint(s) that use the changed schema
  - related integration script(s) under `backend/scripts/`

### 7) Update docs/tests if needed
- If API behavior changes because of schema changes, update:
  - `docs/API_DOCUMENTATION.md`
  - any affected tests/integration scripts

## Quality Checklist
- Migration is named clearly and lives under `backend/scripts/`
- Uses the shared DB pool (`backend/config/db.js`)
- Logs steps and handles errors
- Connection is released even on failure
- Idempotent or clearly documented as one-time/destructive
- Verification steps are provided
