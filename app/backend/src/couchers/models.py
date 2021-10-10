import enum
from calendar import monthrange
from datetime import date

from geoalchemy2.types import Geometry
from sqlalchemy import (
    ARRAY,
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
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import MetaData, Sequence, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import TSTZRANGE, ExcludeConstraint
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import backref, column_property, declarative_base, relationship
from sqlalchemy.sql import func, text

from couchers.config import config
from couchers.constants import EMAIL_REGEX, GUIDELINES_VERSION, PHONE_VERIFICATION_LIFETIME, TOS_VERSION
from couchers.utils import date_in_timezone, get_coordinates, last_active_coarsen, now

meta = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)

Base = declarative_base(metadata=meta)


class HostingStatus(enum.Enum):
    can_host = enum.auto()
    maybe = enum.auto()
    cant_host = enum.auto()


class MeetupStatus(enum.Enum):
    wants_to_meetup = enum.auto()
    open_to_meetup = enum.auto()
    does_not_want_to_meetup = enum.auto()


class SmokingLocation(enum.Enum):
    yes = enum.auto()
    window = enum.auto()
    outside = enum.auto()
    no = enum.auto()


class SleepingArrangement(enum.Enum):
    private = enum.auto()
    common = enum.auto()
    shared_room = enum.auto()
    shared_space = enum.auto()


class ParkingDetails(enum.Enum):
    free_onsite = enum.auto()
    free_offsite = enum.auto()
    paid_onsite = enum.auto()
    paid_offsite = enum.auto()


class TimezoneArea(Base):
    __tablename__ = "timezone_areas"
    id = Column(BigInteger, primary_key=True)

    tzid = Column(String)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)


