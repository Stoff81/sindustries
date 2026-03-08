#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# shellcheck source=./mode-env.sh
source "$ROOT_DIR/scripts/dev/mode-env.sh"
# shellcheck source=./port-cleanup.sh
source "$ROOT_DIR/scripts/dev/port-cleanup.sh"

cd "$ROOT_DIR"

tilt down --file infra/tilt/Tiltfile --port "$TILT_PORT" || true

# Cleanup any lingering listeners on this mode's owned ports.
cleanup_mode_ports

if docker compose version >/dev/null 2>&1; then
  docker compose -f infra/docker-compose.dev.yml down --remove-orphans
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f infra/docker-compose.dev.yml down --remove-orphans
else
  echo "docker compose (plugin) or docker-compose is required." >&2
  exit 1
fi
