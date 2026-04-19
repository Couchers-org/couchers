import enum
from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Any

from geoalchemy2 import Geometry
from sqlalchemy import (
    ARRAY,
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
    Interval,
    String,
    UniqueConstraint,
    and_,
    func,
    or_,
    select,
    text,
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DynamicMapped, Mapped, column_property, mapped_column, relationship
from sqlalchemy.sql import expression
from sqlalchemy.sql.elements import ColumnElement

from couchers.constants import (
    COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH,
    EMAIL_REGEX,
    GUIDELINES_VERSION,
    PHONE_VERIFICATION_LIFETIME,
    SMS_CODE_LIFETIME,
    TOS_VERSION,
)
from couchers.models.activeness_probe import ActivenessProbe
from couchers.models.base import Base, Geom
from couchers.models.mod_note import ModNote
from couchers.models.static import Language, Region, TimezoneArea
from couchers.utils import get_coordinates, last_active_coarsen, now

if TYPE_CHECKING:
    from couchers.models import UserBadge
    from couchers.models.admin import UserAdminTag
    from couchers.models.public_trips import PublicTrip
    from couchers.models.rest import InviteCode, ModerationUserList
    from couchers.models.uploads import PhotoGallery


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


class User(Base, kw_only=True):
    """
    Basic user and profile details
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    username: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    # stored in libsodium hash format, can be null for email login
    hashed_password: Mapped[bytes] = mapped_column(Binary)
    # phone number in E.164 format with leading +, for example "+46701740605"
    phone: Mapped[str | None] = mapped_column(String, default=None, server_default=expression.null())
    # language preference -- defaults to empty string
    ui_language_preference: Mapped[str | None] = mapped_column(String, default=None, server_default="")

    # timezones should always be UTC
    ## location
    # point describing their location. EPSG4326 is the SRS (spatial ref system, = way to describe a point on earth) used
    # by GPS, it has the WGS84 geoid with lat/lon
    geom: Mapped[Geom] = mapped_column(Geometry(geometry_type="POINT", srid=4326))
    # randomized coordinates within a radius of 0.02-0.1 degrees, equates to about 2-10 km
    randomized_geom: Mapped[Geom | None] = mapped_column(Geometry(geometry_type="POINT", srid=4326), default=None)
    # their display location (displayed to other users), in meters
    geom_radius: Mapped[float] = mapped_column(Float)
    # the display address (text) shown on their profile
    city: Mapped[str] = mapped_column(String)
    # "Grew up in" on profile
    hometown: Mapped[str | None] = mapped_column(String, default=None)

    regions_visited: Mapped[list[Region]] = relationship(
        init=False, secondary="regions_visited", order_by="Region.name"
    )
    regions_lived: Mapped[list[Region]] = relationship(init=False, secondary="regions_lived", order_by="Region.name")

    timezone = column_property(
        select(TimezoneArea.tzid).where(func.ST_Contains(TimezoneArea.geom, geom)).limit(1).scalar_subquery(),
        deferred=True,
    )

    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    last_active: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    profile_last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), init=False
    )

    public_visibility: Mapped[ProfilePublicVisibility] = mapped_column(
        Enum(ProfilePublicVisibility), server_default="map_only", init=False
    )
    has_modified_public_visibility: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    # id of the last message that they received a notification about
    last_notified_message_id: Mapped[int] = mapped_column(BigInteger, default=0)
    # same as above for host requests
    last_notified_request_message_id: Mapped[int] = mapped_column(BigInteger, server_default=text("0"), init=False)

    # display name
    name: Mapped[str] = mapped_column(String)
    gender: Mapped[str] = mapped_column(String)
    pronouns: Mapped[str | None] = mapped_column(String, default=None)
    birthdate: Mapped[date] = mapped_column(Date)  # in the timezone of birthplace

    # Profile photo gallery for this user (photos about themselves)
    # The first photo in the gallery (by position) is used as the avatar
    profile_gallery_id: Mapped[int | None] = mapped_column(ForeignKey("photo_galleries.id"), default=None)

    hosting_status: Mapped[HostingStatus] = mapped_column(Enum(HostingStatus))
    meetup_status: Mapped[MeetupStatus] = mapped_column(Enum(MeetupStatus), server_default="open_to_meetup", init=False)

    # community standing score
    community_standing: Mapped[float | None] = mapped_column(Float, default=None)

    occupation: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    education: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images

    # "Who I am" under "About Me" tab
    about_me: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    # "What I do in my free time" under "About Me" tab
    things_i_like: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    # "About my home" under "My Home" tab
    about_place: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    # "Additional information" under "About Me" tab
    additional_information: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images

    banned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    is_superuser: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)
    is_editor: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    # the undelete token allows a user to recover their account for a couple of days after deletion in case it was
    # accidental or they changed their mind
    # constraints make sure these are non-null only if deleted_at is set and that these are null in unison
    undelete_token: Mapped[str | None] = mapped_column(String, default=None)
    # validity of the undelete token
    undelete_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # hosting preferences
    max_guests: Mapped[int | None] = mapped_column(Integer, default=None)
    last_minute: Mapped[bool | None] = mapped_column(Boolean, default=None)
    has_pets: Mapped[bool | None] = mapped_column(Boolean, default=None)
    accepts_pets: Mapped[bool | None] = mapped_column(Boolean, default=None)
    pet_details: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    has_kids: Mapped[bool | None] = mapped_column(Boolean, default=None)
    accepts_kids: Mapped[bool | None] = mapped_column(Boolean, default=None)
    kid_details: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    has_housemates: Mapped[bool | None] = mapped_column(Boolean, default=None)
    housemate_details: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    wheelchair_accessible: Mapped[bool | None] = mapped_column(Boolean, default=None)
    smoking_allowed: Mapped[SmokingLocation | None] = mapped_column(Enum(SmokingLocation), default=None)
    smokes_at_home: Mapped[bool | None] = mapped_column(Boolean, default=None)
    drinking_allowed: Mapped[bool | None] = mapped_column(Boolean, default=None)
    drinks_at_home: Mapped[bool | None] = mapped_column(Boolean, default=None)
    # "Additional information" under "My Home" tab
    other_host_info: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images

    # "Sleeping privacy" (not long-form text)
    sleeping_arrangement: Mapped[SleepingArrangement | None] = mapped_column(Enum(SleepingArrangement), default=None)
    # "Sleeping arrangement" under "My Home" tab
    sleeping_details: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    # "Local area information" under "My Home" tab
    area: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    # "House rules" under "My Home" tab
    house_rules: Mapped[str | None] = mapped_column(String, default=None)  # CommonMark without images
    parking: Mapped[bool | None] = mapped_column(Boolean, default=None)
    parking_details: Mapped[ParkingDetails | None] = mapped_column(
        Enum(ParkingDetails), default=None
    )  # CommonMark without images
    camping_ok: Mapped[bool | None] = mapped_column(Boolean, default=None)

    accepted_tos: Mapped[int] = mapped_column(Integer, default=0)
    accepted_community_guidelines: Mapped[int] = mapped_column(Integer, server_default="0", init=False)
    # whether the user has filled in the contributor form
    filled_contributor_form: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    # number of onboarding emails sent
    onboarding_emails_sent: Mapped[int] = mapped_column(Integer, server_default="0", init=False)
    last_onboarding_email_sent: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # whether we need to sync the user's newsletter preferences with the newsletter server
    in_sync_with_newsletter: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)
    # opted out of the newsletter
    opt_out_of_newsletter: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    # set to null to receive no digests
    digest_frequency: Mapped[timedelta | None] = mapped_column(Interval, default=None)
    last_digest_sent: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("to_timestamp(0)"), init=False
    )

    # for changing their email
    new_email: Mapped[str | None] = mapped_column(String, default=None)

    new_email_token: Mapped[str | None] = mapped_column(String, default=None)
    new_email_token_created: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    new_email_token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    recommendation_score: Mapped[float] = mapped_column(Float, server_default="0", init=False)

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
    phone_verification_token: Mapped[str | None] = mapped_column(
        String(6), default=None, server_default=expression.null(), init=False
    )

    phone_verification_sent: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("to_timestamp(0)"), init=False
    )
    phone_verification_verified: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None, server_default=expression.null(), init=False
    )
    phone_verification_attempts: Mapped[int] = mapped_column(Integer, server_default=text("0"), init=False)

    # the stripe customer identifier if the user has donated to Couchers
    # e.g. cus_JjoXHttuZopv0t
    # for new US entity
    stripe_customer_id: Mapped[str | None] = mapped_column(String, default=None)
    # for old AU entity
    stripe_customer_id_old: Mapped[str | None] = mapped_column(String, default=None)

    has_passport_sex_gender_exception: Mapped[bool] = mapped_column(
        Boolean, server_default=expression.false(), init=False
    )

    #  checking for phone verification
    last_donated: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None, server_default=expression.null()
    )

    # whether this user has all emails turned off
    do_not_email: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    profile_gallery: Mapped[PhotoGallery | None] = relationship(init=False, foreign_keys="User.profile_gallery_id")

    admin_note: Mapped[str] = mapped_column(String, server_default=text("''"), init=False)

    # whether mods have marked this user has having to update their location
    needs_to_update_location: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    last_antibot: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("to_timestamp(0)"), init=False
    )

    age = column_property(func.date_part("year", func.age(birthdate)))

    # ID of the invite code used to sign up (if any)
    invite_code_id: Mapped[str | None] = mapped_column(ForeignKey("invite_codes.id"), default=None)
    invite_code: Mapped[InviteCode | None] = relationship(init=False, foreign_keys=[invite_code_id])

    # Signup motivations - how they heard about us and what they want to do
    heard_about_couchers: Mapped[str | None] = mapped_column(String, default=None)
    signup_motivations: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=None)

    moderation_user_lists: Mapped[list[ModerationUserList]] = relationship(
        init=False, secondary="moderation_user_list_members", back_populates="users"
    )
    language_abilities: Mapped[list[LanguageAbility]] = relationship(init=False, back_populates="user")
    galleries: Mapped[list[PhotoGallery]] = relationship(
        init=False, foreign_keys="PhotoGallery.owner_user_id", back_populates="owner_user"
    )
    mod_notes: DynamicMapped[ModNote] = relationship(
        init=False, foreign_keys="ModNote.user_id", back_populates="user", lazy="dynamic"
    )

    badges: Mapped[list[UserBadge]] = relationship(init=False, back_populates="user")

    admin_tags: Mapped[list[UserAdminTag]] = relationship(
        init=False, foreign_keys="UserAdminTag.user_id", overlaps="user"
    )

    pending_activeness_probe: Mapped[ActivenessProbe | None] = relationship(
        init=False,
        primaryjoin="and_(ActivenessProbe.user_id == User.id, ActivenessProbe.is_pending)",
        uselist=False,
        back_populates="user",
    )

    public_trips: Mapped[list[PublicTrip]] = relationship(init=False, back_populates="user")

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
            postgresql_where=and_(banned_at.is_(None), deleted_at.is_(None)),
        ),
        Index(
            "ix_users_geom_active",
            geom,
            id,
            username,
            postgresql_using="gist",
            postgresql_where=and_(banned_at.is_(None), deleted_at.is_(None)),
        ),
        Index(
            "ix_users_by_id",
            id,
            postgresql_using="hash",
            postgresql_where=and_(banned_at.is_(None), deleted_at.is_(None)),
        ),
        Index(
            "ix_users_by_username",
            username,
            postgresql_using="hash",
            postgresql_where=and_(banned_at.is_(None), deleted_at.is_(None)),
        ),
        Index(
            "ix_users_visible_with_about_me",
            id,
            postgresql_where=and_(
                banned_at.is_(None),
                deleted_at.is_(None),
                profile_gallery_id.isnot(None),
                func.coalesce(func.character_length(about_me), 0) >= COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH,
            ),
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
            "((undelete_token IS NULL) = (undelete_until IS NULL)) AND ((undelete_token IS NULL) OR deleted_at IS NOT NULL)",
            name="undelete_nullity",
        ),
        # If the user disabled all emails, then they can't host or meet up
        CheckConstraint(
            "(do_not_email IS FALSE) OR ((hosting_status = 'cant_host') AND (meetup_status = 'does_not_want_to_meetup'))",
            name="do_not_email_inactive",
        ),
        # Superusers must be editors
        CheckConstraint(
            "(is_superuser IS FALSE) OR (is_editor IS TRUE)",
            name="superuser_is_editor",
        ),
    )

    @hybrid_property
    def has_completed_my_home(self) -> bool:
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

    @has_completed_my_home.inplace.expression
    @classmethod
    def _has_completed_my_home_expression(cls) -> ColumnElement[bool]:
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
    def jailed_missing_tos(self) -> bool:
        return self.accepted_tos < TOS_VERSION

    @hybrid_property
    def jailed_missing_community_guidelines(self) -> bool:
        return self.accepted_community_guidelines < GUIDELINES_VERSION

    @hybrid_property
    def jailed_pending_mod_notes(self) -> Any:
        # mod_notes come from a backref in ModNote
        return self.mod_notes.where(ModNote.is_pending).count() > 0

    @hybrid_property
    def jailed_pending_activeness_probe(self) -> Any:
        # search for User.pending_activeness_probe
        return self.pending_activeness_probe != None

    @hybrid_property
    def is_jailed(self) -> Any:
        return (
            self.jailed_missing_tos
            | self.jailed_missing_community_guidelines
            | self.is_missing_location
            | self.jailed_pending_mod_notes
            | self.jailed_pending_activeness_probe
        )

    @hybrid_property
    def is_missing_location(self) -> bool:
        return self.needs_to_update_location

    @hybrid_property
    def is_visible(self) -> bool:
        return self.banned_at is None and self.deleted_at is None

    @is_visible.inplace.expression
    @classmethod
    def _is_visible_expression(cls) -> ColumnElement[bool]:
        return and_(cls.banned_at.is_(None), cls.deleted_at.is_(None))

    @property
    def coordinates(self) -> tuple[float, float]:
        return get_coordinates(self.geom)

    @property
    def display_joined(self) -> datetime:
        """
        Returns the last active time rounded down to the nearest hour.
        """
        return self.joined.replace(minute=0, second=0, microsecond=0)

    @property
    def display_last_active(self) -> datetime:
        """
        Returns the last active time rounded down whatever is the "last active" coarsening.
        """
        return last_active_coarsen(self.last_active)

    @hybrid_property
    def phone_is_verified(self) -> bool:
        return (
            self.phone_verification_verified is not None
            and now() - self.phone_verification_verified < PHONE_VERIFICATION_LIFETIME
        )

    @phone_is_verified.inplace.expression
    @classmethod
    def _phone_is_verified_expression(cls) -> ColumnElement[bool]:
        return (cls.phone_verification_verified != None) & (
            now() - cls.phone_verification_verified < PHONE_VERIFICATION_LIFETIME
        )

    @hybrid_property
    def phone_code_expired(self) -> bool:
        return now() - self.phone_verification_sent > SMS_CODE_LIFETIME

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email}, username={self.username})"


class LanguageFluency(enum.Enum):
    # note that the numbering is important here, these are ordinal
    beginner = 1
    conversational = 2
    fluent = 3


class LanguageAbility(Base, kw_only=True):
    __tablename__ = "language_abilities"
    __table_args__ = (
        # Users can only have one language ability per language
        UniqueConstraint("user_id", "language_code"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    language_code: Mapped[str] = mapped_column(ForeignKey("languages.code", deferrable=True))
    fluency: Mapped[LanguageFluency] = mapped_column(Enum(LanguageFluency))

    user: Mapped[User] = relationship(init=False, back_populates="language_abilities")
    language: Mapped[Language] = relationship(init=False)


class RegionVisited(Base, kw_only=True):
    __tablename__ = "regions_visited"
    __table_args__ = (UniqueConstraint("user_id", "region_code"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    region_code: Mapped[str] = mapped_column(ForeignKey("regions.code", deferrable=True))


class RegionLived(Base, kw_only=True):
    __tablename__ = "regions_lived"
    __table_args__ = (UniqueConstraint("user_id", "region_code"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    region_code: Mapped[str] = mapped_column(ForeignKey("regions.code", deferrable=True))
