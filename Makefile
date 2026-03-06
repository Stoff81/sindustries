.PHONY: bootstrap up down reset-db test test-api test-app test-e2e

bootstrap:
	./scripts/dev/bootstrap.sh

up:
	./scripts/dev/up.sh

down:
	./scripts/dev/down.sh

reset-db:
	./scripts/dev/reset-db.sh

test: test-api test-app test-e2e

test-api:
	cd services/tasks-api && npm test

test-app:
	cd apps/tasks && npm test

test-e2e:
	cd apps/tasks && npm run test:e2e
