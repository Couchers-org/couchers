# Claude Code Instructions for Couchers

## Summary

This is a monorepo for Couchers.org, a non-profit couch surfing platform. Users sign up and can be hosts (offering their couch/spare room to travelers), surfers (requesting to stay with hosts), community members (attending events, joining discussions, and building local communities), or any combination. Core features include user profiles with hosting preferences, sending and responding to couch requests, messaging between users, community features like events and discussions organized by local communities, and a reference system for building trust. The platform emphasizes safety, community building, and keeping the service free and community-owned.

## Git

- The main branch is `develop` (not `main`)

## Repository Structure

- `/app/backend` - Python backend (gRPC, SQLAlchemy, PostgreSQL/PostGIS). See `/app/backend/readme.md` for more details
- `/app/web` - Next.js web frontend
- `/app/mobile` - React Native Expo mobile app (uses `npm`, not `yarn`). See `/app/mobile/README.md` for setup instructions
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
- Always run `make format` and `make mypy` after modifying backend code
- NEVER try-catch an exception and silently throw it away or just log it. By and large you don't need to wrap code in try-catch blocks, we already handle exceptions
- Use `enum.auto()` for all enums (except in the rare case that they are inherently ordinal and we use that order in business logic)
- Put relationships and constraints at the end of models
- For text columns, don't use fixed-length strings in models, don't use `Text`. Use `String`
- All database constraints go in models
- When adding environment variables for the backend, carefully add them to `backend.dev.env` and into the test environment
- Imports always occur at the top of the file. The two exceptions are when this is required during type checking or in tests that really require inline imports
- Do not use `session.get(...)`. Use `session.execute(select(...))` instead
- For URLs, use `from couchers import urls` and then `urls.whatever()`
- Avoid inline imports whenever possible
- To filter out invisible users (deleted/banned/blocked), use the helper functions from `couchers.sql`: `where(users_visible(context))` when User is already joined, `where(users_column_visible(context, column))` when you have a user_id column, or `where(users_visible_to_each_other(user1, user2))` for mutual visibility. Never use `User.is_visible` directly in queries

### Web (TypeScript/React)
- Uses `nvm` for node version management
- Uses `yarn` (not npm) - run dev server with `yarn start` (not Docker)
- Run linting with `yarn lint` and auto-fix with `yarn lint:fix`
- Run tests with `yarn test`
- Run linting AND formatting with `yarn format`
- Import aliases: use `components/` not `../../../components/`, `routes` not `../../../routes`
- Import multiple MUI icons together: `import { Favorite, Star, Public } from "@mui/icons-material"` instead of separate imports
- No `any` types - explicitly type mock mutations (e.g., `UseMutationResult<...>`)
- Use StyledLink or next/link for routing - NOT MUI `Link`
- Type definitions should always go at the top of the file below the imports
- **IMPORTANT**: When using Material-UI components (Button, Chip, MenuItem, etc.) with the `href` prop for internal navigation, ALWAYS use `component={Link}` instead of `component="a"` to preserve locale prefixes. Import Link from `next/link`
- Remove extra unnecessary style declarations - don't repeat anything that's already a default of MUI or the theme
- Use theme-defined colors instead of ad-hoc gray backgrounds; use default MUI hover styles instead of custom dark-grey-on-hover
- Prefer modern 2025 design patterns for UI components
- Add Tanstack `queryKeys` to `app/web/features/queryKeys.ts` if they are used in more than one place
- Use `slotProps` rather than `InputLabelProps` for MUI (`InputLabelProps` is deprecated)

### Web Dark Mode
- **Always use CSS variables for theme colors** to ensure dark mode compatibility:
  - `var(--mui-palette-primary-main)` instead of `theme.palette.primary.main` in styled components
  - `var(--mui-palette-text-primary)` for text colors
  - `var(--mui-palette-background-paper)` / `var(--mui-palette-background-default)` for backgrounds
  - `var(--mui-palette-divider)` for borders/dividers
  - `var(--mui-palette-grey-XXX)` for grey shades (e.g., grey-50, grey-200, grey-300)
  - `var(--mui-palette-action-hover)` for hover states
- **Exception**: Use `theme.palette.*` values when passing colors to functions like `alpha()` that require actual color values, not CSS variables
- For styled components, only add `({ theme })` parameter when you need `theme.spacing()`, `theme.breakpoints`, or functions like `alpha()`
- Test all components in both light and dark mode to ensure proper color contrast and visibility

### Proto Files
- Located in `/app/proto`
- Run `make protos` from backend after changes
- Internal job payloads in `/app/backend/proto/internal/jobs.proto`

