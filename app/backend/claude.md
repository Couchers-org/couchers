# Couchers.org Backend - AI Assistant Guide

## Overview

This is the Python backend for Couchers.org. It provides a gRPC API for the web and mobile frontends, handles business logic, and manages the PostgreSQL database.

**Technology Stack:**
- **Language:** Python 3.13+
- **API Framework:** gRPC with Protocol Buffers
- **Database:** PostgreSQL with PostGIS extension
- **ORM:** SQLAlchemy 2.0+
- **Migrations:** Alembic
- **Testing:** pytest with pytest-cov
- **Linting:** Ruff
- **Type Checking:** mypy (strict mode)
- **Dependency Management:** uv
- **Error Tracking:** Sentry SDK
- **Observability:** OpenTelemetry (OTLP, Prometheus)

## Project Structure

```
app/backend/
├── src/
│   ├── couchers/           # Main application package
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── servicers/      # gRPC service implementations
│   │   ├── migrations/     # Alembic database migrations
│   │   ├── jobs/           # Background job handlers
│   │   ├── email/          # Email templates and sending
│   │   ├── notifications/  # Push notification system
│   │   ├── helpers/        # Utility functions
│   │   ├── i18n/           # Internationalization
│   │   ├── proto/          # Generated Protocol Buffer code
│   │   ├── db.py           # Database connection and session management
│   │   ├── config.py       # Configuration management
│   │   ├── interceptors.py # gRPC interceptors
│   │   ├── metrics.py      # Prometheus metrics
│   │   └── materialized_views.py # Database materialized views
│   ├── dummy_data.py       # Test data generation
│   ├── app.py              # Main application entry point
│   └── tests/              # Test files
├── pyproject.toml          # Project metadata and dependencies
├── Makefile                # Development task shortcuts
└── pytest.ini              # pytest configuration
```

## Getting Started

### Prerequisites

- **Docker** and **Docker Compose** (for full local environment)
- **Python 3.13+** (for local development without Docker)
- **uv** (Python package installer - installed via `make setup`)

### Quick Start (Docker - Recommended)

```bash
# From repository root
cd couchers

# Generate Protocol Buffers
cd app
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh

# Build and start all services
docker compose up --build
```

This starts:
- **Backend API:** localhost:8888
- **PostgreSQL:** localhost:5432 (see `postgres.dev.env` for credentials)
- **Proxy:** localhost:8080
- **MailDev:** localhost:1080 (email inbox)
- **Prometheus:** localhost:9090

### Local Development (Without Docker)

```bash
cd app/backend

# Install uv (Python package installer)
make setup

# Create virtual environment and install dependencies
uv sync --frozen

# Start test database (requires Docker)
make setup-db

# Run tests
make test

# Run specific test file
make test file=tests/test_auth.py
```

## Development

### Available Make Commands

From `app/backend/`:

- **`make setup`** - Install uv package manager
- **`make setup-db`** - Start test database container
- **`make test`** - Run all tests
- **`make test file=<file>`** - Run specific test file
- **`make lint`** - Run Ruff linter
- **`make format`** - Format code with Ruff
- **`make typecheck`** - Run mypy type checking

### Running Tests in Docker

From `app/`:
```bash
docker compose -f docker-compose.test.yml up --build
```

This runs the full test suite with coverage reports.

## Database

### Technology
- **PostgreSQL** with **PostGIS** extension for geospatial data
- **SQLAlchemy 2.0+** as ORM
- **Alembic** for schema migrations

### Models

Database models are defined in `src/couchers/models/`:
- Use SQLAlchemy declarative base
- Type-annotated with mypy support
- Include relationships, indexes, and constraints

**Example Model Structure:**
```python
from sqlalchemy import Column, Integer, String
from couchers.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    # ... more fields
```

### Migrations

**Location:** `src/couchers/migrations/`

**Creating a Migration:**
```bash
# Auto-generate migration from model changes
cd app/backend
alembic revision --autogenerate -m "Description of changes"

# Review generated migration in migrations/versions/
# Edit if necessary

# Apply migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

**Important:**
- Always review auto-generated migrations
- Test both upgrade and downgrade
- Never edit existing migrations in version control
- Use `docs/database.md` for detailed migration guide

### Database Connection

**Configuration:**
- **Dev:** `app/backend.dev.env`
- **Test:** `app/backend.test.env`
- Connection pooling configured in `src/couchers/db.py`

**Accessing Database:**
```python
from couchers.db import session_scope

with session_scope() as session:
    user = session.query(User).filter_by(username="aapeli").one()
