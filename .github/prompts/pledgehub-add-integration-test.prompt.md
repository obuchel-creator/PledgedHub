---
name: pledgehub-add-integration-test
description: 'Add a new endpoint test block to backend/scripts/test-all-features.js using the repo’s existing test() helper and authHeaders() pattern.'
argument-hint: 'METHOD + path + brief purpose (e.g., "GET /api/analytics/overview analytics overview")'
agent: agent
---

You are working in the PledgeHub repo.

Task: Add a targeted integration test for a single API endpoint by editing `backend/scripts/test-all-features.js`.

Inputs: Use the user-provided argument as the endpoint spec.

Before writing code, ask up to 3 clarifying questions ONLY if needed to make the test correct, such as:
- Is the endpoint public or protected?
- Does it require `support_staff` or `super_admin` role?
- Does it need a request body? Provide a minimal example.
- What success condition should be asserted (fields/status)?

Requirements (must follow)
- Follow the existing `test(name, fn)` helper pattern used in `backend/scripts/test-all-features.js`.
- Use `authHeaders()` for protected endpoints (Authorization: Bearer token). Do not invent any auth-bypass test mode.
- Keep the test minimal and deterministic:
  - Prefer asserting `res.data.success === true` (or expected shape) and the presence of key fields.
  - Avoid timing-dependent waits.
- If the endpoint needs setup data (e.g., creating a pledge/campaign first), reuse IDs already created earlier in the file if available; otherwise add the smallest setup needed.

Edits
1) Insert a new feature section (or add to an existing related section) with:
   - a `log('blue', ...)` header
   - one `await test('...', async () => { ... })` block
   - update `results.passed` / `results.failed` counters consistent with surrounding code

2) If the endpoint requires higher privileges and the integration runner’s test user role is insufficient, update the role assignment in the auth setup to the correct repo role.
   - Prefer `super_admin` when an endpoint is guarded by `requireAdmin`.

Output
- Apply edits directly.
- After editing, list what was changed and show the exact command to run: `node backend/scripts/test-all-features.js`.
