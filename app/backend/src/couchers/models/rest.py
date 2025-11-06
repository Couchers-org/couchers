import enum

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
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
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression

from couchers.constants import GUIDELINES_VERSION
from couchers.models.base import Base
from couchers.models.users import HostingStatus
from couchers.utils import now


class UserBadge(Base):
    """
    A badge on a user's profile
    """

    __tablename__ = "user_badges"
    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    # corresponds to "id" in badges.json
    badge_id = Column(String, nullable=False, index=True)

    # take this with a grain of salt, someone may get then lose a badge for whatever reason
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", backref="badges")


class FriendStatus(enum.Enum):
    pending = enum.auto()
    accepted = enum.auto()
    rejected = enum.auto()
    cancelled = enum.auto()


class FriendRelationship(Base):
    """
    Friendship relations between users

    TODO: make this better with sqlalchemy self-referential stuff
    TODO: constraint on only one row per user pair where accepted or pending
    """

    __tablename__ = "friend_relationships"

    id = Column(BigInteger, primary_key=True)

    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    status = Column(Enum(FriendStatus), nullable=False, default=FriendStatus.pending)

    # timezones should always be UTC
    time_sent = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    time_responded = Column(DateTime(timezone=True), nullable=True)

    from_user = relationship("User", backref="friends_from", foreign_keys="FriendRelationship.from_user_id")
    to_user = relationship("User", backref="friends_to", foreign_keys="FriendRelationship.to_user_id")

    __table_args__ = (
        # Ping looks up pending friend reqs, this speeds that up
        Index(
            "ix_friend_relationships_status_to_from",
            status,
            to_user_id,
            from_user_id,
        ),
    )


class ContributeOption(enum.Enum):
    yes = enum.auto()
    maybe = enum.auto()
    no = enum.auto()


class ContributorForm(Base):
    """
    Someone filled in the contributor form
    """

    __tablename__ = "contributor_forms"

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ideas = Column(String, nullable=True)
    features = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    contribute = Column(Enum(ContributeOption), nullable=True)
    contribute_ways = Column(ARRAY(String), nullable=False)
    expertise = Column(String, nullable=True)

    user = relationship("User", backref="contributor_forms")

    @hybrid_property
    def is_filled(self):
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
    def should_notify(self):
        """
        If this evaluates to true, we send an email to the recruitment team.

        We currently send if expertise is listed, or if they list a way to help outside of a set list
        """
        return False


