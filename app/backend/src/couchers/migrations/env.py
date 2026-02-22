import re
from logging.config import fileConfig
from pathlib import Path
from typing import Any

from alembic import context
from alembic.config import Config
from sqlalchemy import engine_from_config, pool
from sqlalchemy.schema import MetaData

from couchers import models
from couchers.config import config as couchers_config

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config: Config = context.config

config.set_main_option("sqlalchemy.url", couchers_config["DATABASE_CONNECTION_STRING"])


# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.get_main_option("dont_mess_up_logging", "dont_care") == "dont_care":
    if not config.config_file_name:
        raise RuntimeError(config.config_file_name)
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata: MetaData = models.Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


exclude_tables = config.get_section("alembic:exclude", {}).get("tables", "").split(",")

VERSIONS_DIR = Path(__file__).parent / "versions"


def _next_ordinal() -> str:
    """Compute the next ordinal migration number (e.g. "0134") by scanning existing filenames."""
    max_ordinal = 0
    for path in VERSIONS_DIR.glob("*.py"):
        match = re.match(r"^(\d+)_", path.name)
        if match:
            max_ordinal = max(max_ordinal, int(match.group(1)))
    return f"{max_ordinal + 1:04d}"


def process_revision_directives(context: Any, revision: Any, directives: Any) -> None:
    """Set the revision ID to the next ordinal number instead of a random hex string."""
    if directives:
        directives[0].rev_id = _next_ordinal()


def include_name(name: str | None, type_: str, parent_names: Any) -> bool:
    if type_ == "schema":
        return name in [None, "logging"]
    if type_ == "table":
        return name not in exclude_tables
    return True


def include_object(obj: Any, name: str | None, type_: str, reflected: bool, compare_to: Any) -> bool:
    """
    Filter objects during autogenerate comparison.

    Unlike include_name (which only filters database reflection), this hook
    filters BOTH database objects AND model metadata objects, which is needed
    to properly ignore GeoAlchemy2's auto-generated spatial indexes.
    """
    # Filter out GeoAlchemy2 auto-generated spatial indexes (from both DB and metadata)
    # These indexes are named like: idx_<table>_<column> and use GIST
    if type_ == "index" and name is not None and name.startswith("idx_") and name.endswith("_geom"):
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
        include_name=include_name,
        include_object=include_object,
        compare_type=True,
        process_revision_directives=process_revision_directives,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
            include_name=include_name,
            include_object=include_object,
            process_revision_directives=process_revision_directives,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
