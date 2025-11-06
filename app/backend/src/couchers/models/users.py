import enum

from geoalchemy2 import Geometry
from sqlalchemy import (
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
    Interval,
    String,
    UniqueConstraint,
    and_,
    func,
    not_,
    or_,
    text,
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy import select as sa_select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import column_property, relationship
from sqlalchemy.sql import expression

from couchers.constants import (
    EMAIL_REGEX,
    GUIDELINES_VERSION,
    PHONE_VERIFICATION_LIFETIME,
    SMS_CODE_LIFETIME,
    TOS_VERSION,
)
from couchers.models.activeness_probe import ActivenessProbe
from couchers.models.base import Base
from couchers.models.mod_note import ModNote
from couchers.models.static import TimezoneArea
from couchers.utils import get_coordinates, last_active_coarsen, now


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


class ParkingDetails(enum.Enum):
    free_onsite = enum.auto()
    free_offsite = enum.auto()
    paid_onsite = enum.auto()
    paid_offsite = enum.auto()


class ProfilePublicVisibility(enum.Enum):
    # no public info
    nothing = enum.auto()
    # only show on map, randomized, unclickable
    map_only = enum.auto()
    # name, gender, location, hosting/meetup status, badges, number of references, and signup time
    limited = enum.auto()
    # full about me except additional info (hide my home)
    most = enum.auto()
    # all but references
    full = enum.auto()


class User(Base):
    """
    Basic user and profile details
    """

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)

    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    # stored in libsodium hash format, can be null for email login
    hashed_password = Column(Binary, nullable=False)
    # phone number in E.164 format with leading +, for example "+46701740605"
    phone = Column(String, nullable=True, server_default=expression.null())
    # language preference -- defaults to empty string
    ui_language_preference = Column(String, nullable=True, server_default="")

    # timezones should always be UTC
    ## location
    # point describing their location. EPSG4326 is the SRS (spatial ref system, = way to describe a point on earth) used
    # by GPS, it has the WGS84 geoid with lat/lon
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=False)
    # randomized coordinates within a radius of 0.02-0.1 degrees, equates to about 2-10 km
    randomized_geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    # their display location (displayed to other users), in meters
    geom_radius = Column(Float, nullable=False)
    # the display address (text) shown on their profile
    city = Column(String, nullable=False)
    # "Grew up in" on profile
    hometown = Column(String, nullable=True)

    regions_visited = relationship("Region", secondary="regions_visited", order_by="Region.name")
    regions_lived = relationship("Region", secondary="regions_lived", order_by="Region.name")

    timezone = column_property(
        sa_select(TimezoneArea.tzid).where(func.ST_Contains(TimezoneArea.geom, geom)).limit(1).scalar_subquery(),
        deferred=True,
    )

    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_active = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    public_visibility = Column(Enum(ProfilePublicVisibility), nullable=False, server_default="map_only")
    has_modified_public_visibility = Column(Boolean, nullable=False, server_default=expression.false())

    # id of the last message that they received a notification about
    last_notified_message_id = Column(BigInteger, nullable=False, default=0)
    # same as above for host requests
    last_notified_request_message_id = Column(BigInteger, nullable=False, server_default=text("0"))

    # display name
    name = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    pronouns = Column(String, nullable=True)
    birthdate = Column(Date, nullable=False)  # in the timezone of birthplace

    avatar_key = Column(ForeignKey("uploads.key"), nullable=True)

    hosting_status = Column(Enum(HostingStatus), nullable=False)
    meetup_status = Column(Enum(MeetupStatus), nullable=False, server_default="open_to_meetup")

    # community standing score
    community_standing = Column(Float, nullable=True)

    occupation = Column(String, nullable=True)  # CommonMark without images
    education = Column(String, nullable=True)  # CommonMark without images

    # "Who I am" under "About Me" tab
    about_me = Column(String, nullable=True)  # CommonMark without images
    # "What I do in my free time" under "About Me" tab
    things_i_like = Column(String, nullable=True)  # CommonMark without images
    # "About my home" under "My Home" tab
    about_place = Column(String, nullable=True)  # CommonMark without images
    # "Additional information" under "About Me" tab
    additional_information = Column(String, nullable=True)  # CommonMark without images

    is_banned = Column(Boolean, nullable=False, server_default=expression.false())
    is_deleted = Column(Boolean, nullable=False, server_default=expression.false())
    is_superuser = Column(Boolean, nullable=False, server_default=expression.false())

    # the undelete token allows a user to recover their account for a couple of days after deletion in case it was
    # accidental or they changed their mind
    # constraints make sure these are non-null only if is_deleted and that these are null in unison
    undelete_token = Column(String, nullable=True)
    # validity of the undelete token
    undelete_until = Column(DateTime(timezone=True), nullable=True)

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
    # "Additional information" under "My Home" tab
    other_host_info = Column(String, nullable=True)  # CommonMark without images

    # "Sleeping privacy" (not long-form text)
    sleeping_arrangement = Column(Enum(SleepingArrangement), nullable=True)
    # "Sleeping arrangement" under "My Home" tab
    sleeping_details = Column(String, nullable=True)  # CommonMark without images
    # "Local area information" under "My Home" tab
    area = Column(String, nullable=True)  # CommonMark without images
    # "House rules" under "My Home" tab
    house_rules = Column(String, nullable=True)  # CommonMark without images
    parking = Column(Boolean, nullable=True)
    parking_details = Column(Enum(ParkingDetails), nullable=True)  # CommonMark without images
    camping_ok = Column(Boolean, nullable=True)

    accepted_tos = Column(Integer, nullable=False, default=0)
    accepted_community_guidelines = Column(Integer, nullable=False, server_default="0")
    # whether the user has yet filled in the contributor form
    filled_contributor_form = Column(Boolean, nullable=False, server_default=expression.false())

    # number of onboarding emails sent
    onboarding_emails_sent = Column(Integer, nullable=False, server_default="0")
    last_onboarding_email_sent = Column(DateTime(timezone=True), nullable=True)

    # whether we need to sync the user's newsletter preferences with the newsletter server
    in_sync_with_newsletter = Column(Boolean, nullable=False, server_default=expression.false())
    # opted out of the newsletter
    opt_out_of_newsletter = Column(Boolean, nullable=False, server_default=expression.false())

    # set to null to receive no digests
    digest_frequency = Column(Interval, nullable=True)
    last_digest_sent = Column(DateTime(timezone=True), nullable=False, server_default=text("to_timestamp(0)"))

    # for changing their email
    new_email = Column(String, nullable=True)

    new_email_token = Column(String, nullable=True)
    new_email_token_created = Column(DateTime(timezone=True), nullable=True)
    new_email_token_expiry = Column(DateTime(timezone=True), nullable=True)

    recommendation_score = Column(Float, nullable=False, server_default="0")

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
    phone_verification_token = Column(String(6), nullable=True, server_default=expression.null())

    phone_verification_sent = Column(DateTime(timezone=True), nullable=False, server_default=text("to_timestamp(0)"))
    phone_verification_verified = Column(DateTime(timezone=True), nullable=True, server_default=expression.null())
    phone_verification_attempts = Column(Integer, nullable=False, server_default=text("0"))

    # the stripe customer identifier if the user has donated to Couchers
    # e.g. cus_JjoXHttuZopv0t
    # for new US entity
    stripe_customer_id = Column(String, nullable=True)
    # for old AU entity
    stripe_customer_id_old = Column(String, nullable=True)

    has_passport_sex_gender_exception = Column(Boolean, nullable=False, server_default=expression.false())

    #  checking for phone verification
    has_donated = Column(Boolean, nullable=False, server_default=expression.false())

    # whether this user has all emails turned off
    do_not_email = Column(Boolean, nullable=False, server_default=expression.false())

    avatar = relationship("Upload", foreign_keys="User.avatar_key")

    admin_note = Column(String, nullable=False, server_default=text("''"))

    # whether mods have marked this user has having to update their location
    needs_to_update_location = Column(Boolean, nullable=False, server_default=expression.false())

    last_antibot = Column(DateTime(timezone=True), nullable=False, server_default=text("to_timestamp(0)"))

    age = column_property(func.date_part("year", func.age(birthdate)))

    # ID of the invite code used to sign up (if any)
    invite_code_id = Column(ForeignKey("invite_codes.id"), nullable=True)
    invite_code = relationship("InviteCode", foreign_keys=[invite_code_id])

    moderation_user_lists = relationship(
        "ModerationUserList", secondary="moderation_user_list_members", back_populates="users"
    )

    __table_args__ = (
        # Verified phone numbers should be unique
        Index(
            "ix_users_unique_phone",
            phone,
            unique=True,
            postgresql_where=phone_verification_verified != None,
        ),
        Index(
            "ix_users_active",
            id,
            postgresql_where=and_(not_(is_banned), not_(is_deleted)),
        ),
        # create index on users(geom, id, username) where not is_banned and not is_deleted and geom is not null;
        Index(
            "ix_users_geom_active",
            geom,
            id,
            username,
            postgresql_using="gist",
            postgresql_where=and_(not_(is_banned), not_(is_deleted)),
        ),
        Index(
            "ix_users_by_id",
            id,
            postgresql_using="hash",
            postgresql_where=and_(not_(is_banned), not_(is_deleted)),
        ),
        Index(
            "ix_users_by_username",
            username,
            postgresql_using="hash",
            postgresql_where=and_(not_(is_banned), not_(is_deleted)),
        ),
        # There are two possible states for new_email_token, new_email_token_created, and new_email_token_expiry
        CheckConstraint(
            "(new_email_token IS NOT NULL AND new_email_token_created IS NOT NULL AND new_email_token_expiry IS NOT NULL) OR \
             (new_email_token IS NULL AND new_email_token_created IS NULL AND new_email_token_expiry IS NULL)",
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
        # Undelete token + time are coupled: either both null or neither; and if they're not null then the account is deleted
        CheckConstraint(
            "((undelete_token IS NULL) = (undelete_until IS NULL)) AND ((undelete_token IS NULL) OR is_deleted)",
            name="undelete_nullity",
        ),
        # If the user disabled all emails, then they can't host or meet up
        CheckConstraint(
            "(do_not_email IS FALSE) OR ((hosting_status = 'cant_host') AND (meetup_status = 'does_not_want_to_meetup'))",
            name="do_not_email_inactive",
        ),
    )

    @hybrid_property
    def has_completed_profile(self):
        return self.avatar_key is not None and self.about_me is not None and len(self.about_me) >= 150

    @has_completed_profile.expression
    def has_completed_profile(cls):
        return (cls.avatar_key != None) & (func.character_length(cls.about_me) >= 150)

    @hybrid_property
    def has_completed_my_home(self):
        # completed my profile means that:
        # 1. has filled out max_guests
        # 2. has filled out sleeping_arrangement (sleeping privacy)
        # 3. has some text in at least one of the my home free text fields
        return (
            self.max_guests is not None
            and self.sleeping_arrangement is not None
            and (
                self.about_place is not None
                or self.other_host_info is not None
                or self.sleeping_details is not None
                or self.area is not None
                or self.house_rules is not None
            )
        )

    @has_completed_my_home.expression
    def has_completed_my_home(cls):
        return and_(
            cls.max_guests != None,
            cls.sleeping_arrangement != None,
            or_(
                cls.about_place != None,
                cls.other_host_info != None,
                cls.sleeping_details != None,
                cls.area != None,
                cls.house_rules != None,
            ),
        )

    @hybrid_property
    def jailed_missing_tos(self):
        return self.accepted_tos < TOS_VERSION

    @hybrid_property
    def jailed_missing_community_guidelines(self):
        return self.accepted_community_guidelines < GUIDELINES_VERSION

    @hybrid_property
    def jailed_pending_mod_notes(self):
        return self.mod_notes.where(ModNote.is_pending).count() > 0

    @hybrid_property
    def jailed_pending_activeness_probe(self):
        return self.pending_activeness_probe != None

    @hybrid_property
    def is_jailed(self):
        return (
            self.jailed_missing_tos
            | self.jailed_missing_community_guidelines
            | self.is_missing_location
            | self.jailed_pending_mod_notes
            | self.jailed_pending_activeness_probe
        )

    @hybrid_property
    def is_missing_location(self):
        return self.needs_to_update_location

    @hybrid_property
    def is_visible(self):
        return not self.is_banned and not self.is_deleted

    @is_visible.expression
    def is_visible(cls):
        return ~(cls.is_banned | cls.is_deleted)

    @property
    def coordinates(self):
        return get_coordinates(self.geom)

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

    @hybrid_property
    def phone_is_verified(self):
        return (
            self.phone_verification_verified is not None
            and now() - self.phone_verification_verified < PHONE_VERIFICATION_LIFETIME
        )

    @phone_is_verified.expression
    def phone_is_verified(cls):
        return (cls.phone_verification_verified != None) & (
            now() - cls.phone_verification_verified < PHONE_VERIFICATION_LIFETIME
        )

    @hybrid_property
    def phone_code_expired(self):
        return now() - self.phone_verification_sent > SMS_CODE_LIFETIME

    def __repr__(self):
        return f"User(id={self.id}, email={self.email}, username={self.username})"


User.pending_activeness_probe = relationship(
    ActivenessProbe,
    primaryjoin="and_(ActivenessProbe.user_id == User.id, ActivenessProbe.is_pending)",
    uselist=False,
    back_populates="user",
)


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


class RegionLived(Base):
    __tablename__ = "regions_lived"
    __table_args__ = (UniqueConstraint("user_id", "region_code"),)

    id = Column(BigInteger, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    region_code = Column(ForeignKey("regions.code", deferrable=True), nullable=False)