class User(Base):
    """
    Basic user and profile details
    """

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)

    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    # stored in libsodium hash format, can be null for email login
    hashed_password = Column(Binary, nullable=True)
    # phone number in E.164 format with leading +, for example "+46701740605"
    phone = Column(String, nullable=True, server_default=text("NULL"))

    # timezones should always be UTC
    ## location
    # point describing their location. EPSG4326 is the SRS (spatial ref system, = way to describe a point on earth) used
    # by GPS, it has the WGS84 geoid with lat/lon
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # their display location (displayed to other users), in meters
    geom_radius = Column(Float, nullable=True)
    # the display address (text) shown on their profile
    city = Column(String, nullable=False)
    hometown = Column(String, nullable=True)

    regions_visited = relationship("Region", secondary="regions_visited", order_by="Region.name")
    regions_lived = relationship("Region", secondary="regions_lived", order_by="Region.name")

    timezone_area = relationship(
        "TimezoneArea",
        primaryjoin="func.ST_Contains(foreign(TimezoneArea.geom), User.geom).as_comparison(1, 2)",
        viewonly=True,
        uselist=False,
    )

    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # id of the last message that they received a notification about
    last_notified_message_id = Column(BigInteger, nullable=False, default=0)
    # same as above for host requests
    last_notified_request_message_id = Column(BigInteger, nullable=False, server_default=text("0"))

    # display name
    name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    pronouns = Column(String, nullable=True)
    birthdate = Column(Date, nullable=False)  # in the timezone of birthplace

    # name as on official docs for verification, etc. not needed until verification
    full_name = Column(String, nullable=True)

    avatar_key = Column(ForeignKey("uploads.key"), nullable=True)

    hosting_status = Column(Enum(HostingStatus), nullable=True)
    meetup_status = Column(Enum(MeetupStatus), nullable=True)

    # community standing score
    community_standing = Column(Float, nullable=True)

    occupation = Column(String, nullable=True)  # CommonMark without images
    education = Column(String, nullable=True)  # CommonMark without images
    about_me = Column(String, nullable=True)  # CommonMark without images
    my_travels = Column(String, nullable=True)  # CommonMark without images
    things_i_like = Column(String, nullable=True)  # CommonMark without images
    about_place = Column(String, nullable=True)  # CommonMark without images
    additional_information = Column(String, nullable=True)  # CommonMark without images

    is_banned = Column(Boolean, nullable=False, server_default=text("false"))
    is_deleted = Column(Boolean, nullable=False, server_default=text("false"))
    is_superuser = Column(Boolean, nullable=False, server_default=text("false"))

    # hosting preferences
    max_guests = Column(Integer, nullable=True)
    last_minute = Column(Boolean, nullable=True)
    has_pets = Column(Boolean, nullable=True)
    accepts_pets = Column(Boolean, nullable=True)
    pet_details = Column(String, nullable=True)  # CommonMark without images
    has_kids = Column(Boolean, nullable=True)
    accepts_kids = Column(Boolean, nullable=True)
    kid_details = Column(String, nullable=True)  # CommonMark without images
    has_housemates = Column(Boolean, nullable=True)
    housemate_details = Column(String, nullable=True)  # CommonMark without images
    wheelchair_accessible = Column(Boolean, nullable=True)
    smoking_allowed = Column(Enum(SmokingLocation), nullable=True)
    smokes_at_home = Column(Boolean, nullable=True)
    drinking_allowed = Column(Boolean, nullable=True)
    drinks_at_home = Column(Boolean, nullable=True)
    other_host_info = Column(String, nullable=True)  # CommonMark without images

    sleeping_arrangement = Column(Enum(SleepingArrangement), nullable=True)
    sleeping_details = Column(String, nullable=True)  # CommonMark without images
    area = Column(String, nullable=True)  # CommonMark without images
    house_rules = Column(String, nullable=True)  # CommonMark without images
    parking = Column(Boolean, nullable=True)
    parking_details = Column(Enum(ParkingDetails), nullable=True)  # CommonMark without images
    camping_ok = Column(Boolean, nullable=True)

    accepted_tos = Column(Integer, nullable=False, default=0)
    accepted_community_guidelines = Column(Integer, nullable=False, server_default="0")
    # whether the user has yet filled in the contributor form
    filled_contributor_form = Column(Boolean, nullable=False, server_default="false")

    # number of onboarding emails sent
    onboarding_emails_sent = Column(Integer, nullable=False, server_default="0")
    last_onboarding_email_sent = Column(DateTime(timezone=True), nullable=True)

    added_to_mailing_list = Column(Boolean, nullable=False, server_default="false")

    # for changing their email
    new_email = Column(String, nullable=True)
    old_email_token = Column(String, nullable=True)
    old_email_token_created = Column(DateTime(timezone=True), nullable=True)
    old_email_token_expiry = Column(DateTime(timezone=True), nullable=True)
    need_to_confirm_via_old_email = Column(Boolean, nullable=True, default=None)
    new_email_token = Column(String, nullable=True)
    new_email_token_created = Column(DateTime(timezone=True), nullable=True)
    new_email_token_expiry = Column(DateTime(timezone=True), nullable=True)
    need_to_confirm_via_new_email = Column(Boolean, nullable=True, default=None)

    # Columns for verifying their phone number. State chart:
    #                                       ,-------------------,
    #                                       |    Start          |
    #                                       | phone = None      |  someone else
    # ,-----------------,                   | token = None      |  verifies            ,-----------------------,
    # |  Code Expired   |                   | sent = 1970 or zz |  phone xx            |  Verification Expired |
    # | phone = xx      |  time passes      | verified = None   | <------,             | phone = xx            |
    # | token = yy      | <------------,    | attempts = 0      |        |             | token = None          |
    # | sent = zz (exp.)|              |    '-------------------'        |             | sent = zz             |
    # | verified = None |              |       V    ^                    +-----------< | verified = ww (exp.)  |
    # | attempts = 0..2 | >--,         |       |    | ChangePhone("")    |             | attempts = 0          |
    # '-----------------'    +-------- | ------+----+--------------------+             '-----------------------'
    #                        |         |       |    | ChangePhone(xx)    |                       ^ time passes
    #                        |         |       ^    V                    |                       |
    # ,-----------------,    |         |    ,-------------------,        |             ,-----------------------,
    # |    Too Many     | >--'         '--< |    Code sent      | >------+             |         Verified      |
    # | phone = xx      |                   | phone = xx        |        |             | phone = xx            |
    # | token = yy      | VerifyPhone(wrong)| token = yy        |        '-----------< | token = None          |
    # | sent = zz       | <------+--------< | sent = zz         |                      | sent = zz             |
    # | verified = None |        |          | verified = None   | VerifyPhone(correct) | verified = ww         |
    # | attempts = 3    |        '--------> | attempts = 0..2   | >------------------> | attempts = 0          |
    # '-----------------'                   '-------------------'                      '-----------------------'

    # randomly generated Luhn 6-digit string
    phone_verification_token = Column(String(6), nullable=True, server_default=text("NULL"))

    phone_verification_sent = Column(DateTime(timezone=True), nullable=False, server_default=text("to_timestamp(0)"))
    phone_verification_verified = Column(DateTime(timezone=True), nullable=True, server_default=text("NULL"))
    phone_verification_attempts = Column(Integer, nullable=False, server_default=text("0"))

    # the stripe customer identifier if the user has donated to Couchers
    # e.g. cus_JjoXHttuZopv0t
    stripe_customer_id = Column(String, nullable=True)

    # Verified phone numbers should be unique
    Index(
        "ix_users_unique_phone",
        phone,
        unique=True,
        postgresql_where=phone_verification_verified != None,
    ),

    avatar = relationship("Upload", foreign_keys="User.avatar_key")

    __table_args__ = (
        # There are three possible states for need_to_confirm_via_old_email, old_email_token, old_email_token_created, and old_email_token_expiry
        # 1) All None (default)
        # 2) need_to_confirm_via_old_email is True and the others have assigned value (confirmation initiated)
        # 3) need_to_confirm_via_old_email is False and the others are None (confirmation via old email complete)
        CheckConstraint(
            "(need_to_confirm_via_old_email IS NULL AND old_email_token IS NULL AND old_email_token_created IS NULL AND old_email_token_expiry IS NULL) OR \
             (need_to_confirm_via_old_email IS TRUE AND old_email_token IS NOT NULL AND old_email_token_created IS NOT NULL AND old_email_token_expiry IS NOT NULL) OR \
             (need_to_confirm_via_old_email IS FALSE AND old_email_token IS NULL AND old_email_token_created IS NULL AND old_email_token_expiry IS NULL)",
            name="check_old_email_token_state",
        ),
        # There are three possible states for need_to_confirm_via_new_email, new_email_token, new_email_token_created, and new_email_token_expiry
        # They mirror the states above
        CheckConstraint(
            "(need_to_confirm_via_new_email IS NULL AND new_email_token IS NULL AND new_email_token_created IS NULL AND new_email_token_expiry IS NULL) OR \
             (need_to_confirm_via_new_email IS TRUE AND new_email_token IS NOT NULL AND new_email_token_created IS NOT NULL AND new_email_token_expiry IS NOT NULL) OR \
             (need_to_confirm_via_new_email IS FALSE AND new_email_token IS NULL AND new_email_token_created IS NULL AND new_email_token_expiry IS NULL)",
            name="check_new_email_token_state",
        ),
        # Whenever a phone number is set, it must either be pending verification or already verified.
        # Exactly one of the following must always be true: not phone, token, verified.
        CheckConstraint(
            "(phone IS NULL)::int + (phone_verification_verified IS NOT NULL)::int + (phone_verification_token IS NOT NULL)::int = 1",
            name="phone_verified_conditions",
        ),
        # Email must match our regex
        CheckConstraint(
            f"email ~ '{EMAIL_REGEX}'",
            name="valid_email",
        ),
    )

    @property
    def timezone(self):
        return self.timezone_area.tzid if self.timezone_area else "Etc/UTC"

    @hybrid_property
    def has_completed_profile(self):
        return self.avatar_key is not None and self.about_me is not None and len(self.about_me) >= 20

    @has_completed_profile.expression
    def has_completed_profile(cls):
        return (cls.avatar_key != None) & (func.character_length(cls.about_me) >= 20)

    @property
    def has_password(self):
        return self.hashed_password is not None

    @hybrid_property
    def is_jailed(self):
        return (
            (self.accepted_tos < TOS_VERSION)
            | (self.accepted_community_guidelines < GUIDELINES_VERSION)
            | self.is_missing_location
        )

    @hybrid_property
    def is_missing_location(self):
        return (self.geom == None) | (self.geom_radius == None)

    @hybrid_property
    def is_visible(self):
        return ~(self.is_banned | self.is_deleted)

    @property
    def coordinates(self):
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return None

    @property
    def age(self):
        max_day = monthrange(date.today().year, self.birthdate.month)[1]
        age = date.today().year - self.birthdate.year
        # in case of leap-day babies, make sure the date is valid for this year
        safe_birthdate = self.birthdate
        if self.birthdate.day > max_day:
            safe_birthdate = safe_birthdate.replace(day=max_day)
        if date.today() < safe_birthdate.replace(year=date.today().year):
            age -= 1
        return age

    @property
    def display_joined(self):
        """
        Returns the last active time rounded down to the nearest hour.
        """
        return self.joined.replace(minute=0, second=0, microsecond=0)

    @property
    def display_last_active(self):
        """
        Returns the last active time rounded down whatever is the "last active" coarsening.
        """
        return last_active_coarsen(self.last_active)

    def phone_is_verified(self):
        return (
            self.phone_verification_verified is not None
            and now() - self.phone_verification_verified < PHONE_VERIFICATION_LIFETIME
        )

    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, username={self.username})"


