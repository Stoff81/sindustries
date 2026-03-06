# Architecture

## Repository structure

- `apps/`
  - User-facing runnable app surfaces.
  - Includes:
    - `apps/tasks` (initial focused product surface)
    - `apps/mission-control` (future aggregate shell)
- `services/`
  - Backend APIs, workers, and service processes.
- `packages/`
  - Shared code: types, domain libraries, UI primitives, tooling/config.
- `infra/`
  - Runtime and environment orchestration definitions.
  - Includes:
    - `infra/docker-compose.dev.yml` for local Postgres
    - `infra/tilt/Tiltfile` for local process orchestration
- `docs/`
  - Specifications, architecture docs, and decision records.

## Local development runtime model (Phase 1)

We use a **hybrid local model** to optimize inner-loop speed while staying container-aligned:

- **Postgres** runs in Docker (`infra/docker-compose.dev.yml`).
- **tasks-api** runs on host (`npm run dev` in `services/tasks-api`).
- **tasks app** runs on host (`npm run dev` in `apps/tasks`).
- **Tilt** orchestrates all of the above via `infra/tilt/Tiltfile`.

### Dual local modes

The stack is mode-aware so `dev` and `prodlike` can run concurrently from the same repo.

| Mode | Compose project | Postgres | Postgres DB | API | App | Tilt port | API base URL |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `dev` | `sindustries-dev` | `localhost:5432` | `sindustries_dev` | `localhost:4000` | `localhost:5173` | `10350` | `http://localhost:4000/api/v1` |
| `prodlike` | `sindustries-prodlike` | `localhost:5433` | `sindustries_prodlike` | `localhost:4001` | `localhost:5174` | `10351` | `http://localhost:4001/api/v1` |

Mode config source of truth: `scripts/dev/mode-env.sh`.

### Why hybrid now

- Faster code/test iteration for TypeScript services and UI than fully containerized hot-reload loops.
- Reduced local setup overhead and fewer manually managed terminals.
- Preserves a clean path to containerized cloud deployment later.

## Language and implementation standards

- TypeScript is the repository standard for application and service code.
- `services/tasks-api` is implemented in TypeScript and executed via `tsx` in development/runtime scripts.
- JavaScript may remain only for tooling/bootstrap scripts where migration provides no product value (for example, Prisma seed scripts), unless explicitly promoted into app/service runtime paths.

## Data ownership and schema boundaries

Each local mode runs against its own Postgres database (`sindustries_dev` vs `sindustries_prodlike`).
Within each DB, boundary rules are unchanged:

- Each service owns its own schema and migration lifecycle.
- Current API ownership schema: `tasks_api`.
- Reserved app-side schema boundary: `tasks_app`.
- No cross-service table ownership.
- Cross-service reads/writes must happen through service APIs/contracts, not direct table access.

`./scripts/dev/reset-db.sh` enforces this baseline by recreating service schemas and rerunning API migrations. Seed behavior is mode-aware:

- `dev`: seed by default
- `prodlike`: no seed by default (`SEED_DB=true` to opt in)

## Tilt role in the stack

`infra/tilt/Tiltfile` is the local orchestration entrypoint for developer UX.

Responsibilities:

- Bring up Postgres through Docker Compose.
- Start host-run `tasks-api` after Postgres.
- Start host-run `tasks-app` after API.
- Provide unified status/logs with explicit dependency ordering (`db -> api -> app`).
- Honor mode-specific env (`MODE`, ports, DB URL, API base URL).

Developer command scripts (source of truth):

- `./scripts/dev/up.sh` (starts Colima if required, then runs Tilt)
- `./scripts/dev/down.sh` (tears down Tilt + compose resources)
- `./scripts/dev/reset-db.sh` (schema reset + migrate + optional seed)

## CI strategy (Phase 1)

GitHub Actions (`.github/workflows/ci.yml`) runs test suites on hosted runners with a Postgres service container for integration coverage.

- `tasks-api tests (unit + db integration)`
  - Runs `npm test` for fast endpoint/schema checks.
  - Runs `prisma migrate deploy` + `prisma db seed`.
  - Runs DB-backed API integration tests against runner Postgres.
- `tasks app tests`
  - Runs component/unit tests (`npm test`).
- `tasks app e2e (ui + api + db)`
  - Boots Postgres service in CI.
  - Migrates + seeds API schema.
  - Starts `tasks-api` on the runner.
  - Runs Playwright e2e against real app -> API -> Postgres flow (no route mocks).

### CI principles in this phase

- Catch integration drift in CI, not just locally.
- Keep runtime reasonable via runner service containers and targeted integration specs.
- **Tilt is local-only orchestration**; GitHub CI does not require Tilt and does not invoke it.

## Phased path to cloud/container maturity

### Implemented now (Phase A)
- Hybrid local runtime with Compose + Tilt + host-run app/api.
- Dual local modes (`dev`, `prodlike`) with isolated ports and DB targets.
- CI lanes for current API, app, and app e2e suites.

### Next (Phase B)
- Build/publish container images for services/apps.
- Add DB-backed integration lane(s) in CI where tests require it.
- Add baseline deployment manifests/charts (k8s/helm) for cloud path.

## Guardrails

- Keep this repository spec-first for non-trivial work.
- Avoid coupling app-specific logic into shared packages unless genuinely reusable.
- Prefer independently deployable surfaces and services where practical.
- Keep `scripts/dev/*` as operational source of truth; wrappers (e.g., Makefile aliases) must call scripts rather than duplicate logic.
