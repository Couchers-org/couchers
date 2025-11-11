# Makefile for the backend of the application
# Run 'make [command]' in app/backend to execute the specified command

UV_VERSION=0.9.6
ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

protos:
	docker run --rm -w /app -v $(realpath ${ROOT_DIR}..):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh

setup:
	curl -fsSL https://astral.sh/uv/${UV_VERSION}/install.sh | sh


# Connect to the local development database
# Usage:
# make db
db:
	PGPASSWORD=203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7 \
	psql -h localhost -p 6545 -U postgres -d postgres

format:
	uv run ruff check --select I --fix . && uv run ruff check . --fix && uv run ruff format .

fmt: format

mypy:
	uv run mypy \
		src/couchers/config.py \
		src/couchers/constants.py \
		src/couchers/context.py \
		src/couchers/crypto.py \
		src/couchers/db.py \
		src/couchers/descriptor_pool.py \
		src/couchers/interceptors.py \
		src/couchers/materialized_views.py \
		src/couchers/metrics.py \
		src/couchers/reranker.py \
		src/couchers/resources.py \
		src/couchers/server.py \
		src/couchers/sql.py \
		src/couchers/tasks.py \
		src/couchers/tracing.py \
		src/couchers/urls.py \
		src/couchers/utils.py \
		src/couchers/migrations/env.py \
		src/couchers/models \
		src/couchers/notifications \
		src/couchers/rate_limits \
		src/couchers/email \
		src/couchers/templates \
		src/couchers/helpers \
		src/couchers/jobs \
		src/couchers/i18n \
		src/couchers/servicers/references.py \
		src/couchers/servicers/reporting.py \
		src/couchers/servicers/requests.py \
		src/couchers/servicers/resources.py \
		src/couchers/servicers/threads.py \
		src/couchers/phone

# Downgrade the local database to the previous migration. Good if you ran a migration on a branch and will run the backend on another branch after.
# Usage:
# make downgrade
downgrade:
	DATABASE_CONNECTION_STRING="postgresql://postgres:203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7@localhost:6545/postgres" \
	uv run alembic downgrade -1

# Upgrade the local database to the next migration. Upgrade already happens automatically when you run the backend via docker compose.
# Usage:
# make upgrade
upgrade:
	DATABASE_CONNECTION_STRING="postgresql://postgres:203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7@localhost:6545/postgres" \
	uv run alembic upgrade +1

# Starts a Postgres container for backend tests. On Mac, it builds a Postgis image locally,
# because there are no official images for ARM, and using amd64 image makes tests 4x slower.
# Note: creating postgis extension takes several seconds, and we don't want to do it on
# every test run.
setup-db:
	$(eval COMPOSE_FILES := -f ../docker-compose.test.yml $(if $(filter Darwin,$(shell uname -s)),-f ../docker-compose.testmac.yml))
	docker compose $(COMPOSE_FILES) up -d --wait --no-deps postgres_tests
	docker compose $(COMPOSE_FILES) exec postgres_tests psql -U postgres -c \
		"CREATE EXTENSION IF NOT EXISTS postgis; \
		 CREATE EXTENSION IF NOT EXISTS pg_trgm; \
		 CREATE EXTENSION IF NOT EXISTS btree_gist"

teardown-db:
	docker compose -f ../docker-compose.test.yml down

# Run backend tests with optional file argument
# Usage:
# make test                    → runs all tests
# make test file=test_file.py → runs tests in a specific file
# make test file=test_file.py::TestClass::test_method → runs a specific test
test:
	uv run pytest $(if $(file),src/tests/$(file),src/tests) --disable-warnings
