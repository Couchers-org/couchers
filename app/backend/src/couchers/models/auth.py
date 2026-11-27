from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    case,
    func,
    select,
    text,
    true,
)
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.models.base import Base
from couchers.models.rest import ClientPlatform
from couchers.utils import now

if TYPE_CHECKING:
    from couchers.models.users import User


class UserSession(Base, kw_only=True):
    """
    API keys/session cookies for the app

    There are two types of sessions: long-lived, and short-lived. Long-lived are
    like when you choose "remember this browser": they will be valid for a long
    time without the user interacting with the site. Short-lived sessions, on the
    other hand, get invalidated quickly if the user does not interact with the
    site.

    Long-lived tokens are valid from `created` until `expiry`.

    Short-lived tokens expire after 168 hours (7 days) if they are not used.
    """

    __tablename__ = "sessions"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # sessions are either "api keys" or "session cookies", otherwise identical
    # an api key is put in the authorization header (e.g. "authorization: Bearer <token>")
    # a session cookie is set in the "couchers-sesh" cookie (e.g. "cookie: couchers-sesh=<token>")
    # when a session is created, it's fixed as one or the other for security reasons
    # for api keys to be useful, they should be long-lived and have a long expiry
    is_api_key: Mapped[bool] = mapped_column(Boolean, server_default=expression.false())

    # whether it's a long-lived or short-lived session
    long_lived: Mapped[bool] = mapped_column(Boolean)

    # the time at which the session was created
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # the expiry of the session: the session *cannot* be refreshed past this
    expiry: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now() + text("interval '730 days'"), init=False
    )

    # the time at which the token was invalidated, allows users to delete sessions
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # the last time this session was used
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # count of api calls made with this token/session (if we're updating last_seen, might as well update this too)
    api_calls: Mapped[int] = mapped_column(Integer, default=0)

    # details of the browser, if available
    # these are from the request creating the session, not used for anything else
    ip_address: Mapped[str | None] = mapped_column(String, default=None)
    user_agent: Mapped[str | None] = mapped_column(String, default=None)

    user: Mapped[User] = relationship(init=False, backref="sessions")

    @hybrid_property
    def is_valid(self) -> Any:
        """
        It must have been created and not be expired or deleted.

        Also, if it's a short lived token, it must have been used in the last 168 hours.

        TODO: this probably won't run in python (instance level), only in sql (class level)
        """
        return (
            (self.created <= func.now())
            & (self.expiry >= func.now())
            & (self.deleted == None)
            # CASE so that session_touches is only read when last_seen alone would have expired the session
            & case(
                (self.long_lived | (func.now() - self.last_seen < text("interval '168 hours'")), true()),  # type: ignore[operator]
                else_=func.now() - self.last_used < text("interval '168 hours'"),
            )
        )

    @hybrid_property
    def last_used(self) -> Any:
        """
        last_seen, but also counting calls that compact_session_activity has not added to it yet.
        """
        return func.greatest(
            self.last_seen,
            select(func.max(SessionTouch.time)).where(SessionTouch.token == self.token).scalar_subquery(),
        )

    __table_args__ = (
        Index(
            "ix_sessions_by_token",
            "token",
            postgresql_using="hash",
        ),
    )


class SessionTouch(Base, kw_only=True):
    """
    One row per authenticated API call, waiting to be added into sessions and user_activity by
    compact_session_activity. Each call inserting its own row means concurrent calls on one session no longer queue on
    that session's rows.
    """

    __tablename__ = "session_touches"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # no foreign keys: checking them would make every insert lock the referenced sessions and users rows
    token: Mapped[str] = mapped_column(String)
    user_id: Mapped[int] = mapped_column(BigInteger)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    ip_address: Mapped[str | None] = mapped_column(INET, default=None)
    user_agent: Mapped[str | None] = mapped_column(String, default=None)
    sofa: Mapped[str | None] = mapped_column(String, default=None)
    client_platform: Mapped[ClientPlatform | None] = mapped_column(Enum(ClientPlatform), default=None)

    __table_args__ = (Index("ix_session_touches_token", token),)


class LoginToken(Base, kw_only=True):
    """
    A login token sent in an email to a user, allows them to sign in between the times defined by created and expiry
    """

    __tablename__ = "login_tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # timezones should always be UTC
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(init=False, backref="login_tokens")

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= now()) & (self.expiry >= now())

    def __repr__(self) -> str:
        return f"LoginToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"


class PasswordResetToken(Base, kw_only=True):
    __tablename__ = "password_reset_tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(init=False, backref="password_reset_tokens")

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= now()) & (self.expiry >= now())

    def __repr__(self) -> str:
        return f"PasswordResetToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"
