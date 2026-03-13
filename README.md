# sindustries monorepo

Sindustries is organized as a monorepo with explicit boundaries between product surfaces, backend execution, shared code, and operations.

## Monorepo layout

- `apps/` — user-facing runnable applications (primarily front-end surfaces)
  - `apps/tasks/` — first product surface (initial focused app)
  - `apps/website/` — public-facing company website v1
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

## Local setup (dev + prodlike)

### Prerequisites
- macOS with Homebrew
- Node.js 22+

### One-time bootstrap
From repo root:

```bash
make bootstrap
```

This installs local tooling (`colima`, `docker` CLI, `tilt`, `node` if missing) and npm deps for current app/service packages.

### Local runtime modes

`make up`, `make down`, and `make reset-db` are mode-aware via `MODE=<dev|prodlike>`.

| Mode | Compose project | Postgres | API | App | Tilt control port | API base URL |
| --- | --- | --- | --- | --- | --- | --- |
| `dev` | `sindustries-dev` | `localhost:6432` (`sindustries_dev`) | `localhost:4000` | `localhost:5173` | `10350` | `http://localhost:4000/api/v1` |
| `prodlike` | `sindustries-prodlike` | `localhost:7432` (`sindustries_prodlike`) | `localhost:4001` | `localhost:5174` | `10351` | `http://localhost:4001/api/v1` |

### Start stacks

Default (dev):

```bash
make up
```

Prod-like stack:

```bash
make up MODE=prodlike
```

Run both simultaneously from two terminals:

```bash
# Terminal 1
make up MODE=dev

# Terminal 2
make up MODE=prodlike
```

### Stop stacks

```bash
make down MODE=dev
make down MODE=prodlike
```

`make up` and `make down` also clean up stale listeners on the mode-owned app, API, and Tilt ports before starting or after stopping the stack.

### Reset DB (mode-aware)

Dev reset (includes seed by default):

```bash
make reset-db MODE=dev
```

Prod-like reset (no seed by default):

```bash
make reset-db MODE=prodlike
```

Optional overrides:

```bash
# Force seed prodlike once
SEED_DB=true make reset-db MODE=prodlike

# Skip seed in dev once
SEED_DB=false make reset-db MODE=dev
```

### Migrate only (with backup)

Apply checked-in Prisma migrations without resetting schemas:

```bash
make migrate-db MODE=dev
make migrate-db MODE=prodlike
```

This first creates a timestamped backup of the target database under `.db-backups/<mode>/` when the database already exists, then runs `prisma migrate deploy`.

For the known local drift case where the `blocked` / `ready` columns already exist but Prisma still has `20260308000000_add_blocked_ready_columns` marked unfinished, `make migrate-db` will auto-recover and continue.

Optional override:

```bash
BACKUP_ROOT=/path/to/backups make migrate-db MODE=prodlike
```

### Cron/automation targeting

Use explicit API base URLs:

- Dev: `http://localhost:4000/api/v1`
- Prod-like: `http://localhost:4001/api/v1`

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