```

### Common Database Issues

**Issue: Can't connect to database**
- Check which port PostgreSQL is using: `docker compose up postgres`
- Verify password in environment files (`app/postgres.dev.env` or `app/postgres.test.env`)

**Issue: Migration conflicts or out-of-date database**
1. Stop postgres: `docker compose stop postgres`
2. Delete database volume: `rm -rf app/data/postgres`
3. Restart: `docker compose up --build`

## gRPC API

### Service Definitions

**Protocol Buffers:** Located in `app/proto/`
- Define all API contracts
- Generate Python code to `src/couchers/proto/`
- Versioned and shared across frontend/backend

**Regenerating Protos:**
```bash
cd app
docker run --pull always --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

### Servicers

**Location:** `src/couchers/servicers/`

Servicers implement the gRPC service definitions:
```python
from couchers.proto import api_pb2, api_pb2_grpc

class MyServiceServicer(api_pb2_grpc.MyServiceServicer):
    def MyMethod(self, request, context):
        # Implementation
        return api_pb2.MyResponse(...)
```

**Key Servicers:**
- Authentication and session management
- User profiles and search
- Messaging and requests
- Events and communities
- References and moderation

### Interceptors

**Location:** `src/couchers/interceptors.py`

Interceptors handle cross-cutting concerns:
- **Authentication:** Session validation
- **Authorization:** Permission checks
- **Logging:** Request/response logging
- **Error handling:** Exception conversion to gRPC status codes
- **Metrics:** Request duration and counts
- **Tracing:** OpenTelemetry span creation

### Context

**Location:** `src/couchers/context.py`

Request context includes:
- Current user session
- Request metadata
- Database session
- Tracing information

## Testing

### Test Organization

**Location:** `src/tests/`

Tests are organized to mirror the source structure:
- Unit tests for individual functions/classes
- Integration tests for servicers (API endpoints)
- Database tests with fixtures

### Running Tests

```bash
# All tests
make test

# Specific file
make test file=tests/test_users.py

# With coverage
pytest --cov=couchers --cov-report=html

# In Docker (full CI suite)
cd app
docker compose -f docker-compose.test.yml up --build
```

### Test Fixtures

Common fixtures in `conftest.py`:
- `db` - Database session
- `client` - gRPC test client
- `testuser` - Pre-created test user

**Example Test:**
```python
def test_get_user(client, testuser):
    response = client.GetUser(api_pb2.GetUserRequest(user_id=testuser.id))
    assert response.username == testuser.username
```

### Best Practices
- Use fixtures for common setup
- Test both success and error cases
- Mock external services (email, S3, etc.)
- Keep tests isolated and independent
- Use meaningful test names that describe behavior

## Configuration

### Environment Variables

**Files:**
- `app/backend.dev.env` - Development config
- `app/backend.test.env` - Test config
- `app/postgres.dev.env` - Dev database credentials
- `app/postgres.test.env` - Test database credentials

**Loading Config:**
```python
from couchers import config

database_url = config.DATABASE_URL
secret_key = config.SECRET_KEY
```

### Config Management

**Location:** `src/couchers/config.py`

Handles:
- Environment variable loading
- Default values
- Type conversion
- Validation

## Background Jobs

**Location:** `src/couchers/jobs/`

Asynchronous task processing:
- Email sending
- Notification delivery
- Scheduled maintenance tasks
- Data processing

**Job Handlers:** Defined in `handlers.py`

## Email System

**Location:** `src/couchers/email/`

Email functionality:
- **Templates:** Jinja2 templates for HTML emails
- **Sending:** SMTP configuration
- **Dev Environment:** MailDev at http://localhost:1080

**Sending Email:**
```python
from couchers.email import send_email

send_email(
    to="user@example.com",
    subject="Welcome",
    template="welcome.html",
    template_args={"username": "User"}
)
```

## Notifications

**Location:** `src/couchers/notifications/`

Push notification system:
- Web Push API (for browsers)
- Mobile push (for apps)
- Notification preferences per user

## Security

### Authentication
- Session-based authentication
- Secure token generation (`crypto.py`)
- Password hashing (industry-standard algorithms)

### Authorization
- Role-based access control
- Permission checking in interceptors
- User verification requirements

### Best Practices
- **Never** log passwords or tokens
- Use parameterized queries (SQLAlchemy prevents SQL injection)
- Validate all user input
- Sanitize output for XSS prevention
- Rate limiting on sensitive endpoints

## Code Quality

### Type Checking (mypy)

**Config:** `pyproject.toml` under `[tool.mypy]`
- **Strict mode** enabled
- Type stubs for most dependencies
- Some exclusions for generated code

**Running:**
```bash
mypy src/
```

### Linting (Ruff)

**Config:** `pyproject.toml` under `[tool.ruff]`

**Selected Rules:**
- pycodestyle (E)
- pyflakes (F)
- pyupgrade (UP)
- flake8-bugbear (B)
- flake8-comprehensions (C4)
- flake8-builtins (A)
- isort (I)

**Running:**
```bash
ruff check src/
ruff check --fix src/  # Auto-fix
ruff format src/       # Format code
```

### Code Coverage

