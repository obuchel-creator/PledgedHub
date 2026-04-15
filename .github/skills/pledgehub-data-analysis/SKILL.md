---
name: pledgehub-data-analysis
description: 'Analyze and validate PledgeHub analytics/accounting data flows (SQL → services → API responses → frontend charts) and troubleshoot mismatches. Use when analytics numbers look wrong, dashboards drift from API responses, or you need to add a new metric safely. Triggers: analytics, data, dashboard, metrics, trends, reconciliation, report, chart, accounting totals.'
argument-hint: 'Which metric/dashboard looks wrong, and what’s the expected vs actual value?'
user-invocable: true
---

# PledgeHub Data Analysis Workflow (Analytics + Reporting)

A workflow for diagnosing “numbers don’t match” problems and safely adding metrics.

## When to Use
- Analytics endpoints return unexpected totals
- Frontend charts don’t match backend response fields
- Date-range filtering seems off
- Accounting totals/rollups need reconciliation

## Procedure

### 1) Identify the metric + definition
Write down:
- What is being counted/summed?
- Filters: date range, status, campaign, user/org scope
- Source of truth: DB columns and statuses

### 2) Trace the pipeline
1. Frontend call site (screen/component/hook)
2. Backend route handler
3. Service function
4. SQL query and mapping
5. Response shape consumed by UI

### 3) Validate SQL semantics
- Ensure filters are applied in SQL (not just in JS).
- Confirm date columns used are correct (e.g., `collection_date` vs `created_at`).
- Ensure numeric fields are parsed consistently.

### 4) Align response shapes
- If backend maps fields (e.g. `donor_name` → `donorName`), keep it consistent.
- Update docs/tests/UI together if a contract changes.

### 5) Verify with a controlled sample
- Use a known set of pledges/campaigns and calculate expected totals.
- Compare DB query results vs API output.

## Output
- Root cause analysis (where mismatch was introduced)
- Minimal patch plan (SQL vs mapping vs frontend)
- Verification steps (endpoint calls + visual confirmation)
