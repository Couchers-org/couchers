.SILENT:

BUILD_DIR = .build

# Build steps

default: protos uv-sync

# Generates python proto code in the src tree.
protos: ${BUILD_DIR}/protos.changestamp

# Require public protos and internal protos, then copy them in the source tree
${BUILD_DIR}/protos.changestamp: ../proto/${BUILD_DIR}/changestamp proto/${BUILD_DIR}/changestamp
	rm -rf src/couchers/proto/
	mkdir -p src/couchers/proto/
	rsync -rc ../proto/gen/python/ src/couchers/proto/
	rsync -rc proto/gen/ src/couchers/proto/
	mkdir -p ${BUILD_DIR} && touch ${BUILD_DIR}/protos.changestamp

../proto/${BUILD_DIR}/changestamp: FORCE
	$(MAKE) -C ../proto

proto/${BUILD_DIR}/changestamp: FORCE
	$(MAKE) -C proto

uv-sync: ${BUILD_DIR}/uv-sync.changestamp

${BUILD_DIR}/uv-sync.changestamp: pyproject.toml uv.lock
	uv sync --locked --all-extras --dev
	mkdir -p ${BUILD_DIR} && touch ${BUILD_DIR}/uv-sync.changestamp

# Running steps

mypy: lint

lint:
	uv run -m mypy src

format:
	uv run ruff check --select I --fix . && uv run ruff check . --fix && uv run ruff format .

# Starts the test database container
run-test-db:
	$(eval COMPOSE_FILES := -f ../docker-compose.test.yml $(if $(filter arm64 aarch64,$(shell uname -m)),-f ../docker-compose.test.arm64.yml))
	docker compose $(COMPOSE_FILES) up -d --wait --no-deps postgres_tests
	docker compose $(COMPOSE_FILES) exec postgres_tests psql -U postgres -c \
		"CREATE EXTENSION IF NOT EXISTS postgis; \
		 CREATE EXTENSION IF NOT EXISTS pg_trgm; \
		 CREATE EXTENSION IF NOT EXISTS btree_gist; \
		 CREATE EXTENSION IF NOT EXISTS pg_stat_statements"

# Run tests with optional file argument
# Usage:
# make test → runs all tests
# make test file=test_file.py → runs tests in a specific file
# make test file=test_file.py::TestClass::test_method → runs a specific test
test: default run-test-db
	uv run pytest $(if $(file),src/tests/$(file),src/tests)

.PHONY: FORCE
FORCE:
