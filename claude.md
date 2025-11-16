# Couchers.org - AI Assistant Guide

## Project Overview

Couchers.org is a free, community-led, non-profit alternative to Couchsurfing. This is a modern hospitality exchange platform built with a React/Next.js frontend, Python backend, and mobile applications.

**Key Information:**
- **License:** MIT (source code only; logos, designs, and brand materials are proprietary)
- **Repository:** https://github.com/Couchers-org/couchers
- **Live Site:** https://couchers.org
- **Translation:** https://translate.couchershq.org/

## Architecture

This is a monorepo containing multiple applications:

- **`app/web/`** - Next.js web frontend (React, TypeScript, Material UI)
- **`app/backend/`** - Python backend (gRPC, SQLAlchemy, PostgreSQL/PostGIS)
- **`app/mobile/`** - React Native mobile app
- **`app/native/`** - Native mobile components
- **`app/proto/`** - Protocol Buffer definitions for API contracts
- **`app/media/`** - Media service
- **`app/client/`** - Python client library
- **`docs/`** - Architecture and development documentation
- **`.github/`** - GitHub workflows and automation

## Technology Stack

### Communication
- **API Protocol:** gRPC-Web (browser) / gRPC (server)
- **Serialization:** Protocol Buffers (protobuf)
- **API Definitions:** Located in `app/proto/`

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **CI/CD:** GitLab CI (`.gitlab-ci.yml`)
- **Monitoring:** Sentry (self-hosted at couchers.sentry.io)
- **Observability:** OpenTelemetry, Prometheus

### Database
- **Primary DB:** PostgreSQL with PostGIS extension
- **ORM:** SQLAlchemy (Python backend)
- **Migrations:** Alembic

## Development Workflow

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Couchers-org/couchers.git
   cd couchers
   ```

2. **Generate Protocol Buffers:**
   ```bash
   cd app
   docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
   ```

3. **Choose your development path:**
   - **Frontend only:** See `app/web/readme.md` (uses staging backend)
   - **Full stack:** See `app/backend/readme.md` (local backend + database)

### Branch Strategy

- **`develop`** - Main development branch
- **Feature branches:** Use format `{area}/{type}/{description}`
  - Examples: `web/feature/dark-mode`, `backend/bug/auth-fix`
- **Pull Requests:** Target `develop` branch

### Protocol Buffers

The API is defined using Protocol Buffers in `app/proto/`. When proto files change:

1. Regenerate using the docker command above
2. Restart affected services
3. TypeScript types are generated to `app/web/proto/`
4. Python types are generated to `app/backend/src/couchers/proto/`

**Pre-built protos:** Available at https://develop--protos.preview.couchershq.org/

### Testing

- **Web:** `cd app/web && yarn test-ci`
- **Backend:** `cd app && docker compose -f docker-compose.test.yml up --build`
- **Coverage:** Reports available at https://develop--bcov.preview.couchershq.org

### Code Quality

- **Web:** ESLint, Prettier, TypeScript strict mode
- **Backend:** Ruff (linting), mypy (type checking), pytest
- **Pre-commit hooks:** Configured for both frontend and backend

## Important Files & Directories

- **`readme.md`** - Main project README
- **`app/readme.md`** - Development setup guide
- **`docs/architecture/main.md`** - Architecture overview
- **`docs/contributing.md`** - Contributor guidelines
- **`docs/database.md`** - Database & migrations guide
- **`docs/docker.md`** - Docker tips and tricks
- **`docs/cicd.md`** - CI/CD documentation
- **`license.md`** - MIT license text
- **`.cursorrules`** - Cursor AI editor rules

## Environment-Specific Information

### Local Development
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8888
- **Database:** localhost:5432 (see `app/postgres.dev.env`)
- **MailDev (email):** http://localhost:1080
- **Prometheus:** Configured via `app/prometheus/`

### Staging ("next")
- **API:** https://dev-api.couchershq.org
- **Frontend:** https://next.couchershq.org
- Used for testing before production

### Test Credentials (Local Only)
- **Username:** aapeli
- **Password:** Aapeli's password
- See `app/backend/src/data/dummy_users.json` for full list

## Common Tasks

### Making Changes

1. Pick an issue from GitHub Issues or create one
2. Create a feature branch following naming conventions
3. Make your changes with clear, regular commits
4. Run tests locally before pushing
5. Create a pull request and request review
6. Address feedback and get approval
7. Merge when approved (handle conflicts by merging `develop` first)

### Updating Dependencies

- **Web:** Update `app/web/package.json`, run `yarn install`
- **Backend:** Update `app/backend/pyproject.toml`, run `uv sync`

### Database Migrations

When schema changes are needed:
1. See `docs/database.md` for detailed instructions
2. Alembic handles migrations in `app/backend/src/couchers/migrations/`
3. Auto-generate migration: Use Alembic autogenerate feature
4. Test migration up and down before committing

### Debugging

- **Backend in VS Code:** See `docs/backend-in-vscode.md`
- **Network issues:** Check Docker networking, proxy configs in `app/proxy/`
- **Database issues:** Nuke and recreate: stop postgres, delete `app/data/postgres/`, rebuild

## Translation & Internationalization

- **Platform:** Weblate at https://translate.couchershq.org/
- **Web i18n:** i18next, next-i18next
- **Backend i18n:** Custom implementation in `app/backend/src/couchers/i18n/`
- **Creating translation files:** `yarn create-translation-files` (in app/web)

## Key Architectural Decisions

1. **gRPC over REST:** Strongly-typed API contracts, code generation
2. **Monorepo:** Easier coordination between frontend/backend changes
3. **Protocol Buffers:** Cross-platform serialization, backward compatibility
4. **PostGIS:** Geospatial queries for location-based features
5. **Material UI:** Consistent design system, accessibility

## Intellectual Property Notice

While the source code is MIT licensed, the following are proprietary to Couchers, Inc.:
- Logos and brand assets
- Color schemes and visual designs
- Marketing copy and long-form content
- The "Couchers" name and trademarks

If forking this project, you must rebrand completely to avoid confusion.

## Getting Help

- **Issues:** Create a GitHub issue for bugs or feature requests
- **General questions:** Check existing documentation first
- **Stuck on setup:** The maintainers are happy to help

## Additional Resources

- **High-level architecture:** `docs/architecture/high-level.md`
- **Frontend map search:** `docs/architecture/frontend/map-search.md`
- **Contributing guide:** `docs/contributing.md`
- **GitLab mirror:** https://gitlab.com/couchers/couchers (CI/CD runs here)

## Module-Specific Guides

For detailed information on specific modules:
- **Web Frontend:** See `app/web/claude.md`
- **Python Backend:** See `app/backend/claude.md`