class SignupFlow(Base):
    """
    Signup flows/incomplete users

    Coinciding fields have the same meaning as in User
    """

    __tablename__ = "signup_flows"

    id = Column(BigInteger, primary_key=True)

    # housekeeping
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    flow_token = Column(String, nullable=False, unique=True)
    email_verified = Column(Boolean, nullable=False, default=False)
    email_sent = Column(Boolean, nullable=False, default=False)
    email_token = Column(String, nullable=True)
    email_token_expiry = Column(DateTime(timezone=True), nullable=True)

    ## Basic
    name = Column(String, nullable=False)
    # TODO: unique across both tables
    email = Column(String, nullable=False, unique=True)
    # TODO: invitation, attribution

    ## Account
    # TODO: unique across both tables
    username = Column(String, nullable=True, unique=True)
    hashed_password = Column(Binary, nullable=True)
    birthdate = Column(Date, nullable=True)  # in the timezone of birthplace
    gender = Column(String, nullable=True)
    hosting_status = Column(Enum(HostingStatus), nullable=True)
    city = Column(String, nullable=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    geom_radius = Column(Float, nullable=True)

    accepted_tos = Column(Integer, nullable=True)
    accepted_community_guidelines = Column(Integer, nullable=False, server_default="0")

    opt_out_of_newsletter = Column(Boolean, nullable=True)

    ## Feedback (now unused)
    filled_feedback = Column(Boolean, nullable=False, default=False)
    ideas = Column(String, nullable=True)
    features = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    contribute = Column(Enum(ContributeOption), nullable=True)
    contribute_ways = Column(ARRAY(String), nullable=True)
    expertise = Column(String, nullable=True)

    invite_code_id = Column(ForeignKey("invite_codes.id"), nullable=True)

    @hybrid_property
    def token_is_valid(self):
        return (self.email_token != None) & (self.email_token_expiry >= now())

    @hybrid_property
    def account_is_filled(self):
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
    def is_completed(self):
        return self.email_verified & self.account_is_filled & (self.accepted_community_guidelines == GUIDELINES_VERSION)


class AccountDeletionToken(Base):
    __tablename__ = "account_deletion_tokens"

    token = Column(String, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    user = relationship("User", backref="account_deletion_tokens")

    @hybrid_property
    def is_valid(self):
        return (self.created <= now()) & (self.expiry >= now())

    def __repr__(self):
        return f"AccountDeletionToken(token={self.token}, user_id={self.user_id}, created={self.created}, expiry={self.expiry})"


class UserActivity(Base):
    """
    User activity: for each unique (user_id, period, ip_address, user_agent) tuple, keep track of number of api calls

    Used for user "last active" as well as admin stuff
    """

    __tablename__ = "user_activity"

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False)
    # the start of a period of time, e.g. 1 hour during which we bin activeness
    period = Column(DateTime(timezone=True), nullable=False)

    # details of the browser, if available
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String, nullable=True)

    # count of api calls made with this ip, user_agent, and period
    api_calls = Column(Integer, nullable=False, default=0)

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


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id = Column(String, primary_key=True)
    creator_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, default=func.now())
    disabled = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User", foreign_keys=[creator_user_id])


class ContentReport(Base):
    """
    A piece of content reported to admins
    """

    __tablename__ = "content_reports"

    id = Column(BigInteger, primary_key=True)

    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the user who reported or flagged the content
    reporting_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # reason, e.g. spam, inappropriate, etc
    reason = Column(String, nullable=False)
    # a short description
    description = Column(String, nullable=False)

    # a reference to the content, see //docs/content_ref.md
    content_ref = Column(String, nullable=False)
    # the author of the content (e.g. the user who wrote the comment itself)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)

    # details of the browser, if available
    user_agent = Column(String, nullable=False)
    # the URL the user was on when reporting the content
    page = Column(String, nullable=False)

    # see comments above for reporting vs author
    reporting_user = relationship("User", foreign_keys="ContentReport.reporting_user_id")
    author_user = relationship("User", foreign_keys="ContentReport.author_user_id")


class Email(Base):
    """
    Table of all dispatched emails for debugging purposes, etc.
    """

    __tablename__ = "emails"

    id = Column(String, primary_key=True)

    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    sender_name = Column(String, nullable=False)
    sender_email = Column(String, nullable=False)

    recipient = Column(String, nullable=False)
    subject = Column(String, nullable=False)

    plain = Column(String, nullable=False)
    html = Column(String, nullable=False)

    list_unsubscribe_header = Column(String, nullable=True)
    source_data = Column(String, nullable=True)


class SMS(Base):
    """
    Table of all sent SMSs for debugging purposes, etc.
    """

    __tablename__ = "smss"

    id = Column(BigInteger, primary_key=True)

    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    # AWS message id
    message_id = Column(String, nullable=False)

    # the SMS sender ID sent to AWS, name that the SMS appears to come from
    sms_sender_id = Column(String, nullable=False)
    number = Column(String, nullable=False)
    message = Column(String, nullable=False)


class ReferenceType(enum.Enum):
    friend = enum.auto()
    surfed = enum.auto()  # The "from" user surfed with the "to" user
    hosted = enum.auto()  # The "from" user hosted the "to" user


