# PledgeHub Copilot Agents & Skills

This repo includes custom GitHub Copilot **agents** (personas) and **skills** (repeatable workflows) to keep changes consistent with PledgeHub conventions.

## Custom Agents (personas)

- **Developer Assistant** (`.github/agents/developer-assistant.agent.md`)
  - Use for: day-to-day coding help across backend/frontend/tests/docs.
  - Good prompts: “Debug this 403”, “Refactor this route to move logic into services”, “Add a minimal integration test for this endpoint”.

- **API Docs Auditor** (`.github/agents/api-docs-auditor.agent.md`)
  - Use for: auditing `docs/API_DOCUMENTATION.md` against real route mounts/auth/response shapes.

- **Documentation Agent** (`.github/agents/documentation-agent.agent.md`)
  - Use for: general Markdown documentation work (guides, READMEs, troubleshooting).

- **Release Notes Agent** (`.github/agents/release-notes-agent.agent.md`)
  - Use for: drafting release notes/changelog-style summaries.

## Skills (repeatable workflows)

Invoke skills by typing `/` in Copilot Chat.

- `/pledgehub-api-feature` — scaffold a new REST API feature end-to-end (raw SQL service + routes + auth + tests).
- `/pledgehub-db-migration` — create/run MySQL migration scripts under `backend/scripts/` safely.
- `/pledgehub-testing-agent` — run/debug tests and add minimal coverage.
- `/pledgehub-debugging` — repro → isolate → inspect mounts/auth/SQL → fix → verify.
- `/pledgehub-refactoring` — safe refactors without behavior changes.
- `/pledgehub-learning` — guided codebase walkthrough and request tracing.
- `/pledgehub-devops` — Windows-first local run/setup + smoke checks.
- `/pledgehub-project-management` — scope → milestones → acceptance criteria → verification plan.
- `/pledgehub-documentation` — keep docs accurate vs code mounts/auth/shapes.
- `/pledgehub-security` — JWT/RBAC/middleware ordering/SQL safety review.
- `/pledgehub-data-analysis` — reconcile analytics/accounting metrics across SQL → API → UI.

## Tips

- For protected routes, the source of truth is `backend/server.js` mounts and `backend/middleware/authMiddleware.js` roles.
- Prefer raw SQL with parameterization (`pool.execute(..., [params])`).
- Keep route handlers thin; put business logic in `backend/services/`.
