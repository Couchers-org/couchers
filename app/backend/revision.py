#!/usr/bin/env python3
# ruff: noqa: T201
"""
Script to create a PostgreSQL/PostGIS container, run Alembic migrations, and autogenerate a new migration.

Usage:
    uv run --with 'docker,psycopg[binary]' python revision.py [-m MESSAGE] [--alembic-ini PATH]

Arguments:
    -m, --message           Revision message for the generated migration (optional)
    --alembic-ini           Path to alembic.ini file (default: alembic.ini)
"""

import argparse
import os
import sys
import time
import traceback
from pathlib import Path
from typing import Any

import docker
import docker.errors
from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import Script
from sqlalchemy import create_engine
from sqlalchemy.dialects import registry

# Register psycopg (psycopg3) as the default driver for postgresql:// URLs
registry.register("postgresql", "sqlalchemy.dialects.postgresql.psycopg", "PGDialect_psycopg")

# Configuration
CONTAINER_NAME = "alembic_test_db"
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgres"
POSTGRES_DB = "testdb"
POSTGRES_PORT = 5432
HOST_PORT = 25432

# Database URL for Alembic (using psycopg driver)
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@localhost:{HOST_PORT}/{POSTGRES_DB}"

# PostGIS image configuration
POSTGIS_IMAGE_NAME = "couchers-postgis"
POSTGIS_DOCKERFILE_PATH = Path(__file__).parent.parent / "postgis"


def build_postgis_image_if_needed() -> str:
    """Build the PostGIS image from ../postgis if it doesn't exist locally."""
    client = docker.from_env()

    # Check if image already exists
    try:
        client.images.get(POSTGIS_IMAGE_NAME)
        print(f"Using existing PostGIS image '{POSTGIS_IMAGE_NAME}'")
        return POSTGIS_IMAGE_NAME
    except docker.errors.ImageNotFound:
        pass

    # Build the image
    print(f"Building PostGIS image '{POSTGIS_IMAGE_NAME}' from {POSTGIS_DOCKERFILE_PATH}...")
    client.images.build(
        path=str(POSTGIS_DOCKERFILE_PATH),
        tag=POSTGIS_IMAGE_NAME,
        rm=True,
    )
    print(f"PostGIS image '{POSTGIS_IMAGE_NAME}' built successfully!")
    return POSTGIS_IMAGE_NAME


def create_postgres_container() -> Any:
    """Create and start a PostGIS container."""
    postgis_image = build_postgis_image_if_needed()
    print(f"Creating PostGIS container '{CONTAINER_NAME}' with {postgis_image}...")

    client = docker.from_env()

    # Remove existing container if it exists
    try:
        existing_container = client.containers.get(CONTAINER_NAME)
        print(f"Stopping and removing existing container '{CONTAINER_NAME}'...")
        existing_container.stop()
        existing_container.remove()
    except docker.errors.NotFound:
        pass

    # Create and start new container
    container = client.containers.run(
        postgis_image,
        name=CONTAINER_NAME,
        environment={
            "POSTGRES_USER": POSTGRES_USER,
            "POSTGRES_PASSWORD": POSTGRES_PASSWORD,
            "POSTGRES_DB": POSTGRES_DB,
        },
        ports={f"{POSTGRES_PORT}/tcp": HOST_PORT},
        detach=True,
        remove=False,
    )

    print(f"Container '{CONTAINER_NAME}' started. Waiting for PostGIS to be ready...")

    # Wait for PostgreSQL to be ready by actually connecting
    # Note: pg_isready is not sufficient because PostGIS init scripts
    # start postgres, do setup, shut down, and restart
    max_attempts = 60
    for attempt in range(max_attempts):
        try:
            # Try to actually connect and run a simple query
            result = container.exec_run(
                f'psql -U {POSTGRES_USER} -d {POSTGRES_DB} -c "SELECT 1"',
                environment={"PGPASSWORD": POSTGRES_PASSWORD},
            )
            if result.exit_code == 0:
                # Small delay for connection stability
                time.sleep(1)
                print("PostGIS is ready!")
                return container
        except Exception:
            pass

        time.sleep(1)
        if (attempt + 1) % 5 == 0:
            print(f"Waiting... ({attempt + 1}/{max_attempts})")

    raise Exception("PostGIS failed to start within the timeout period")


