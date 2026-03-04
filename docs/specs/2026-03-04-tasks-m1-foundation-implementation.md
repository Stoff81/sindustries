# Tasks API Milestone 1 Implementation (Schema + Foundation)

Date: 2026-03-04

## Problem
Implement the first runnable backend foundation for `apps/tasks` using the locked stack and V1 data model decisions.

## Scope implemented
- Added `services/tasks-api` Node project with Express skeleton.
- Added health endpoints:
  - `GET /health`
  - `GET /api/v1/health`
- Added Prisma configuration and initial schema with:
  - `TaskStatus` enum: `todo | doing | done`
  - `TaskPriority` enum: `low | medium | high | urgent`
  - Models: `Task`, `Tag`, `TaskTag`
  - `assignee` as free-text
  - archive-only support via `archivedAt`
  - Kanban sort support via `statusChangedAt`
- Added initial SQL migration under `prisma/migrations/20260304230000_init/migration.sql`.
- Added seed script with representative sample data (24 tasks, 8 tags, many-to-many links, archived rows, varied statuses/priorities and `statusChangedAt`).
- Added `.env.example` and service README with setup/run/migrate/seed/test commands.
- Added minimal tests:
  - API health integration test
  - Prisma schema validation test

## Out of scope (still deferred)
- Task CRUD endpoints (beyond health)
- Frontend implementation in `apps/tasks`
- Auth
- E2E and FE tests

## Notes
This milestone establishes a production-aligned schema foundation and runnable API skeleton for M2 endpoint work.
