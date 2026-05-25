import enum
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.constants import GUIDELINES_VERSION
from couchers.models.base import Base, Geom
from couchers.models.moderation import ModerationObjectType
from couchers.models.users import HostingStatus
from couchers.utils import now

if TYPE_CHECKING:
    from couchers.models import HostRequest, User
    from couchers.models.moderation import ModerationState


class UserBadge(Base, kw_only=True):
    """
    A badge on a user's profile
    """

    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    # corresponds to "id" in badges.json
    badge_id: Mapped[str] = mapped_column(String, index=True)

    # take this with a grain of salt, someone may get then lose a badge for whatever reason
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    user: Mapped[User] = relationship(init=False, back_populates="badges")


class FriendStatus(enum.Enum):
    pending = enum.auto()
    accepted = enum.auto()
    rejected = enum.auto()
    cancelled = enum.auto()


class FriendRelationship(Base, kw_only=True):
    """
    Friendship relations between users

    TODO: make this better with sqlalchemy self-referential stuff
    """

    __tablename__ = "friend_relationships"
    __moderation_author_column__ = "from_user_id"
    __moderation_object_type__ = ModerationObjectType.friend_request

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Unified Moderation System
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    status: Mapped[FriendStatus] = mapped_column(Enum(FriendStatus), default=FriendStatus.pending)

    # timezones should always be UTC
    time_sent: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    time_responded: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    from_user: Mapped[User] = relationship(
        init=False, backref="friends_from", foreign_keys="FriendRelationship.from_user_id"
    )
    to_user: Mapped[User] = relationship(init=False, backref="friends_to", foreign_keys="FriendRelationship.to_user_id")
    moderation_state: Mapped[ModerationState] = relationship(init=False)

    __table_args__ = (
        # Ping looks up pending friend reqs, this speeds that up
        Index(
            "ix_friend_relationships_status_to_from",
            status,
            to_user_id,
            from_user_id,
        ),
        # At most one active (pending or accepted) relationship per unordered user pair
        Index(
            "uq_friend_relationships_active_pair",
            func.least(from_user_id, to_user_id),
            func.greatest(from_user_id, to_user_id),
            unique=True,
            postgresql_where=status.in_([FriendStatus.pending, FriendStatus.accepted]),
        ),
    )


class ContributeOption(enum.Enum):
    yes = enum.auto()
    maybe = enum.auto()
    no = enum.auto()


class ContributorForm(Base, kw_only=True):
    """
    Someone filled in the contributor form
    """

    __tablename__ = "contributor_forms"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    ideas: Mapped[str | None] = mapped_column(String, default=None)
    features: Mapped[str | None] = mapped_column(String, default=None)
    experience: Mapped[str | None] = mapped_column(String, default=None)
    contribute: Mapped[ContributeOption | None] = mapped_column(Enum(ContributeOption), default=None)
    contribute_ways: Mapped[list[str]] = mapped_column(ARRAY(String))
    expertise: Mapped[str | None] = mapped_column(String, default=None)

    user: Mapped[User] = relationship(init=False, backref="contributor_forms")

    @hybrid_property
    def is_filled(self) -> Any:
        """
        Whether the form counts as having been filled
        """
        return (
            (self.ideas != None)
            | (self.features != None)
            | (self.experience != None)
            | (self.contribute != None)
            | (self.contribute_ways != [])
            | (self.expertise != None)
        )

    @property
    def should_notify(self) -> bool:
        """
        If this evaluates to true, we send an email to the recruitment team.

        We currently send if expertise is listed, or if they list a way to help outside of a set list
        """
        return False


