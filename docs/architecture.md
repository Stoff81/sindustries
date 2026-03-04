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
  - Deployment/runtime environment definitions and infrastructure concerns.
- `docs/`
  - Specifications, architecture docs, and decision records.

## Architectural intent

Separate concerns by runtime and ownership boundary:
- **apps** optimize for user experience and product iteration,
- **services** optimize for backend correctness and operability,
- **packages** optimize for reuse and consistency,
- **infra** captures environment/deployment concerns as code,
- **docs** preserve rationale and execution context.

This keeps scaling predictable as more surfaces and teams are added.

## Product trajectory

### Phase 1: Focused surface (`tasks`)
Deliver value quickly with a dedicated app surface and clear boundaries.

### Phase 2: Aggregate shell (`mission-control`)
Grow `apps/mission-control` into a unifying shell for cross-app workflows.
`tasks` remains a first-class surface and can be embedded/linked/orchestrated by mission-control.

### Phase 3: Additional surfaces
Add new app surfaces without collapsing boundaries; share capabilities via `packages` and `services`.

## Default stack policy (current)

For `apps/tasks`, default technology choices are:
- Frontend: **Vite + React**
- Backend API: **Express**
- ORM: **Prisma**
- Database: **Postgres**

Deviation policy:
- Alternatives are allowed only with an explicit tradeoff note (why change, pros/cons, migration impact)
- Deviation requires Tom's approval before implementation

## Guardrails

- Keep this repository spec-first for non-trivial work.
- Avoid coupling app-specific logic into shared packages unless genuinely reusable.
- Prefer independently deployable surfaces and services where practical.

## Current state

This repo currently contains scaffolding and documentation only; implementation is intentionally deferred.
