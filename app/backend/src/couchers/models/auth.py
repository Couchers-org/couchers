from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text

from couchers.models.base import Base


class SignupToken(Base):
    """
    A signup token allows the user to verify their email and continue signing up.
    """

    __tablename__ = "signup_tokens"
    token = Column(String, primary_key=True)

    email = Column(String, nullable=False)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())

    def __repr__(self):
        return f"SignupToken(token={self.token}, email={self.email}, created={self.created}, expiry={self.expiry})"


class LoginToken(Base):
    """
    A login token sent in an email to a user, allows them to sign in between the times defined by created and expiry
    """

    __tablename__ = "login_tokens"
    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", backref="login_tokens")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())

    def __repr__(self):
        return f"LoginToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", backref="password_reset_tokens")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())

    def __repr__(self):
        return f"PasswordResetToken(token={self.token}, user={self.user}, created={self.created}, expiry={self.expiry})"


class UserSession(Base):
    """
    API keys/session cookies for the app

    There are two types of sessions: long-lived, and short-lived. Long-lived are
    like when you choose "remember this browser": they will be valid for a long
    time without the user interacting with the site. Short-lived sessions on the
    other hand get invalidated quickly if the user does not interact with the
    site.

    Long-lived tokens are valid from `created` until `expiry`.

    Short-lived tokens expire after 168 hours (7 days) if they are not used.
    """

    __tablename__ = "sessions"
    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # whether it's a long-lived or short-lived session
    long_lived = Column(Boolean, nullable=False)

    # the time at which the session was created
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the expiry of the session: the session *cannot* be refreshed past this
    expiry = Column(DateTime(timezone=True), nullable=False, server_default=func.now() + text("interval '90 days'"))

    # the time at which the token was invalidated, allows users to delete sessions
    deleted = Column(DateTime(timezone=True), nullable=True, default=None)

    # the last time this session was used
    last_seen = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # count of api calls made with this token/session (if we're updating last_seen, might as well update this too)
    api_calls = Column(Integer, nullable=False, default=0)

    # details of the browser, if available
    # these are from the request creating the session, not used for anything else
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    user = relationship("User", backref="sessions")

    @hybrid_property
    def is_valid(self):
        """
        It must have been created and not be expired or deleted.

        Also, if it's a short lived token, it must have been used in the last 168 hours.
        """
        return (
            (self.created <= func.now())
            & (self.expiry >= func.now())
            & (self.deleted == None)
            & (self.long_lived | (func.now() - self.last_seen < text("interval '168 hours'")))
        )
