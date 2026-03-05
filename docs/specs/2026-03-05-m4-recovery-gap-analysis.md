# M4 Recovery Gap Analysis (AC-by-AC)

Source of truth: `docs/specs/tasks-one-pager.md` (Acceptance Criteria section).

## Snapshot before this recovery
- `services/tasks-api` had core REST endpoints and API tests.
- `apps/tasks` was placeholder-only (no UI implementation).
- No FE component tests in `apps/tasks`.
- No E2E happy-path test scaffold.
- Milestone naming in spec had M4 as hardening, which conflicted with current recovery expectation (M4 UI, M5 hardening/CI/E2E).

## AC-by-AC gap mapping (before)
1. **Create/update/archive from UI** — **Missing** (no UI existed).
2. **Backlog list + filters + priority sorting** — **Missing** in UI.
3. **Kanban with DnD across todo/doing/done** — **Missing** in UI.
4. **Board sorted by time-in-status** — **Missing** in UI.
5. **Status transitions persist + update statusChangedAt** — API present; **UI path missing**.
6. **Prisma schema/migrations clean on fresh Postgres** — Present in M1 foundation.
7. **Consistent API validation error format** — Partially present in API; no UI coverage required here.
8. **Test baseline (API + FE list/board + 1 E2E)** — **Partially missing**: FE and E2E absent.
9. **Architecture alignment (Vite+React, Express, Prisma, Postgres)** — **Partially missing**: frontend implementation absent.
10. **No out-of-scope features in V1** — No violation observed.

## Recovery actions in this pass
- Implemented `apps/tasks` Vite+React UI:
  - backlog list + filters + priority-ordered query
  - kanban board + drag-and-drop status transitions
  - create/update/archive flows
  - detail panel for status/priority/title edits
- Added FE component tests (backlog/list controls, board time-in-status ordering, create/archive flow).
- Added one E2E happy-path scaffold (create -> move -> archive).
- Updated canonical milestone plan: **M4 = UI implementation against ACs**, **M5 = hardening/integration/CI**.
