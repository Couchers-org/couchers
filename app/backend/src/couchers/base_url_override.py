"""
Dev/testing override of BASE_URL, see couchers.models.rest.BaseUrlOverride.

The active override for a user is set on the base_url_override contextvar for the duration of a request (from the
authenticated user) or a notification job (from the recipient), and CouchersContext.base_url reads it, so that
every link built via couchers.urls points back at whatever frontend the developer is testing on. Gated by
ENABLE_DEV_APIS, so this is entirely inert in real prod (no overrides can ever be created or applied there).
"""

from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.config import config
from couchers.models import BaseUrlOverride
from couchers.utils import now

BASE_URL_OVERRIDE_TTL = timedelta(minutes=15)

# Per-operation override of BASE_URL, read by CouchersContext.base_url. Only ever populated via the
# ENABLE_DEV_APIS-gated debug API, so in real prod it stays None and links always use config["BASE_URL"].
base_url_override: ContextVar[str | None] = ContextVar("base_url_override", default=None)


def get_active_base_url_override(session: Session, user_id: int) -> str | None:
    """The most recently set, non-expired, non-empty base url override for the user, if any."""
    base_url = session.execute(
        select(BaseUrlOverride.base_url)
        .where(BaseUrlOverride.user_id == user_id)
        .where(BaseUrlOverride.created > now() - BASE_URL_OVERRIDE_TTL)
        .order_by(BaseUrlOverride.created.desc(), BaseUrlOverride.id.desc())
        .limit(1)
    ).scalar_one_or_none()
    return base_url or None


@contextmanager
def use_base_url_override_for_user(session: Session, user_id: int | None) -> Iterator[None]:
    """Set the base url override contextvar to the user's active override for the duration of the block."""
    override = None
    if config["ENABLE_DEV_APIS"] and user_id is not None:
        override = get_active_base_url_override(session, user_id)

    if not override:
        yield
        return

    token = base_url_override.set(override)
    try:
        yield
    finally:
        base_url_override.reset(token)
