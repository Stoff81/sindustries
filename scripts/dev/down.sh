#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

tilt down --file infra/tilt/Tiltfile || true

# Cleanup any lingering local tasks-api watchers
pkill -f "tsx watch src/server.ts" || true

docker compose -f infra/docker-compose.dev.yml down --remove-orphans
