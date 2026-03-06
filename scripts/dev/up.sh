#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if ! command -v colima >/dev/null 2>&1; then
  echo "colima is required but not installed." >&2
  exit 1
fi

if ! command -v tilt >/dev/null 2>&1; then
  echo "tilt is required but not installed." >&2
  exit 1
fi

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI is required but not installed." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
  echo "docker compose (plugin) or docker-compose is required but not installed." >&2
  exit 1
fi

if ! colima status >/dev/null 2>&1; then
  echo "Starting Colima..."
  colima start
fi

# Preflight: clear stale local tasks-api watchers to avoid EADDRINUSE on :4000
if pgrep -f "tsx watch src/server.ts" >/dev/null 2>&1; then
  echo "Found stale tasks-api dev process(es). Stopping them..."
  pkill -f "tsx watch src/server.ts" || true
  sleep 1
fi

# Ensure tasks-api env exists for Prisma/DATABASE_URL
if [ ! -f "$ROOT_DIR/services/tasks-api/.env" ]; then
  echo "Creating services/tasks-api/.env from .env.example"
  cp "$ROOT_DIR/services/tasks-api/.env.example" "$ROOT_DIR/services/tasks-api/.env"
fi

cd "$ROOT_DIR"
exec tilt up --file infra/tilt/Tiltfile