class OneTimeDonation(Base):
    __tablename__ = "one_time_donations"
    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    stripe_checkout_session_id = Column(String, nullable=False)
    stripe_payment_intent_id = Column(String, nullable=False)
    paid = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="one_time_donations")


class RecurringDonation(Base):
    __tablename__ = "recurring_donations"

    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    stripe_checkout_session_id = Column(String, nullable=False)
    # for some silly reason the events come unordered from stripe
    # e.g. sub_JjonjdfUIeZyn0
    stripe_subscription_id = Column(String, nullable=True)

    user = relationship("User", backref="recurring_donations")


class Invoice(Base):
    """
    Successful donations, both one off and recurring

    Triggered by `payment_intent.succeeded` webhook
    """

    __tablename__ = "invoices"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user_id = Column(ForeignKey("users.id"), nullable=False)

    amount = Column(Float, nullable=False)

    stripe_payment_intent_id = Column(String, nullable=False, unique=True)
    stripe_receipt_url = Column(String, nullable=False)

    user = relationship("User", backref="invoices")


class LanguageFluency(enum.Enum):
    # note that the numbering is important here, these are ordinal
    beginner = 1
    conversational = 2
    fluent = 3


class LanguageAbility(Base):
    __tablename__ = "language_abilities"
    __table_args__ = (
        # Users can only have one language ability per language
        UniqueConstraint("user_id", "language_code"),
    )

    id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    language_code = Column(ForeignKey("languages.code", deferrable=True), nullable=False)
    fluency = Column(Enum(LanguageFluency), nullable=False)

    user = relationship("User", backref="language_abilities")
    language = relationship("Language")


class RegionVisited(Base):
    __tablename__ = "regions_visited"
    __table_args__ = (UniqueConstraint("user_id", "region_code"),)

    id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    region_code = Column(ForeignKey("regions.code", deferrable=True), nullable=False)

    user = relationship("User")
    region = relationship("Region")


