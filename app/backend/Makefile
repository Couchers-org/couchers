# Makefile for the backend of the application
# Run 'make [command]' in app/backend to execute the specified command
# Connect to the local development database
# Usage:
# make db
db:
	PGPASSWORD=203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7 \
	psql -h localhost -p 6545 -U postgres -d postgres

format:
	ruff check --select I --fix . && ruff check . --fix && ruff format .

# Downgrade the local database to the previous migration. Good if you ran a migration on a branch and will run the backend on another branch after.
# Usage:
# make downgrade
downgrade:
	DATABASE_CONNECTION_STRING="postgresql://postgres:203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7@localhost:6545/postgres" \
	alembic downgrade -1

# Upgrade the local database to the next migration. Upgrade already happens automatically when you run the backend via docker compose.
# Usage:
# make upgrade
upgrade:
	DATABASE_CONNECTION_STRING="postgresql://postgres:203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7@localhost:6545/postgres" \
	alembic upgrade +1

# Run backend tests with optional file argument
# Usage:
# make test                    → runs all tests
# make test file=test_file.py → runs tests in a specific file
# make test file=test_file.py::TestClass::test_method → runs a specific test
test:
	DATABASE_CONNECTION_STRING="postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/postgres" \
	pytest $(if $(file),src/tests/$(file),src/tests)
