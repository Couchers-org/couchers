# Claude Code Instructions for Couchers

## Repository Structure

This is a monorepo for Couchers.org, a non-profit hospitality exchange platform.

- `/app/backend` - Python backend (gRPC, SQLAlchemy, PostgreSQL/PostGIS)
- `/app/web` - Next.js web frontend
- `/app/mobile` - React Native Expo mobile app
- `/app/proto` - Protocol buffer definitions shared across services
- `/docs` - Documentation

## Backend Commands

All backend commands should be run from `/app/backend`:

```bash
# Format code (run after any backend change)
make format
# or: uv run ruff check --fix . && uv run ruff format

# Run tests (you can use additional commands)
uv run pytest
# if you get an error about the database not being up, ask the user to start the testing database

# Generate protobuf files (after changing .proto files)
make protos

# Type checking
make mypy
```

## Key Conventions

### Backend (Python)
- Uses `uv` for dependency management
- SQLAlchemy 2.0 with mapped_column style
- gRPC for API (defined in `/app/proto`)
- Background jobs in `couchers/jobs/handlers.py`
- Notifications system in `couchers/notifications/`
- Always run `make format` after changes
- NEVER try-catch an exception and silently throw it away or just log it. By and large you don't need to wrap code in try-catch blocks, we already handle exceptions
- Use `enum.auto()` for all enums (except in the rare case that they are inherently ordinal and we use that order in business logic)
- Put relationships and constraints at the end of models
- For text columns, don't use fixed-length strings in models, don't use `Text`. Use `String`
- All database constraints go in models
- When adding environment variables for the backend, carefully add them to `backend.dev.env` and into the test environment
- Imports always occur at the top of the file. The two exceptions are when this is required during type checking or in tests that really require inline imports
- Do not use `session.get(...)`. Use `session.execute(select(...))` instead
- For URLs, use `from couchers import urls` and then `urls.whatever()`
- Always import `from couchers.sql import couchers_select as select` instead of something else
- Avoid inline imports whenever possible
- To filter out invisible users (deleted/banned/blocked), use the helper functions from `couchers.sql`: `where(users_visible(context))` when User is already joined, `where(users_column_visible(context, column))` when you have a user_id column, or `where(users_visible_to_each_other(user1, user2))` for mutual visibility. Never use `User.is_visible` directly in queries

### Web (TypeScript/React)
- Uses `nvm` for node version management
- Uses `yarn` (not npm)
- Import aliases: use `components/` not `../../../components/`
- No `any` types
- Use StyledLink or next/link for routing
- **IMPORTANT**: When using Material-UI components (Button, Chip, MenuItem, etc.) with the `href` prop for internal navigation, ALWAYS use `component={Link}` instead of `component="a"` to preserve locale prefixes. Import Link from `next/link`

### Proto Files
- Located in `/app/proto`
- Run `make protos` from backend after changes
- Internal job payloads in `/app/backend/proto/internal/jobs.proto`

### Localization
- Do not hard-code English text strings, store them in the appropriate locale files (`features/*/locales/en.json`)
- When adding strings to an `en.json` file, refer to `/docs/localization.md` for string key and text guidance

## Testing

### Backend Tests
- Located in `/app/backend/src/tests/`
- Use `session_scope()` for database access
- Use fixtures from `test_fixtures.py` (e.g., `generate_user()`, `push_collector`)
- Mock external APIs with `unittest.mock.patch`
- Background jobs don't run automatically in tests - use `process_job()` to manually execute queued jobs

### Web Tests
- Use fixture data from `test/fixtures/` when available
- Query by label (`getByLabelText`) for accessibility
- Use `findByText` for async elements

## Database

- PostgreSQL with PostGIS extension
- Migrations in `/app/backend/src/couchers/migrations/versions/`
- Models in `/app/backend/src/couchers/models/`
