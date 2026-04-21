# Makefile for the backend of the application
# Run 'make [command]' in app/backend to execute the specified command

UV_VERSION=0.10.9
ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
PROTO_IMAGE=registry.gitlab.com/couchers/grpc

DB_PASSWORD := "203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7"
DB_CONNECTION_STRING := "postgresql://postgres:${DB_PASSWORD}@localhost:6545/postgres"

protos:
	docker pull -q ${PROTO_IMAGE}
	docker run --rm -w /app -v $(realpath ${ROOT_DIR}..):/app ${PROTO_IMAGE} ./generate_protos.sh

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
	uv run mypy src

# Generate a new database migration by comparing models to an empty database
# Usage:
# make revision                     → generates migration with default message
# make revision m='Add users table' → generates migration with custom message
revision:
	uv run --with 'docker,psycopg[binary]' python revision.py $(if $(m),-m '$(m)',)

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
		 CREATE EXTENSION IF NOT EXISTS btree_gist; \
		 CREATE EXTENSION IF NOT EXISTS pg_stat_statements"

teardown-db:
	docker compose -f ../docker-compose.test.yml down

# Run backend tests with optional file argument
# Usage:
# make test                    → runs all tests
# make test file=test_file.py → runs tests in a specific file
# make test file=test_file.py::TestClass::test_method → runs a specific test
test:
	uv run pytest $(if $(file),src/tests/$(file),src/tests)


# Run backend tests in Docker
# Usage:
# make docker-test                    → runs all tests
# make docker-test file=test_file.py → runs tests in a specific file
docker-test:
	$(eval COMPOSE_FILES := -f ../docker-compose.test.yml $(if $(filter Darwin,$(shell uname -s)),-f ../docker-compose.testmac.yml))
	docker compose $(COMPOSE_FILES) up -d --wait postgres_tests
	docker compose $(COMPOSE_FILES) run --rm --build \
		-v $(ROOT_DIR):/app \
		-v /app/.venv \
		-e DATABASE_CONNECTION_STRING=postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@postgres_tests:6544/testdb \
		--no-deps \
		backend_test_runner \
		pytest $(if $(file),src/tests/$(file),src/tests) --disable-warnings

teardown-docker-test:
	docker compose -f ../docker-compose.test.yml down


run-deps:
	docker compose -f ../docker-compose.local-backend.yml up -d --build --wait

# Run backend locally with all needed dependencies (db etc).
# You can also execute "run_locally.py" from an IDE to attach a debugger to it
# (be sure to run "make run-deps" before!)
run: run-deps
	uv run src/run_locally.py
