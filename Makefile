.PHONY: bootstrap up down reset-db migrate-db test test-api test-app test-e2e

MODE ?= dev

bootstrap:
	./scripts/dev/bootstrap.sh

up:
	MODE=$(MODE) ./scripts/dev/up.sh

down:
	MODE=$(MODE) ./scripts/dev/down.sh

reset-db:
	MODE=$(MODE) ./scripts/dev/reset-db.sh

migrate-db:
	MODE=$(MODE) ./scripts/dev/migrate-db.sh

test: test-api test-app test-e2e

test-api:
	cd services/tasks-api && npm test

test-app:
	cd apps/tasks && npm test

test-e2e:
	cd apps/tasks && npm run test:e2e
