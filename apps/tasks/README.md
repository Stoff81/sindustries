# tasks app

M4 implementation: React/Vite UI for backlog + kanban + create/update/archive flows against `services/tasks-api`.

## Scripts

- `npm install`
- `npm run dev`
- `npm test`
- `npm run test:e2e`

## Env

- `VITE_TASKS_API_BASE_URL`
- Without an override, local defaults are inferred from the frontend port:
- `5173 -> http://localhost:4000/api/v1`
- `5174 -> http://localhost:4001/api/v1`
