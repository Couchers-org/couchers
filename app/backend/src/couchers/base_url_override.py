"""
Dev/testing override of BASE_URL, see couchers.models.rest.BaseUrlOverride.

The active override for a user is applied via CouchersContext.use_base_url_override, which sets the
base_url_override contextvar for the duration of a request (the authenticated user) or a notification job (the
recipient); CouchersContext.base_url reads it, so that every link built via couchers.urls points back at whatever
frontend the developer is testing on. Gated by ENABLE_DEV_APIS, so this is entirely inert in real prod (no
overrides can ever be created or applied there).
"""

from contextvars import ContextVar
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.models import BaseUrlOverride
from couchers.utils import now

BASE_URL_OVERRIDE_TTL = timedelta(minutes=15)

# Per-operation override of BASE_URL, read by CouchersContext.base_url. Only ever populated via the
# ENABLE_DEV_APIS-gated debug API, so in real prod it stays None and links always use config["BASE_URL"].
base_url_override: ContextVar[str | None] = ContextVar("base_url_override", default=None)


def get_active_base_url_override(session: Session, user_id: int) -> str | None:
    """The most recently set, non-expired base url override for the user, if any."""
    return session.execute(
        select(BaseUrlOverride.base_url)
        .where(BaseUrlOverride.user_id == user_id)
        .where(BaseUrlOverride.created > now() - BASE_URL_OVERRIDE_TTL)
        .order_by(BaseUrlOverride.created.desc(), BaseUrlOverride.id.desc())
        .limit(1)
    ).scalar_one_or_none()