def get_alembic_config(database_url: str, alembic_ini_path: str = "alembic.ini") -> Config:
    """Create and configure Alembic Config object."""
    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("sqlalchemy.url", database_url)
    return alembic_cfg


def get_current_revision(database_url: str) -> str | None:
    """Get current database revision using sync engine."""
    engine = create_engine(database_url)
    try:
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                with engine.connect() as conn:
                    context = MigrationContext.configure(conn)
                    return context.get_current_revision()
            except OSError as e:
                if attempt < max_retries:
                    print(f"OSError encountered: {e}. Retrying in 1 second... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(1)
                else:
                    print(f"OSError encountered after {max_retries} retries. Failing.")
                    raise
    finally:
        engine.dispose()
    return None


def run_alembic_upgrade(alembic_cfg: Config) -> None:
    """Run alembic upgrade to apply all migrations using Python API."""
    print("\nRunning Alembic upgrade (applying migrations)...")

    # Get current revision before upgrade
    database_url = alembic_cfg.get_main_option("sqlalchemy.url")
    if not database_url:
        raise RuntimeError("sqlalchemy.url is not set in alembic.ini")

    current_rev = get_current_revision(database_url)
    print(f"Current revision: {current_rev or 'None (empty database)'}")

    # Run upgrade
    command.upgrade(alembic_cfg, "head")

    # Get revision after upgrade
    new_rev = get_current_revision(database_url)
    print(f"New revision: {new_rev}")

    print("Migrations applied successfully!")


def run_alembic_autogenerate(alembic_cfg: Config, message: str = "Auto-generated migration") -> None:
    """Run alembic revision --autogenerate using Python API."""
    print(f"\nGenerating new migration: '{message}'...")

    revision = command.revision(alembic_cfg, message=message, autogenerate=True)

    if revision and isinstance(revision, Script):
        print(f"New migration generated: {revision.revision}")
        print(f"Migration file: {revision.path}")
    else:
        print("No changes detected - no migration generated.")


def cleanup_container(container: Any) -> None:
    """Stop and remove the PostGIS container."""
    if not container:
        return

    print(f"\nCleaning up container '{CONTAINER_NAME}'...")
    try:
        container.stop()
        container.remove()
        print("Container removed.")
    except Exception as e:
        print(f"Error during cleanup: {e}", file=sys.stderr)


def main(revision_message: str, alembic_ini_path: str) -> None:
    """Main execution flow."""
    container: Any = None

    try:
        # Step 1: Create PostGIS container
        container = create_postgres_container()

        # Step 2: Configure environment and Alembic
        # Set minimal environment variables required by couchers.config and migrations
        os.environ["DATABASE_CONNECTION_STRING"] = DATABASE_URL
        os.environ.setdefault("DEV", "1")
        os.environ.setdefault("SECRET", "0" * 64)  # 32-byte hex string
        alembic_cfg = get_alembic_config(DATABASE_URL, alembic_ini_path)

        # Step 3: Apply existing migrations
        run_alembic_upgrade(alembic_cfg)

        # Step 4: Generate new migration
        run_alembic_autogenerate(alembic_cfg, revision_message)
    except Exception as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
    finally:
        cleanup_container(container)


def cli() -> None:
    """CLI entry point for the script."""
    parser = argparse.ArgumentParser(description="Create PostGIS container and run Alembic migrations")
    parser.add_argument(
        "-m",
        "--message",
        type=str,
        default="New autogenerated migration",
        help="Revision message for the generated migration",
    )
    parser.add_argument(
        "--alembic-ini", type=str, default="alembic.ini", help="Path to alembic.ini file (default: alembic.ini)"
    )

    args = parser.parse_args()

    if not Path(args.alembic_ini).exists():
        print(f"Error: {args.alembic_ini} not found.", file=sys.stderr)
        print("Please run 'alembic init alembic' first to set up Alembic.", file=sys.stderr)
        sys.exit(1)

    main(revision_message=args.message, alembic_ini_path=args.alembic_ini)


if __name__ == "__main__":
    cli()