class Reference(Base):
    """
    Reference from one user to another
    """

    __tablename__ = "references"

    id = Column(BigInteger, primary_key=True)
    # timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    from_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    reference_type = Column(Enum(ReferenceType), nullable=False)

    host_request_id = Column(ForeignKey("host_requests.id"), nullable=True)

    text = Column(String, nullable=False)  # plain text
    # text that's only visible to mods
    private_text = Column(String, nullable=True)  # plain text

    rating = Column(Float, nullable=False)
    was_appropriate = Column(Boolean, nullable=False)

    is_deleted = Column(Boolean, nullable=False, default=False, server_default=expression.false())

    from_user = relationship("User", backref="references_from", foreign_keys="Reference.from_user_id")
    to_user = relationship("User", backref="references_to", foreign_keys="Reference.to_user_id")

    host_request = relationship("HostRequest", backref="references")

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
    def should_report(self):
        """
        If this evaluates to true, we send a report to the moderation team.
        """
        return self.rating <= 0.4 or not self.was_appropriate or self.private_text


class UserBlock(Base):
    """
    Table of blocked users
    """

    __tablename__ = "user_blocks"

    id = Column(BigInteger, primary_key=True)

    blocking_user_id = Column(ForeignKey("users.id"), nullable=False)
    blocked_user_id = Column(ForeignKey("users.id"), nullable=False)
    time_blocked = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    blocking_user = relationship("User", foreign_keys="UserBlock.blocking_user_id")
    blocked_user = relationship("User", foreign_keys="UserBlock.blocked_user_id")

    __table_args__ = (
        UniqueConstraint("blocking_user_id", "blocked_user_id"),
        Index("ix_user_blocks_blocking_user_id", blocking_user_id, blocked_user_id),
        Index("ix_user_blocks_blocked_user_id", blocked_user_id, blocking_user_id),
    )


class AccountDeletionReason(Base):
    __tablename__ = "account_deletion_reason"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=True)

    user = relationship("User")


class ModerationUserList(Base):
    """
    Represents a list of users listed together by a moderator
    """

    __tablename__ = "moderation_user_lists"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    users = relationship("User", secondary="moderation_user_list_members", back_populates="moderation_user_lists")


class ModerationUserListMember(Base):
    """
    Association table for many-to-many relationship between users and moderation_user_lists
    """

    __tablename__ = "moderation_user_list_members"

    user_id = Column(ForeignKey("users.id"), primary_key=True)
    moderation_list_id = Column(ForeignKey("moderation_user_lists.id"), primary_key=True)

    __table_args__ = (UniqueConstraint("user_id", "moderation_list_id"),)


class AntiBotLog(Base):
    __tablename__ = "antibot_logs"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=True)

    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    action = Column(String, nullable=False)
    token = Column(String, nullable=False)

    score = Column(Float, nullable=False)
    provider_data = Column(JSON, nullable=False)


class RateLimitAction(enum.Enum):
    """Possible user actions which can be rate limited."""

    host_request = "host request"
    friend_request = "friend request"
    chat_initiation = "chat initiation"


class RateLimitViolation(Base):
    __tablename__ = "rate_limit_violations"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False)
    action = Column(Enum(RateLimitAction), nullable=False)
    is_hard_limit = Column(Boolean, nullable=False)

    user = relationship("User")

    __table_args__ = (
        # Fast lookup for rate limits in interval
        Index("ix_rate_limits_by_user", user_id, action, is_hard_limit, created),
    )


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, unique=True)

    display_name = Column(String, nullable=True)
    display_location = Column(String, nullable=True)

    role = Column(String, nullable=False)

    # custom sort order on team page, sorted ascending
    sort_key = Column(Float, nullable=True)

    started_volunteering = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    stopped_volunteering = Column(Date, nullable=True, default=None)

    link_type = Column(String, nullable=True)
    link_text = Column(String, nullable=True)
    link_url = Column(String, nullable=True)

    show_on_team_page = Column(Boolean, nullable=False, server_default=expression.true())

    __table_args__ = (
        # Link type, text, url should all be null or all not be null
        CheckConstraint(
            "(link_type IS NULL) = (link_text IS NULL) AND (link_type IS NULL) = (link_url IS NULL)",
            name="link_type_text",
        ),
    )
