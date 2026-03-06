#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# shellcheck source=./mode-env.sh
source "$ROOT_DIR/scripts/dev/mode-env.sh"

cd "$ROOT_DIR"

tilt down --file infra/tilt/Tiltfile --port "$TILT_PORT" || true

# Cleanup any lingering local tasks-api watchers on this mode's port.
if lsof -nP -iTCP:"$TASKS_API_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  pkill -f "tsx watch src/server.ts" || true
fi

docker compose -f infra/docker-compose.dev.yml down --remove-orphans