class SignupFlow(Base, kw_only=True):
    """
    Signup flows/incomplete users

    Coinciding fields have the same meaning as in User
    """

    __tablename__ = "signup_flows"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # housekeeping
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    flow_token: Mapped[str] = mapped_column(String, unique=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    email_token: Mapped[str | None] = mapped_column(String, default=None)
    email_token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    ## Basic
    name: Mapped[str] = mapped_column(String)
    # TODO: unique across both tables
    email: Mapped[str] = mapped_column(String, unique=True)
    # TODO: invitation, attribution

    ## Account
    # TODO: unique across both tables
    username: Mapped[str | None] = mapped_column(String, unique=True, default=None)
    hashed_password: Mapped[bytes | None] = mapped_column(Binary, default=None)
    birthdate: Mapped[date | None] = mapped_column(Date, default=None)  # in the timezone of birthplace
    gender: Mapped[str | None] = mapped_column(String, default=None)
    hosting_status: Mapped[HostingStatus | None] = mapped_column(Enum(HostingStatus), default=None)
    city: Mapped[str | None] = mapped_column(String, default=None)
    geom: Mapped[Geom | None] = mapped_column(Geometry(geometry_type="POINT", srid=4326), default=None)
    geom_radius: Mapped[float | None] = mapped_column(Float, default=None)

    accepted_tos: Mapped[int | None] = mapped_column(Integer, default=None)
    accepted_community_guidelines: Mapped[int] = mapped_column(Integer, server_default="0", init=False)

    opt_out_of_newsletter: Mapped[bool | None] = mapped_column(Boolean, default=None)

    ## Feedback (now unused)
    filled_feedback: Mapped[bool] = mapped_column(Boolean, default=False)
    ideas: Mapped[str | None] = mapped_column(String, default=None)
    features: Mapped[str | None] = mapped_column(String, default=None)
    experience: Mapped[str | None] = mapped_column(String, default=None)
    contribute: Mapped[ContributeOption | None] = mapped_column(Enum(ContributeOption), default=None)
    contribute_ways: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=None)
    expertise: Mapped[str | None] = mapped_column(String, default=None)

    ## Motivations (how they heard about us and what they want to do)
    filled_motivations: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), default=False)
    heard_about_couchers: Mapped[str | None] = mapped_column(String, default=None)
    signup_motivations: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}", default_factory=list)

    invite_code_id: Mapped[str | None] = mapped_column(ForeignKey("invite_codes.id"), default=None)

    @hybrid_property
    def token_is_valid(self) -> Any:
        return (self.email_token != None) & (self.email_token_expiry >= now())  # type: ignore[operator]

    @hybrid_property
    def account_is_filled(self) -> Any:
        return (
            (self.username != None)
            & (self.birthdate != None)
            & (self.gender != None)
            & (self.hosting_status != None)
            & (self.city != None)
            & (self.geom != None)
            & (self.geom_radius != None)
            & (self.accepted_tos != None)
            & (self.opt_out_of_newsletter != None)
        )

    @hybrid_property
    def is_completed(self) -> Any:
        return (
            self.email_verified
            & self.account_is_filled
            & (self.accepted_community_guidelines == GUIDELINES_VERSION)
            & self.filled_motivations
        )


class AccountDeletionToken(Base, kw_only=True):
    __tablename__ = "account_deletion_tokens"

    token: Mapped[str] = mapped_column(String, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(init=False, backref="account_deletion_tokens")

    @hybrid_property
    def is_valid(self) -> Any:
        return (self.created <= now()) & (self.expiry >= now())

    def __repr__(self) -> str:
        return f"AccountDeletionToken(token={self.token}, user_id={self.user_id}, created={self.created}, expiry={self.expiry})"


class UserActivity(Base, kw_only=True):
    """
    User activity: for each unique (user_id, period, ip_address, user_agent) tuple, keep track of number of api calls

    Used for user "last active" as well as admin stuff
    """

    __tablename__ = "user_activity"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # the start of a period of time, e.g. 1 hour during which we bin activeness
    period: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # details of the browser, if available
    ip_address: Mapped[str | None] = mapped_column(INET, default=None)
    user_agent: Mapped[str | None] = mapped_column(String, default=None)

    # count of api calls made with this ip, user_agent, and period
    api_calls: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        # helps look up this tuple quickly
        Index(
            "ix_user_activity_user_id_period_ip_address_user_agent",
            user_id,
            period,
            ip_address,
            user_agent,
            unique=True,
        ),
    )


class InviteCode(Base, kw_only=True):
    __tablename__ = "invite_codes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    creator_user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), init=False)
    disabled: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    creator: Mapped[User] = relationship(init=False, foreign_keys=[creator_user_id])


