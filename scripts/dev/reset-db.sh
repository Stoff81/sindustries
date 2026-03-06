#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="$ROOT_DIR/services/tasks-api"

# shellcheck source=./mode-env.sh
source "$ROOT_DIR/scripts/dev/mode-env.sh"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but not installed." >&2
  exit 1
fi

# psql doesn't accept Prisma-style query params (e.g. ?schema=tasks_api)
PSQL_DATABASE_URL="${DATABASE_URL%%\?*}"

SEED_DB="${SEED_DB:-$RESET_DB_SEED_DEFAULT}"

echo "Resetting Postgres schemas for MODE=$MODE (${POSTGRES_DB})..."
psql "$PSQL_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS tasks_api CASCADE;
CREATE SCHEMA tasks_api;
DROP SCHEMA IF EXISTS tasks_app CASCADE;
CREATE SCHEMA tasks_app;
SQL

(
  cd "$API_DIR"
  DATABASE_URL="$DATABASE_URL" npm run prisma:migrate

  if [[ "$SEED_DB" == "true" ]]; then
    echo "Seeding database (SEED_DB=true)..."
    DATABASE_URL="$DATABASE_URL" npm run prisma:seed
  else
    echo "Skipping seed (SEED_DB=$SEED_DB)."
  fi
)

echo "Database reset complete for MODE=$MODE."
