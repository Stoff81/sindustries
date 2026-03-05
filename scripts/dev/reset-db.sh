#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="$ROOT_DIR/services/tasks-api"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but not installed." >&2
  exit 1
fi

if [[ ! -f "$API_DIR/.env" ]]; then
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi

set -a
source "$API_DIR/.env"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set in $API_DIR/.env" >&2
  exit 1
fi

# psql doesn't accept Prisma-style query params (e.g. ?schema=tasks_api)
PSQL_DATABASE_URL="${DATABASE_URL%%\?*}"

echo "Resetting Postgres schemas for local services..."
psql "$PSQL_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS tasks_api CASCADE;
CREATE SCHEMA tasks_api;
DROP SCHEMA IF EXISTS tasks_app CASCADE;
CREATE SCHEMA tasks_app;
SQL

(
  cd "$API_DIR"
  npm run prisma:migrate
  npm run prisma:seed
)

echo "Database reset complete."