class ContentReport(Base, kw_only=True):
    """
    A piece of content reported to admins
    """

    __tablename__ = "content_reports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # the user who reported or flagged the content
    reporting_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # reason, e.g. spam, inappropriate, etc
    reason: Mapped[str] = mapped_column(String)
    # a short description
    description: Mapped[str] = mapped_column(String)

    # a reference to the content, see //docs/content_ref.md
    content_ref: Mapped[str] = mapped_column(String)
    # the author of the content (e.g. the user who wrote the comment itself)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    # details of the browser, if available
    user_agent: Mapped[str] = mapped_column(String)
    # the URL the user was on when reporting the content
    page: Mapped[str] = mapped_column(String)

    # see comments above for reporting vs author
    reporting_user: Mapped[User] = relationship(init=False, foreign_keys="ContentReport.reporting_user_id")
    author_user: Mapped[User] = relationship(init=False, foreign_keys="ContentReport.author_user_id")


class Email(Base, kw_only=True):
    """
    Table of all dispatched emails for debugging purposes, etc.
    """

    __tablename__ = "emails"

    id: Mapped[str] = mapped_column(String, primary_key=True)

    # timezone should always be UTC
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    sender_name: Mapped[str] = mapped_column(String)
    sender_email: Mapped[str] = mapped_column(String)

    recipient: Mapped[str] = mapped_column(String)
    subject: Mapped[str] = mapped_column(String)

    plain: Mapped[str] = mapped_column(String)
    html: Mapped[str] = mapped_column(String)

    list_unsubscribe_header: Mapped[str | None] = mapped_column(String, default=None)
    source_data: Mapped[str | None] = mapped_column(String, default=None)


class SMS(Base, kw_only=True):
    """
    Table of all sent SMSs for debugging purposes, etc.
    """

    __tablename__ = "smss"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    # timezone should always be UTC
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    # AWS message id
    message_id: Mapped[str] = mapped_column(String)

    # the SMS sender ID sent to AWS, name that the SMS appears to come from
    sms_sender_id: Mapped[str] = mapped_column(String)
    number: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(String)


class ReferenceType(enum.Enum):
    friend = enum.auto()
    surfed = enum.auto()  # The "from" user surfed with the "to" user
    hosted = enum.auto()  # The "from" user hosted the "to" user


class Reference(Base, kw_only=True):
    """
    Reference from one user to another
    """

    __tablename__ = "references"
    __moderation_author_column__ = "from_user_id"
    __moderation_object_type__ = ModerationObjectType.reference

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    # timezone should always be UTC
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    from_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    to_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    reference_type: Mapped[ReferenceType] = mapped_column(Enum(ReferenceType))

    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)

    host_request_id: Mapped[int | None] = mapped_column(ForeignKey("host_requests.id"), default=None)

    text: Mapped[str] = mapped_column(String)  # plain text
    # text that's only visible to mods
    private_text: Mapped[str | None] = mapped_column(String, default=None)  # plain text

    rating: Mapped[float] = mapped_column(Float)
    was_appropriate: Mapped[bool] = mapped_column(Boolean)

    from_user: Mapped[User] = relationship(init=False, backref="references_from", foreign_keys="Reference.from_user_id")
    to_user: Mapped[User] = relationship(init=False, backref="references_to", foreign_keys="Reference.to_user_id")

    host_request: Mapped[HostRequest | None] = relationship(init=False, backref="references")
    moderation_state: Mapped[ModerationState] = relationship(init=False)

    __table_args__ = (
        # Rating must be between 0 and 1, inclusive
        CheckConstraint(
            "rating BETWEEN 0 AND 1",
            name="rating_between_0_and_1",
        ),
        # Has host_request_id or it's a friend reference
        CheckConstraint(
            "(host_request_id IS NOT NULL) <> (reference_type = 'friend')",
            name="host_request_id_xor_friend_reference",
        ),
        # Each user can leave at most one friend reference to another user
        Index(
            "ix_references_unique_friend_reference",
            from_user_id,
            to_user_id,
            reference_type,
            unique=True,
            postgresql_where=(reference_type == ReferenceType.friend),
        ),
        # Each user can leave at most one reference to another user for each stay
        Index(
            "ix_references_unique_per_host_request",
            from_user_id,
            to_user_id,
            host_request_id,
            unique=True,
            postgresql_where=(host_request_id != None),
        ),
    )

    @property
    def should_report(self) -> bool:
        """
        If this evaluates to true, we send a report to the moderation team.
        """
        return bool(self.rating <= 0.4 or not self.was_appropriate or self.private_text)


