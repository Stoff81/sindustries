# Contributing

## Working model

This repo follows a **spec-first** workflow for any non-trivial change.

### Non-trivial means
A change that alters architecture, introduces/refactors modules, changes behavior across boundaries, or takes more than a tiny isolated edit.

## Required flow (non-trivial work)
1. Pass a **Clarification Gate**
   - Ask questions if needed, or explicitly state why no clarification is needed.
   - Record assumptions.
2. Write/update a short **spec** under `docs/specs/` before implementation:
   - problem
   - scope
   - assumptions
   - non-goals
   - decisions/tradeoffs
3. Implement in small, mergeable slices.
4. Validate with appropriate checks/tests and document manual verification where relevant.
5. Include rollback/mitigation notes for operational safety.
6. Merge to `main` with follow-up tasks recorded if anything is deferred.

## Definition of Done (DoD)
A task is only Done when all are true:

1. **Feature works**
   - Acceptance criteria are met.
   - No known regressions introduced.

2. **Validated**
   - Appropriate tests/checks executed.
   - Manual verification steps documented when needed.

3. **Specification documentation included**
   - Problem, scope, assumptions, non-goals.
   - Design decisions and tradeoffs.

4. **Operational safety covered**
   - Rollback/mitigation notes captured.
   - Risk notes included for unresolved concerns.

5. **Merged to `main`**
   - Work is integrated into `main`.
   - Any required follow-up tasks are recorded.

6. **Handoff complete**
   - Short plain-English summary includes:
     - What changed
     - How to use it
     - What to watch

## Repo conventions
- `apps/` for user-facing runnable app surfaces.
- `services/` for backend APIs/workers/processes.
- `packages/` for shared libraries/types/config.
- `infra/` for deployment/runtime/infrastructure config.
- `docs/` for architecture, specs, and design records.
