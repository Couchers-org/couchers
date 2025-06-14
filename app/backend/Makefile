# Makefile for the backend of the application
# Run 'make [commands]' in app/backend to execute the specified command
format:
	ruff check --select I --fix . && ruff check . --fix && ruff format .
# Run backend tests with optional file argument
# Usage:
# make test                    → runs all tests
# make test file=test_file.py → runs tests in a specific file
# make test file=test_file.py::TestClass::test_method → runs a specific test
test:
	DATABASE_CONNECTION_STRING="postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/postgres" \
	pytest $(if $(file),src/tests/$(file),src/tests)
