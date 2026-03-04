# tasks-api (Milestone 1 foundation)

Express + Prisma + Postgres foundation for the Tasks app.

## Prerequisites
- Node.js 22+
- Postgres 14+

## Local setup
```bash
cd services/tasks-api
cp .env.example .env
npm install
```

## Run locally
```bash
npm run dev
```

Health checks:
- `GET /health`
- `GET /api/v1/health`

REST API (M3 slice):
- `GET /api/v1/tasks` (status/priority/assignee/tag/q/dueBefore/dueAfter filters + cursor pagination)
- `GET /api/v1/tasks/:id`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id` (archive-only)
- `GET /api/v1/tags`
- `POST /api/v1/tags`

## Database workflow
```bash
# generate Prisma client
npm run prisma:generate

# apply checked-in migrations
npm run prisma:migrate

# seed baseline data
npm run prisma:seed
```

## Tests
```bash
npm test
```

Current M1 tests:
- API health integration test (`/health`)
- Prisma schema validation test (`prisma validate`)
