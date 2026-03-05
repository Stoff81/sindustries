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

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI is required but not installed." >&2
  exit 1
fi

if ! colima status >/dev/null 2>&1; then
  echo "Starting Colima..."
  colima start
fi

cd "$ROOT_DIR"
exec tilt up --file infra/tilt/Tiltfile
