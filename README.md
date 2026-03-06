# sindustries monorepo

Sindustries is organized as a monorepo with explicit boundaries between product surfaces, backend execution, shared code, and operations.

## Monorepo layout

- `apps/` — user-facing runnable applications (primarily front-end surfaces)
  - `apps/tasks/` — first product surface (initial focused app)
  - `apps/mission-control/` — future aggregate shell/orchestrator UI
- `services/` — backend APIs, workers, and long-running service processes
- `packages/` — shared libraries, types, utilities, and cross-cutting configs
- `infra/` — infrastructure, environments, and deployment/runtime definitions
- `docs/` — architecture, specifications, and decision records

## Direction

Current repo state is **early implementation**: documentation plus Milestone 1 backend foundation in `services/tasks-api`.

Planned product evolution:
1. Build and prove the focused `tasks` surface.
2. Evolve `mission-control` into the aggregate shell that hosts cross-app workflows (including `tasks`, collaboration, and future surfaces).
3. Keep domain boundaries strict so apps can ship independently while sharing stable packages/services.

## Local setup (dev)

### Prerequisites
- macOS with Homebrew
- Node.js 22+

### One-time bootstrap
From repo root:

```bash
make bootstrap
```

This installs local tooling (`colima`, `docker` CLI, `tilt`, `node` if missing) and npm deps for current app/service packages.

### Start dev stack

```bash
make up
```

This starts the hybrid dev stack (Postgres in Docker/Colima + app/api via Tilt-managed local processes).

### Reset local DB

```bash
make reset-db
```

### Stop dev stack

```bash
make down
```

### Run tests

```bash
make test
```

Or run individually:

```bash
make test-api
make test-app
make test-e2e
```

## Working method

For non-trivial work, use spec-first delivery:
- write/update a spec in `docs/specs/`
- implement in small mergeable slices
- validate before merge
- document risks and mitigations

See `CONTRIBUTING.md` for the full Definition of Done. Have fun!