class UserBlock(Base, kw_only=True):
    """
    Table of blocked users
    """

    __tablename__ = "user_blocks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    blocking_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    blocked_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    time_blocked: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    blocking_user: Mapped[User] = relationship(init=False, foreign_keys="UserBlock.blocking_user_id")
    blocked_user: Mapped[User] = relationship(init=False, foreign_keys="UserBlock.blocked_user_id")

    __table_args__ = (
        UniqueConstraint("blocking_user_id", "blocked_user_id"),
        Index("ix_user_blocks_blocking_user_id", blocking_user_id, blocked_user_id),
        Index("ix_user_blocks_blocked_user_id", blocked_user_id, blocking_user_id),
    )


class AccountDeletionReason(Base, kw_only=True):
    __tablename__ = "account_deletion_reason"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    reason: Mapped[str | None] = mapped_column(String, default=None)

    user: Mapped[User] = relationship(init=False)


class ModerationUserList(Base, kw_only=True):
    """
    Represents a list of users listed together by a moderator
    """

    __tablename__ = "moderation_user_lists"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    users: Mapped[list[User]] = relationship(
        init=False, secondary="moderation_user_list_members", back_populates="moderation_user_lists"
    )


class ModerationUserListMember(Base, kw_only=True):
    """
    Association table for many-to-many relationship between users and moderation_user_lists
    """

    __tablename__ = "moderation_user_list_members"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    moderation_list_id: Mapped[int] = mapped_column(ForeignKey("moderation_user_lists.id"), primary_key=True)


class AntiBotLog(Base, kw_only=True):
    __tablename__ = "antibot_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)

    ip_address: Mapped[str | None] = mapped_column(String, default=None)
    user_agent: Mapped[str | None] = mapped_column(String, default=None)

    action: Mapped[str] = mapped_column(String)
    token: Mapped[str] = mapped_column(String)

    score: Mapped[float] = mapped_column(Float)
    provider_data: Mapped[dict[str, Any]] = mapped_column(JSON)


class RateLimitAction(enum.Enum):
    """Possible user actions which can be rate limited."""

    host_request = "host request"
    friend_request = "friend request"
    chat_initiation = "chat initiation"


class RateLimitViolation(Base, kw_only=True):
    __tablename__ = "rate_limit_violations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[RateLimitAction] = mapped_column(Enum(RateLimitAction))
    is_hard_limit: Mapped[bool] = mapped_column(Boolean)

    user: Mapped[User] = relationship(init=False)

    __table_args__ = (
        # Fast lookup for rate limits in interval
        Index("ix_rate_limits_by_user", user_id, action, is_hard_limit, created),
    )


class Volunteer(Base, kw_only=True):
    __tablename__ = "volunteers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    display_name: Mapped[str | None] = mapped_column(String, default=None)
    display_location: Mapped[str | None] = mapped_column(String, default=None)

    role: Mapped[str] = mapped_column(String)

    # custom sort order on team page, sorted ascending
    sort_key: Mapped[float | None] = mapped_column(Float, default=None)

    started_volunteering: Mapped[date] = mapped_column(Date, server_default=text("CURRENT_DATE"), init=False)
    stopped_volunteering: Mapped[date | None] = mapped_column(Date, default=None)

    link_type: Mapped[str | None] = mapped_column(String, default=None)
    link_text: Mapped[str | None] = mapped_column(String, default=None)
    link_url: Mapped[str | None] = mapped_column(String, default=None)

    show_on_team_page: Mapped[bool] = mapped_column(Boolean, server_default=expression.true())

    __table_args__ = (
        # Link type, text, url should all be null or all not be null
        CheckConstraint(
            "(link_type IS NULL) = (link_text IS NULL) AND (link_type IS NULL) = (link_url IS NULL)",
            name="link_type_text",
        ),
    )