**⚠️ FIELD NUMBERS ARE PERMANENT — NEVER RENUMBER OR REPURPOSE A FIELD ⚠️**

Field numbers are the wire format. Once a field has shipped, its number is bound to that semantic FOREVER:
- **NEVER** change the number of an existing field.
- **NEVER** change the type of an existing field (e.g. `string` → `bytes`, `int32` → `int64`).
- **NEVER** rename a field to mean something different — the wire doesn't see the name, it sees the number, so the old client's bytes will be silently decoded as the new field of the same tag (e.g. an old `string debug_json = 1` decoded as a new `string install_id = 1` looks valid but is garbage data).
- **NEVER** reuse a removed field's number OR name for something new.

When removing a field that has shipped: delete the field and add `reserved <number>;` AND `reserved "field_name";` lines so neither the tag nor the name can ever be reused. Reserving the name matters too — it stops a future field from accidentally reviving an old meaning by reusing the name, and protects JSON/text-format consumers that key on names. When the field has never shipped, delete it outright.

When adding a field: pick the next unused number. You may place the line wherever it reads best in the file — proto3 doesn't care about source order, only the number matters. The number must always be a previously-unused tag.

If you ever feel tempted to renumber, STOP and ask the user. There is essentially never a valid reason.

### Localization
- Never hardcode English text - always use the `t()` function or `<Trans>` component for user-facing text
- Store all English strings in the appropriate locale files (`features/*/locales/en.json`)
- When adding strings to an `en.json` file, refer to `/docs/localization.md` for string key and text guidance
- Use the `<Trans>` component for text with embedded components (like links). Make sure components in the translation JSON match the `components` prop exactly
- For dates and times on the web frontend, never use `Date.toLocaleDateString()` or `Intl.DateTimeFormat` directly - use the helpers in `app/web/utils/date.ts` (`localizeDateTime`, `localizeDateTimeRange`, `localizeYearMonth`, `timeAgo`). Pass the user's current language via `useTranslation()`'s `i18n.language`, not the browser locale

## Testing

### Backend Tests
- Located in `/app/backend/src/tests/`
- Use `session_scope()` for database access
- Use fixtures from `test_fixtures.py` (e.g., `generate_user()`, `push_collector`)
- Mock external APIs with `unittest.mock.patch`
- Background jobs don't run automatically in tests - use `process_job()` to manually execute queued jobs

### Web Tests
- Use fixture data from `test/fixtures/` (e.g., `hostRequest.json`, `messages.json`, `groupChat.json`) when available, instead of creating mock data inline
- Query elements by label (`getByLabelText`) for accessibility. When there's ambiguity (e.g., both a label and aria-label), use the `selector` option: `getByLabelText(label, { selector: "textarea" })`
- For text split by child elements (e.g., links inside text), use a function matcher:
  ```typescript
  screen.getByText((content, element) => {
    return element?.textContent === "Full text including embedded link text";
  })
  ```
- Use `await screen.findByText()` when waiting for elements after loading states, instead of `getByText()` after `waitForElementToBeRemoved()`
- Tests should assert correct behavior (TDD-style), not mirror bugs. Fix the code if needed, and follow existing test patterns in the repo.

### Mobile Tests (React Native)
- Follow Testing Library principles: test behavior, not implementation details
- Component tests: Mock custom hooks and verify they're called with correct arguments
- Hook tests: Test actual hook logic without mocks (unit tests)
- Don't test that lifecycle hooks (useEffect, useFocusEffect) were called - test the resulting behavior
- Avoid circular testing: don't manually set state/refs then verify the component reads them
- Integration tests are acceptable when real user interactions can't be simulated (e.g., hardware back button)

## CI/CD

CI runs on GitLab (triggered by GitHub pushes). Use these tools to check pipeline status and debug failures:

```bash
# Check CI status for a PR, branch, or commit
uv run --project .claude/tools ci-status --pr <number>
uv run --project .claude/tools ci-status --branch <name>
uv run --project .claude/tools ci-status --sha <hash>

# Fetch a job's log output (job ID from ci-status output)
uv run --project .claude/tools ci-job-log <job-id>
uv run --project .claude/tools ci-job-log <job-id> --full
```

## Database

- PostgreSQL with PostGIS extension
- Migrations in `/app/backend/src/couchers/migrations/versions/`
- Migrations use ordinal numbering (`0001_`, `0002_`, ...) and must be linear (no branches). New migrations automatically get the next ordinal as their revision ID via `env.py`
- Always add a `downgrade()` to migrations when possible and relevant
- Models in `/app/backend/src/couchers/models/`

## Pull Requests

- Use the PR template in `.github/pull_request_template.md` when creating PRs
