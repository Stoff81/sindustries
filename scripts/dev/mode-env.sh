#!/usr/bin/env bash
set -euo pipefail

MODE="${MODE:-dev}"

case "$MODE" in
  dev)
    export MODE
    export COMPOSE_PROJECT_NAME="sindustries-dev"
    export STACK_LABEL="dev"
    export POSTGRES_PORT="5432"
    export TASKS_API_PORT="4000"
    export TASKS_APP_PORT="5173"
    export TILT_PORT="10350"
    export POSTGRES_DB="sindustries_dev"
    export POSTGRES_CONTAINER_NAME="sindustries-postgres-dev"
    export TASKS_SCHEMA="tasks_api"
    export TASKS_API_BASE_URL="http://localhost:${TASKS_API_PORT}/api/v1"
    export TASKS_API_ENV_FILE="services/tasks-api/.env.dev"
    export RESET_DB_SEED_DEFAULT="true"
    ;;
  prodlike)
    export MODE
    export COMPOSE_PROJECT_NAME="sindustries-prodlike"
    export STACK_LABEL="prodlike"
    export POSTGRES_PORT="5433"
    export TASKS_API_PORT="4001"
    export TASKS_APP_PORT="5174"
    export TILT_PORT="10351"
    export POSTGRES_DB="sindustries_prodlike"
    export POSTGRES_CONTAINER_NAME="sindustries-postgres-prodlike"
    export TASKS_SCHEMA="tasks_api"
    export TASKS_API_BASE_URL="http://localhost:${TASKS_API_PORT}/api/v1"
    export TASKS_API_ENV_FILE="services/tasks-api/.env.prodlike"
    export RESET_DB_SEED_DEFAULT="false"
    ;;
  *)
    echo "Unsupported MODE: $MODE (expected: dev | prodlike)" >&2
    exit 1
    ;;
esac

export DATABASE_URL="postgresql://postgres:postgres@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=${TASKS_SCHEMA}"
export CORS_ALLOWED_ORIGINS="http://localhost:${TASKS_APP_PORT},http://127.0.0.1:${TASKS_APP_PORT}"