class RegionLived(Base):
    __tablename__ = "regions_lived"
    __table_args__ = (UniqueConstraint("user_id", "region_code"),)

    id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    region_code = Column(ForeignKey("regions.code", deferrable=True), nullable=False)

    user = relationship("User")
    region = relationship("Region")


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
        return (self.expertise != None) | (not set(self.contribute_ways).issubset(set(["community", "blog", "other"])))


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

    ## Feedback
    filled_feedback = Column(Boolean, nullable=False, default=False)
    ideas = Column(String, nullable=True)
    features = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    contribute = Column(Enum(ContributeOption), nullable=True)
    contribute_ways = Column(ARRAY(String), nullable=True)
    expertise = Column(String, nullable=True)

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
        )

    @hybrid_property
    def is_completed(self):
        return (
            self.email_verified
            & self.account_is_filled
            & self.filled_feedback
            & (self.accepted_community_guidelines == GUIDELINES_VERSION)
        )


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

    # sessions are either "api keys" or "session cookies", otherwise identical
    # an api key is put in the authorization header (e.g. "authorization: Bearer <token>")
    # a session cookie is set in the "couchers-sesh" cookie (e.g. "cookie: couchers-sesh=<token>")
    # when a session is created, it's fixed as one or the other for security reasons
    # for api keys to be useful, they should be long lived and have a long expiry
    is_api_key = Column(Boolean, nullable=False, server_default=text("false"))

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

        TODO: this probably won't run in python (instance level), only in sql (class level)
        """
        return (
            (self.created <= func.now())
            & (self.expiry >= func.now())
            & (self.deleted == None)
            & (self.long_lived | (func.now() - self.last_seen < text("interval '168 hours'")))
        )


class Conversation(Base):
    """
    Conversation brings together the different types of message/conversation types
    """

    __tablename__ = "conversations"

    id = Column(BigInteger, primary_key=True)
    # timezone should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self):
        return f"Conversation(id={self.id}, created={self.created})"


class GroupChat(Base):
    """
    Group chat
    """

    __tablename__ = "group_chats"

    conversation_id = Column("id", ForeignKey("conversations.id"), nullable=False, primary_key=True)

    title = Column(String, nullable=True)
    only_admins_invite = Column(Boolean, nullable=False, default=True)
    creator_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    is_dm = Column(Boolean, nullable=False)

    conversation = relationship("Conversation", backref="group_chat")
    creator = relationship("User", backref="created_group_chats")

    def __repr__(self):
        return f"GroupChat(conversation={self.conversation}, title={self.title or 'None'}, only_admins_invite={self.only_admins_invite}, creator={self.creator}, is_dm={self.is_dm})"


class GroupChatRole(enum.Enum):
    admin = enum.auto()
    participant = enum.auto()


class GroupChatSubscription(Base):
    """
    The recipient of a thread and information about when they joined/left/etc.
    """

    __tablename__ = "group_chat_subscriptions"
    id = Column(BigInteger, primary_key=True)

    # TODO: DB constraint on only one user+group_chat combo at a given time
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    group_chat_id = Column(ForeignKey("group_chats.id"), nullable=False, index=True)

    # timezones should always be UTC
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    role = Column(Enum(GroupChatRole), nullable=False)

    last_seen_message_id = Column(BigInteger, nullable=False, default=0)

    user = relationship("User", backref="group_chat_subscriptions")
    group_chat = relationship("GroupChat", backref=backref("subscriptions", lazy="dynamic"))

    def __repr__(self):
        return f"GroupChatSubscription(id={self.id}, user={self.user}, joined={self.joined}, left={self.left}, role={self.role}, group_chat={self.group_chat})"


class MessageType(enum.Enum):
    text = enum.auto()
    # e.g.
    # image =
    # emoji =
    # ...
    chat_created = enum.auto()
    chat_edited = enum.auto()
    user_invited = enum.auto()
    user_left = enum.auto()
    user_made_admin = enum.auto()
    user_removed_admin = enum.auto()  # RemoveGroupChatAdmin: remove admin permission from a user in group chat
    host_request_status_changed = enum.auto()
    user_removed = enum.auto()  # user is removed from group chat by amdin RemoveGroupChatUser


class HostRequestStatus(enum.Enum):
    pending = enum.auto()
    accepted = enum.auto()
    rejected = enum.auto()
    confirmed = enum.auto()
    cancelled = enum.auto()


class Message(Base):
    """
    A message.

    If message_type = text, then the message is a normal text message, otherwise, it's a special control message.
    """

    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True)

    # which conversation the message belongs in
    conversation_id = Column(ForeignKey("conversations.id"), nullable=False, index=True)

    # the user that sent the message/command
    author_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # the message type, "text" is a text message, otherwise a "control message"
    message_type = Column(Enum(MessageType), nullable=False)

    # the target if a control message and requires target, e.g. if inviting a user, the user invited is the target
    target_id = Column(ForeignKey("users.id"), nullable=True, index=True)

    # time sent, timezone should always be UTC
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the plain-text message text if not control
    text = Column(String, nullable=True)

    # the new host request status if the message type is host_request_status_changed
    host_request_status_target = Column(Enum(HostRequestStatus), nullable=True)

    conversation = relationship("Conversation", backref="messages", order_by="Message.time.desc()")
    author = relationship("User", foreign_keys="Message.author_id")
    target = relationship("User", foreign_keys="Message.target_id")

    @property
    def is_normal_message(self):
        """
        There's only one normal type atm, text
        """
        return self.message_type == MessageType.text

    def __repr__(self):
        return f"Message(id={self.id}, time={self.time}, text={self.text}, author={self.author}, conversation={self.conversation})"


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


class HostRequest(Base):
    """
    A request to stay with a host
    """

    __tablename__ = "host_requests"

    conversation_id = Column("id", ForeignKey("conversations.id"), nullable=False, primary_key=True)
    surfer_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    host_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # TODO: proper timezone handling
    timezone = "Etc/UTC"

    # dates in the timezone above
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)

    # timezone aware start and end times of the request, can be compared to now()
    start_time = column_property(date_in_timezone(from_date, timezone))
    end_time = column_property(date_in_timezone(to_date, timezone) + text("interval '1 days'"))
    start_time_to_write_reference = column_property(date_in_timezone(to_date, timezone))
    # notice 1 day for midnight at the *end of the day*, then 14 days to write a ref
    end_time_to_write_reference = column_property(date_in_timezone(to_date, timezone) + text("interval '15 days'"))

    status = Column(Enum(HostRequestStatus), nullable=False)

    host_last_seen_message_id = Column(BigInteger, nullable=False, default=0)
    surfer_last_seen_message_id = Column(BigInteger, nullable=False, default=0)

    # number of reference reminders sent out
    host_sent_reference_reminders = Column(BigInteger, nullable=False, server_default=text("0"))
    surfer_sent_reference_reminders = Column(BigInteger, nullable=False, server_default=text("0"))

    surfer = relationship("User", backref="host_requests_sent", foreign_keys="HostRequest.surfer_user_id")
    host = relationship("User", backref="host_requests_received", foreign_keys="HostRequest.host_user_id")
    conversation = relationship("Conversation")

    @hybrid_property
    def can_write_reference(self):
        return (
            ((self.status == HostRequestStatus.confirmed) | (self.status == HostRequestStatus.accepted))
            & (now() >= self.start_time_to_write_reference)
            & (now() <= self.end_time_to_write_reference)
        )

    @can_write_reference.expression
    def can_write_reference(cls):
        return (
            ((cls.status == HostRequestStatus.confirmed) | (cls.status == HostRequestStatus.accepted))
            & (func.now() >= cls.start_time_to_write_reference)
            & (func.now() <= cls.end_time_to_write_reference)
        )

    def __repr__(self):
        return (
            f"HostRequest(id={self.conversation_id}, from_user_id={self.from_user_id}, to_user_id={self.to_user_id}...)"
        )


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


class InitiatedUpload(Base):
    """
    Started downloads, not necessarily complete yet.
    """

    __tablename__ = "initiated_uploads"

    key = Column(String, primary_key=True)

    # timezones should always be UTC
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expiry = Column(DateTime(timezone=True), nullable=False)

    initiator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    initiator_user = relationship("User")

    @hybrid_property
    def is_valid(self):
        return (self.created <= func.now()) & (self.expiry >= func.now())


class Upload(Base):
    """
    Completed uploads.
    """

    __tablename__ = "uploads"
    key = Column(String, primary_key=True)

    filename = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    # photo credit, etc
    credit = Column(String, nullable=True)

    creator_user = relationship("User", backref="uploads", foreign_keys="Upload.creator_user_id")

    def _url(self, size):
        return f"{config['MEDIA_SERVER_BASE_URL']}/img/{size}/{self.filename}"

    @property
    def thumbnail_url(self):
        return self._url("thumbnail")

    @property
    def full_url(self):
        return self._url("full")


communities_seq = Sequence("communities_seq")


class Node(Base):
    """
    Node, i.e. geographical subdivision of the world

    Administered by the official cluster
    """

    __tablename__ = "nodes"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    # name and description come from official cluster
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=True, index=True)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    parent_node = relationship("Node", backref="child_nodes", remote_side="Node.id")

    contained_users = relationship(
        "User",
        primaryjoin="func.ST_Contains(foreign(Node.geom), User.geom).as_comparison(1, 2)",
        viewonly=True,
        uselist=True,
    )

    contained_user_ids = association_proxy("contained_users", "id")


class Cluster(Base):
    """
    Cluster, administered grouping of content
    """

    __tablename__ = "clusters"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    # short description
    description = Column(String, nullable=False)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    is_official_cluster = Column(Boolean, nullable=False, default=False)

    slug = column_property(func.slugify(name))

    official_cluster_for_node = relationship(
        "Node",
        primaryjoin="and_(Cluster.parent_node_id == Node.id, Cluster.is_official_cluster)",
        backref=backref("official_cluster", uselist=False),
        uselist=False,
        viewonly=True,
    )

    parent_node = relationship(
        "Node", backref="child_clusters", remote_side="Node.id", foreign_keys="Cluster.parent_node_id"
    )

    nodes = relationship("Cluster", backref="clusters", secondary="node_cluster_associations", viewonly=True)
    # all pages
    pages = relationship(
        "Page", backref="clusters", secondary="cluster_page_associations", lazy="dynamic", viewonly=True
    )
    events = relationship("Event", backref="clusters", secondary="cluster_event_associations", viewonly=True)
    discussions = relationship(
        "Discussion", backref="clusters", secondary="cluster_discussion_associations", viewonly=True
    )

    # includes also admins
    members = relationship(
        "User",
        lazy="dynamic",
        backref="cluster_memberships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="User.id == ClusterSubscription.user_id",
        viewonly=True,
    )

    admins = relationship(
        "User",
        lazy="dynamic",
        backref="cluster_adminships",
        secondary="cluster_subscriptions",
        primaryjoin="Cluster.id == ClusterSubscription.cluster_id",
        secondaryjoin="and_(User.id == ClusterSubscription.user_id, ClusterSubscription.role == 'admin')",
        viewonly=True,
    )

    main_page = relationship(
        "Page",
        primaryjoin="and_(Cluster.id == Page.owner_cluster_id, Page.type == 'main_page')",
        viewonly=True,
        uselist=False,
    )

    __table_args__ = (
        # Each node can have at most one official cluster
        Index(
            "ix_clusters_owner_parent_node_id_is_official_cluster",
            parent_node_id,
            is_official_cluster,
            unique=True,
            postgresql_where=is_official_cluster,
        ),
    )


class NodeClusterAssociation(Base):
    """
    NodeClusterAssociation, grouping of nodes
    """

    __tablename__ = "node_cluster_associations"
    __table_args__ = (UniqueConstraint("node_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    node = relationship("Node", backref="node_cluster_associations")
    cluster = relationship("Cluster", backref="node_cluster_associations")


class ClusterRole(enum.Enum):
    member = enum.auto()
    admin = enum.auto()


class ClusterSubscription(Base):
    """
    ClusterSubscription of a user
    """

    __tablename__ = "cluster_subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)
    role = Column(Enum(ClusterRole), nullable=False)

    user = relationship("User", backref="cluster_subscriptions")
    cluster = relationship("Cluster", backref="cluster_subscriptions")


class ClusterPageAssociation(Base):
    """
    pages related to clusters
    """

    __tablename__ = "cluster_page_associations"
    __table_args__ = (UniqueConstraint("page_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    page_id = Column(ForeignKey("pages.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    page = relationship("Page", backref="cluster_page_associations")
    cluster = relationship("Cluster", backref="cluster_page_associations")


class PageType(enum.Enum):
    main_page = enum.auto()
    place = enum.auto()
    guide = enum.auto()


class Page(Base):
    """
    similar to a wiki page about a community, POI or guide
    """

    __tablename__ = "pages"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)
    type = Column(Enum(PageType), nullable=False)
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_user_id = Column(ForeignKey("users.id"), nullable=True, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=True, index=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)

    parent_node = relationship("Node", backref="child_pages", remote_side="Node.id", foreign_keys="Page.parent_node_id")

    thread = relationship("Thread", backref="page", uselist=False)
    creator_user = relationship("User", backref="created_pages", foreign_keys="Page.creator_user_id")
    owner_user = relationship("User", backref="owned_pages", foreign_keys="Page.owner_user_id")
    owner_cluster = relationship(
        "Cluster", backref=backref("owned_pages", lazy="dynamic"), uselist=False, foreign_keys="Page.owner_cluster_id"
    )

    editors = relationship("User", secondary="page_versions", viewonly=True)

    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL) <> (owner_cluster_id IS NULL)",
            name="one_owner",
        ),
        # Only clusters can own main pages
        CheckConstraint(
            "NOT (owner_cluster_id IS NULL AND type = 'main_page')",
            name="main_page_owned_by_cluster",
        ),
        # Each cluster can have at most one main page
        Index(
            "ix_pages_owner_cluster_id_type",
            owner_cluster_id,
            type,
            unique=True,
            postgresql_where=(type == PageType.main_page),
        ),
    )

    def __repr__(self):
        return f"Page({self.id=})"


class PageVersion(Base):
    """
    version of page content
    """

    __tablename__ = "page_versions"

    id = Column(BigInteger, primary_key=True)

    page_id = Column(ForeignKey("pages.id"), nullable=False, index=True)
    editor_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    photo_key = Column(ForeignKey("uploads.key"), nullable=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # the human-readable address
    address = Column(String, nullable=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    slug = column_property(func.slugify(title))

    page = relationship("Page", backref="versions", order_by="PageVersion.id")
    editor_user = relationship("User", backref="edited_pages")
    photo = relationship("Upload")

    __table_args__ = (
        # Geom and address must either both be null or both be set
        CheckConstraint(
            "(geom IS NULL) = (address IS NULL)",
            name="geom_iff_address",
        ),
    )

    @property
    def coordinates(self):
        # returns (lat, lng) or None
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return None

    def __repr__(self):
        return f"PageVersion({self.id=}, {self.page_id=})"


class ClusterEventAssociation(Base):
    """
    events related to clusters
    """

    __tablename__ = "cluster_event_associations"
    __table_args__ = (UniqueConstraint("event_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    event = relationship("Event", backref="cluster_event_associations")
    cluster = relationship("Cluster", backref="cluster_event_associations")


class Event(Base):
    """
    An event is compose of two parts:

    * An event template (Event)
    * An occurrence (EventOccurrence)

    One-off events will have one of each; repeating events will have one Event,
    multiple EventOccurrences, one for each time the event happens.
    """

    __tablename__ = "events"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())
    parent_node_id = Column(ForeignKey("nodes.id"), nullable=False, index=True)

    title = Column(String, nullable=False)

    slug = column_property(func.slugify(title))

    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    owner_user_id = Column(ForeignKey("users.id"), nullable=True, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=True, index=True)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)

    parent_node = relationship(
        "Node", backref="child_events", remote_side="Node.id", foreign_keys="Event.parent_node_id"
    )
    thread = relationship("Thread", backref="event", uselist=False)
    subscribers = relationship(
        "User", backref="subscribed_events", secondary="event_subscriptions", lazy="dynamic", viewonly=True
    )
    organizers = relationship(
        "User", backref="organized_events", secondary="event_organizers", lazy="dynamic", viewonly=True
    )
    thread = relationship("Thread", backref="event", uselist=False)
    creator_user = relationship("User", backref="created_events", foreign_keys="Event.creator_user_id")
    owner_user = relationship("User", backref="owned_events", foreign_keys="Event.owner_user_id")
    owner_cluster = relationship(
        "Cluster",
        backref=backref("owned_events", lazy="dynamic"),
        uselist=False,
        foreign_keys="Event.owner_cluster_id",
    )

    __table_args__ = (
        # Only one of owner_user and owner_cluster should be set
        CheckConstraint(
            "(owner_user_id IS NULL) <> (owner_cluster_id IS NULL)",
            name="one_owner",
        ),
    )


class EventOccurrence(Base):
    __tablename__ = "event_occurrences"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)

    # the user that created this particular occurrence of a repeating event (same as event.creator_user_id if single event)
    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    content = Column(String, nullable=False)  # CommonMark without images
    photo_key = Column(ForeignKey("uploads.key"), nullable=True)

    # a null geom is an online-only event
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # physical address, iff geom is not null
    address = Column(String, nullable=True)
    # videoconferencing link, etc, must be specified if no geom, otherwise optional
    link = Column(String, nullable=True)

    timezone = "Etc/UTC"

    # time during which the event takes place; this is a range type (instead of separate start+end times) which
    # simplifies database constraints, etc
    during = Column(TSTZRANGE, nullable=False)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_edited = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    creator_user = relationship(
        "User", backref="created_event_occurrences", foreign_keys="EventOccurrence.creator_user_id"
    )
    event = relationship(
        "Event",
        backref=backref("occurrences", lazy="dynamic"),
        remote_side="Event.id",
        foreign_keys="EventOccurrence.event_id",
    )

    photo = relationship("Upload")

    __table_args__ = (
        # Geom and address go together
        CheckConstraint(
            # geom and address are either both null or neither of them are null
            "(geom IS NULL) = (address IS NULL)",
            name="geom_iff_address",
        ),
        # Online-only events need a link, note that online events may also have a link
        CheckConstraint(
            # exactly oen of geom or link is non-null
            "(geom IS NULL) <> (link IS NULL)",
            name="link_or_geom",
        ),
        # Can't have overlapping occurrences in the same Event
        ExcludeConstraint(("event_id", "="), ("during", "&&"), name="event_occurrences_event_id_during_excl"),
    )

    @property
    def coordinates(self):
        # returns (lat, lng) or None
        if self.geom:
            return get_coordinates(self.geom)
        else:
            return None

    @hybrid_property
    def start_time(self):
        return self.during.lower

    @start_time.expression
    def start_time(cls):
        return func.lower(cls.during)

    @hybrid_property
    def end_time(self):
        return self.during.upper

    @end_time.expression
    def end_time(cls):
        return func.upper(cls.during)


class EventSubscription(Base):
    """
    users subscriptions to events
    """

    __tablename__ = "event_subscriptions"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User")
    event = relationship("Event")


class EventOrganizer(Base):
    """
    Organizers for events
    """

    __tablename__ = "event_organizers"
    __table_args__ = (UniqueConstraint("event_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(ForeignKey("events.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User")
    event = relationship("Event")


class AttendeeStatus(enum.Enum):
    going = enum.auto()
    maybe = enum.auto()


class EventOccurrenceAttendee(Base):
    """
    Attendees for events
    """

    __tablename__ = "event_occurrence_attendees"
    __table_args__ = (UniqueConstraint("occurrence_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    occurrence_id = Column(ForeignKey("event_occurrences.id"), nullable=False, index=True)
    responded = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    attendee_status = Column(Enum(AttendeeStatus), nullable=False)

    user = relationship("User")
    occurrence = relationship("EventOccurrence", backref=backref("attendees", lazy="dynamic"))


class ClusterDiscussionAssociation(Base):
    """
    discussions related to clusters
    """

    __tablename__ = "cluster_discussion_associations"
    __table_args__ = (UniqueConstraint("discussion_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    discussion = relationship("Discussion", backref="cluster_discussion_associations")
    cluster = relationship("Cluster", backref="cluster_discussion_associations")


class Discussion(Base):
    """
    forum board
    """

    __tablename__ = "discussions"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    slug = column_property(func.slugify(title))

    thread = relationship("Thread", backref="discussion", uselist=False)

    subscribers = relationship("User", backref="discussions", secondary="discussion_subscriptions", viewonly=True)

    creator_user = relationship("User", backref="created_discussions", foreign_keys="Discussion.creator_user_id")
    owner_cluster = relationship("Cluster", backref=backref("owned_discussions", lazy="dynamic"), uselist=False)


class DiscussionSubscription(Base):
    """
    users subscriptions to discussions
    """

    __tablename__ = "discussion_subscriptions"
    __table_args__ = (UniqueConstraint("discussion_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="discussion_subscriptions")
    discussion = relationship("Discussion", backref="discussion_subscriptions")


class Thread(Base):
    """
    Thread
    """

    __tablename__ = "threads"

    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)


class Comment(Base):
    """
    Comment
    """

    __tablename__ = "comments"

    id = Column(BigInteger, primary_key=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    thread = relationship("Thread", backref="comments")


class Reply(Base):
    """
    Reply
    """

    __tablename__ = "replies"

    id = Column(BigInteger, primary_key=True)

    comment_id = Column(ForeignKey("comments.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    comment = relationship("Comment", backref="replies")


class BackgroundJobType(enum.Enum):
    # payload: jobs.SendEmailPayload
    send_email = enum.auto()
    # payload: google.protobuf.Empty
    purge_login_tokens = enum.auto()
    # payload: google.protobuf.Empty
    purge_signup_tokens = enum.auto()
    # payload: google.protobuf.Empty
    send_message_notifications = enum.auto()
    # payload: google.protobuf.Empty
    send_onboarding_emails = enum.auto()
    # payload: google.protobuf.Empty
    add_users_to_email_list = enum.auto()
    # payload: google.protobuf.Empty
    send_request_notifications = enum.auto()
    # payload: google.protobuf.Empty
    enforce_community_membership = enum.auto()
    # payload: google.protobuf.Empty
    send_reference_reminders = enum.auto()
    # payload: jobs.HandleNotificationPayload
    handle_notification = enum.auto()


class BackgroundJobState(enum.Enum):
    # job is fresh, waiting to be picked off the queue
    pending = enum.auto()
    # job complete
    completed = enum.auto()
    # error occured, will be retried
    error = enum.auto()
    # failed too many times, not retrying anymore
    failed = enum.auto()


class BackgroundJob(Base):
    """
    This table implements a queue of background jobs.
    """

    __tablename__ = "background_jobs"

    id = Column(BigInteger, primary_key=True)

    # used to discern which function should be triggered to service it
    job_type = Column(Enum(BackgroundJobType), nullable=False)
    state = Column(Enum(BackgroundJobState), nullable=False, default=BackgroundJobState.pending)

    # time queued
    queued = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # time at which we may next attempt it, for implementing exponential backoff
    next_attempt_after = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # used to count number of retries for failed jobs
    try_count = Column(Integer, nullable=False, default=0)

    max_tries = Column(Integer, nullable=False, default=5)

    # protobuf encoded job payload
    payload = Column(Binary, nullable=False)

    # if the job failed, we write that info here
    failure_info = Column(String, nullable=True)

    @hybrid_property
    def ready_for_retry(self):
        return (
            (self.next_attempt_after <= func.now())
            & (self.try_count < self.max_tries)
            & ((self.state == BackgroundJobState.pending) | (self.state == BackgroundJobState.error))
        )

    def __repr__(self):
        return f"BackgroundJob(id={self.id}, job_type={self.job_type}, state={self.state}, next_attempt_after={self.next_attempt_after}, try_count={self.try_count}, failure_info={self.failure_info})"


class NotificationPriority(enum.Enum):
    # TODO: not sure if this is a good idea? or just too complicated
    # should be delivered immediately with no delay
    immediate = enum.auto()
    # may be delivered with up to 15 min delay if there is no instant delivery method (such as push notification)
    # e.g. if anticipating more notifications soon
    normal = enum.auto()
    # may be delivered up to 24 hours delayd
    low = enum.auto()


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    priority = Column(Enum(NotificationPriority), nullable=False, default=NotificationPriority.normal)

    # recipient user id
    user_id = Column(ForeignKey("users.id"), nullable=False)

    topic = Column(String, nullable=False)
    key = Column(String, nullable=False)
    action = Column(String, nullable=False)

    avatar_key = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    title = Column(String, nullable=True)
    content = Column(String, nullable=True)
    link = Column(String, nullable=True)

    user = relationship("User", foreign_keys="Notification.user_id")


class Language(Base):
    """
    Table of allowed languages (a subset of ISO639-3)
    """

    __tablename__ = "languages"

    # ISO639-3 language code, in lowercase, e.g. fin, eng
    code = Column(String(3), primary_key=True)

    # the english name
    name = Column(String, nullable=False, unique=True)


class Region(Base):
    """
    Table of regions
    """

    __tablename__ = "regions"

    # iso 3166-1 alpha3 code in uppercase, e.g. FIN, USA
    code = Column(String(3), primary_key=True)

    # the name, e.g. Finland, United States
    # this is the display name in English, should be the "common name", not "Republic of Finland"
    name = Column(String, nullable=False, unique=True)


class UserBlock(Base):
    """
    Table of blocked users
    """

    __tablename__ = "user_blocks"
    __table_args__ = (UniqueConstraint("blocking_user_id", "blocked_user_id"),)

    id = Column(BigInteger, primary_key=True)

    blocking_user_id = Column(ForeignKey("users.id"), nullable=False)
    blocked_user_id = Column(ForeignKey("users.id"), nullable=False)
    time_blocked = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    blocking_user = relationship("User", foreign_keys="UserBlock.blocking_user_id")
    blocked_user = relationship("User", foreign_keys="UserBlock.blocked_user_id")


class APICall(Base):
    """
    API call logs
    """

    __tablename__ = "api_calls"
    __table_args__ = {"schema": "logging"}

    id = Column(BigInteger, primary_key=True)

    # whether the call was made using an api key or session cookies
    is_api_key = Column(Boolean, nullable=False, server_default=text("false"))

    # backend version (normally e.g. develop-31469e3), allows us to figure out which proto definitions were used
    # note that `default` is a python side default, not hardcoded into DB schema
    version = Column(String, nullable=False, default=config["VERSION"])

    # approximate time of the call
    time = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # the method call name, e.g. "/org.couchers.api.core.API/ListFriends"
    method = Column(String, nullable=False)

    # gRPC status code name, e.g. FAILED_PRECONDITION, None if success
    status_code = Column(String, nullable=True)

    # handler duration (excluding serialization, etc)
    duration = Column(Float, nullable=False)

    # user_id of caller, None means not logged in
    user_id = Column(BigInteger, nullable=True)

    # sanitized request bytes
    request = Column(Binary, nullable=True)

    # sanitized response bytes
    response = Column(Binary, nullable=True)

    # the exception traceback, if any
    traceback = Column(String, nullable=True)