**Config:** `pyproject.toml` under `[tool.coverage]`
- Excludes proto files and migrations
- HTML reports available at https://develop--bcov.preview.couchershq.org
- Target: >80% coverage

## Observability

### Metrics (Prometheus)

**Location:** `src/couchers/metrics.py`

Exposes:
- Request counts and durations
- Database query metrics
- Business metrics (signups, messages, etc.)
- System metrics (CPU, memory)

**Accessing:** http://localhost:9090 (when running locally)

### Tracing (OpenTelemetry)

**Instrumentation:**
- gRPC calls
- Database queries
- HTTP requests
- Custom spans for business logic

**Configuration:** Environment variables for OTLP endpoint

### Error Tracking (Sentry)

**Integration:** `sentry-sdk`
- Automatic exception capture
- Release tracking
- User context
- Performance monitoring

**Dashboard:** https://couchers.sentry.io/

## Geospatial Features

### PostGIS

The database includes PostGIS for:
- User location storage
- Distance calculations
- Geographic searches
- Spatial indexes

**GeoAlchemy2:** SQLAlchemy integration for PostGIS types

**Common Operations:**
```python
from geoalchemy2 import Geography
from sqlalchemy import func

# Find users within 50km
nearby_users = session.query(User).filter(
    func.ST_DWithin(
        User.geom,
        func.ST_MakePoint(lng, lat),
        50000  # meters
    )
).all()
```

## Development Workflow

### Making Changes

1. Create feature branch: `backend/feature/description`
2. Make changes with type hints
3. Add/update tests
4. Run linting: `ruff check src/`
5. Run type checking: `mypy src/`
6. Run tests: `make test`
7. Create PR for review

### Before Committing

**Pre-commit Checklist:**
- [ ] Tests pass (`make test`)
- [ ] Type checking passes (`mypy src/`)
- [ ] Linting passes (`ruff check src/`)
- [ ] No debug prints or commented code
- [ ] Docstrings added for public functions
- [ ] Migration created if database changed

### CI/CD

Tests run automatically on:
- Every push to any branch
- Pull request creation/update
- Merge to `develop`

**Pipeline includes:**
- Linting (Ruff)
- Type checking (mypy)
- Tests (pytest)
- Coverage reports
- Docker image building

## Common Issues & Solutions

### Issue: Proto import errors
**Solution:** Regenerate protos:
```bash
cd app
docker run --pull always --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

### Issue: Database connection refused
**Solution:** Check database is running and port is correct:
```bash
docker compose up postgres
# Check port in output, verify matches in backend.dev.env
```

### Issue: Alembic migration conflicts
**Solution:** Database might be out of sync. Nuke and recreate:
```bash
docker compose stop postgres
rm -rf app/data/postgres
docker compose up --build
```

### Issue: Import errors or dependency issues
**Solution:** Resync dependencies:
```bash
cd app/backend
uv sync --frozen
```

## Debugging

### VS Code Debugging

See `docs/backend-in-vscode.md` for detailed VS Code setup.

**Quick Setup:**
1. Attach to running Docker container
2. Set breakpoints in code
3. Use Debug Console for inspection

### Logging

**Configuration:** Python logging module
- Different log levels for dev/prod
- Structured logging for better parsing
- Logs include request IDs for tracing

**Adding Logs:**
```python
import logging

logger = logging.getLogger(__name__)
logger.info("User %s logged in", user.username)
logger.error("Failed to process request", exc_info=True)
```

## Test Data

**Location:** `src/dummy_data.py`

Provides:
- Sample users (including `aapeli` with known password)
- Sample communities, events, messages
- Referenced by `src/data/dummy_users.json`

**Login Credentials (Local Dev):**
- Username: `aapeli`
- Password: `Aapeli's password`

## Additional Resources

- **Main README:** `../../readme.md`
- **This module's README:** `readme.md`
- **Database guide:** `../../docs/database.md`
- **Docker tips:** `../../docs/docker.md`
- **Architecture:** `../../docs/architecture/main.md`
- **SQLAlchemy docs:** https://docs.sqlalchemy.org/
- **Alembic docs:** https://alembic.sqlalchemy.org/
- **gRPC Python docs:** https://grpc.io/docs/languages/python/
- **PostGIS docs:** https://postgis.net/documentation/

## Contributing

### Branch Naming
Use format: `backend/{type}/{description}`
- Examples: `backend/feature/user-blocking`, `backend/bug/auth-token`

### PR Requirements
- [ ] Tests added/updated
- [ ] Type hints on all functions
- [ ] Docstrings for public APIs
- [ ] Migration created if schema changed
- [ ] No mypy errors
- [ ] No ruff errors
- [ ] Test coverage maintained or improved
- [ ] Code reviewed and approved

### Code Review Focus
- Correctness and edge cases
- Security implications
- Database query efficiency
- API backward compatibility
- Error handling
- Type safety
