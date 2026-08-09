import http.cookies
import re
import typing
from collections.abc import Mapping, Sequence
from datetime import UTC, date, datetime, timedelta, tzinfo
from email.utils import formatdate
from typing import TYPE_CHECKING, Any, overload
from zoneinfo import ZoneInfo

import regex
from geoalchemy2 import WKBElement, WKTElement
from geoalchemy2.shape import from_shape, to_shape
from google.protobuf.duration_pb2 import Duration
from google.protobuf.timestamp_pb2 import Timestamp
from shapely.geometry import Point, Polygon, shape
from sqlalchemy import Function, cast
from sqlalchemy.orm import Mapped
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from couchers.config import config
from couchers.constants import (
    EMAIL_REGEX,
    PREFERRED_LANGUAGE_COOKIE_EXPIRY,
    VALID_NAME_MAX_LENGTH,
    VALID_NAME_MIN_LENGTH,
    VALID_NAME_REGEX,
)
from couchers.crypto import (
    create_sofa_id,
    decode_sofa,
    decrypt_page_token,
    encode_sofa,
    encrypt_page_token,
)
from couchers.proto.internal import internal_pb2

_VALID_NAME_PATTERN = regex.compile(VALID_NAME_REGEX, regex.UNICODE)

if TYPE_CHECKING:
    from couchers.models import Geom


# When a user logs in, they can basically input one of three things: user id, username, or email
# These are three non-intersecting sets
# * user_ids are numeric representations in base 10
# * usernames are alphanumeric + underscores, at least 2 chars long, and don't start with a number,
#   and don't start or end with underscore
# * emails are just whatever stack overflow says emails are ;)


def is_valid_user_id(field: str) -> bool:
    """
    Checks if it's a string representing a base 10 integer not starting with 0
    """
    return re.match(r"[1-9][0-9]*$", field) is not None


def is_valid_username(field: str) -> bool:
    """
    Checks if it's an alphanumeric + underscore, lowercase string, at least
    two characters long, and starts with a letter, ends with alphanumeric
    """
    return re.match(r"[a-z][0-9a-z_]*[a-z0-9]$", field) is not None


def is_valid_name(field: str) -> bool:
    """
    Checks that the name satisfies the same rules as the web frontend:

    * only letters (any Unicode letter), whitespace, apostrophes, and hyphens
    * no leading or trailing whitespace
    * 2-100 characters
    """
    if len(field) > VALID_NAME_MAX_LENGTH or len(field) < VALID_NAME_MIN_LENGTH:
        return False

    return _VALID_NAME_PATTERN.fullmatch(field) is not None


def is_valid_email(field: str) -> bool:
    return re.match(EMAIL_REGEX, field) is not None


def Timestamp_from_datetime(dt: datetime) -> Timestamp:
    if dt.tzinfo is None:
        raise ValueError("Cannot convert a naive datetime to a timestamp.")

    pb_ts = Timestamp()
    pb_ts.FromDatetime(dt)
    return pb_ts


def Duration_from_timedelta(dt: timedelta) -> Duration:
    pb_d = Duration()
    pb_d.FromTimedelta(dt)
    return pb_d


def parse_date(date_str: str) -> date | None:
    """
    Parses a date-only string in the format "YYYY-MM-DD" returning None if it fails
    """
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


def date_to_api(date_obj: date) -> str:
    return date_obj.isoformat()


def to_aware_datetime(ts: Timestamp) -> datetime:
    """
    Turns a protobuf Timestamp object into a timezone-aware datetime
    """
    return ts.ToDatetime(tzinfo=UTC)


def to_timezone(value: Timestamp | datetime, timezone: tzinfo) -> datetime:
    """Returns an instant in time as a datetime in a given timezone."""
    if isinstance(value, Timestamp):
        return value.ToDatetime(timezone)

    if value.tzinfo is None:
        # A naive datetime does not represent a point in time.
        raise ValueError("Cannot convert a naive datetime to a timezone.")

    return value.astimezone(timezone)


def datetime_to_iso8601_local(value: datetime) -> str:
    """
    Gets a local ISO 8601 representation of a datetime, without timezone information.
    This loses information and requires parsers to assume a timezone, so use with care.
    """
    return value.replace(tzinfo=None).isoformat()


def _mockable_now() -> datetime:
    return datetime.now(tz=UTC)


def now() -> datetime:
    # everything that reads the clock goes through this call, so tests can move it in one place
    # by swapping _mockable_now; see the timewarp fixture
    return _mockable_now()


def minimum_allowed_birthdate() -> date:
    """
    Most recent birthdate allowed to register (must be 18 years minimum)

    This approximation works on leap days!
    """
    return today() - timedelta(days=365.25 * 18)


def today() -> date:
    """
    Date only in UTC
    """
    return now().date()


def now_in_timezone(tz: str) -> datetime:
    """
    tz should be tzdata identifier, e.g. America/New_York
    """
    return now().astimezone(ZoneInfo(tz))


def today_in_timezone(tz: str) -> date:
    """
    tz should be tzdata identifier, e.g. America/New_York
    """
    return now_in_timezone(tz).date()


# Note: be very careful with ordering of lat/lng!
# In a lot of cases they come as (lng, lat), but us humans tend to use them from GPS as (lat, lng)...
# When entering as EPSG4326, we also need it in (lng, lat)


def wrap_coordinate(lat: float, lng: float) -> tuple[float, float]:
    """
    Wraps (lat, lng) point in the EPSG4326 format
    """

    def __wrap_gen(deg: float, ct: float, adj: float) -> float:
        if deg > ct:
            deg -= adj
        if deg < -ct:
            deg += adj
        return deg

    def __wrap_flip(deg: float, ct: float, adj: float) -> float:
        if deg > ct:
            deg = -deg + adj
        if deg < -ct:
            deg = -deg - adj
        return deg

    def __wrap_rem(deg: float, ct: float = 360) -> float:
        if deg > ct:
            deg = deg % ct
        if deg < -ct:
            deg = deg % -ct
        return deg

    if lng < -180 or lng > 180 or lat < -90 or lat > 90:
        lng = __wrap_rem(lng)
        lat = __wrap_rem(lat)
        lng = __wrap_gen(lng, 180, 360)
        lat = __wrap_flip(lat, 180, 180)
        lat = __wrap_flip(lat, 90, 180)
        if lng == -180:
            lng = 180
        if lng == -360:
            lng = 0

    return lat, lng


def create_coordinate(lat: float, lng: float) -> WKBElement:
    """
    Creates a WKT point from a (lat, lng) tuple in EPSG4326 coordinate system (normal GPS-coordinates)
    """
    lat, lng = wrap_coordinate(lat, lng)
    return from_shape(Point(lng, lat), srid=4326)


def create_polygon_lat_lng(points: list[list[float]]) -> WKBElement:
    """
    Creates a EPSG4326 WKT polygon from a list of (lat, lng) tuples
    """
    return from_shape(Polygon([(lng, lat) for (lat, lng) in points]), srid=4326)


def create_polygon_lng_lat(points: list[list[float]]) -> WKBElement:
    """
    Creates a EPSG4326 WKT polygon from a list of (lng, lat) tuples
    """
    return from_shape(Polygon(points), srid=4326)


def geojson_to_geom(geojson: dict[str, Any]) -> WKBElement:
    """
    Turns GeoJSON to PostGIS geom data in EPSG4326
    """
    return from_shape(shape(geojson), srid=4326)


def to_multi(polygon: WKBElement) -> Function[Any]:
    return func.ST_Multi(polygon)


@overload
def get_coordinates(geom: WKBElement | WKTElement) -> tuple[float, float]: ...
@overload
def get_coordinates(geom: None) -> None: ...


def get_coordinates(geom: WKBElement | WKTElement | None) -> tuple[float, float] | None:
    """
    Returns EPSG4326 (lat, lng) pair for a given WKT geom point or None if the input is not truthy
    """
    if geom:
        shp = to_shape(geom)
        # note the funniness with 4326 normally being (x, y) = (lng, lat)
        return shp.y, shp.x
    else:
        return None


def http_date(dt: datetime | None = None) -> str:
    """
    Format the datetime for HTTP cookies
    """
    if not dt:
        dt = now()
    return formatdate(dt.timestamp(), usegmt=True)


def _create_tasty_cookie(name: str, value: Any, expiry: datetime, httponly: bool) -> str:
    cookie: http.cookies.Morsel[str] = http.cookies.Morsel()
    cookie.set(name, str(value), str(value))
    # tell the browser when to stop sending the cookie
    cookie["expires"] = http_date(expiry)
    # restrict to our domain, note if there's no domain, it won't include subdomains
    cookie["domain"] = config.COOKIE_DOMAIN
    # path so that it's accessible for all API requests, otherwise defaults to something like /org.couchers.auth/
    cookie["path"] = "/"
    if config.DEV:
        # send only on requests from first-party domains
        cookie["samesite"] = "Strict"
    else:
        # send on all requests, requires Secure
        cookie["samesite"] = "None"
        # only set cookie on HTTPS sites in production
        cookie["secure"] = True
    # not accessible from javascript
    cookie["httponly"] = httponly

    return cookie.OutputString()


def create_session_cookies(token: str, user_id: str | int, expiry: datetime) -> list[str]:
    """
    Creates our session cookies.

    We have two: the secure session token (in couchers-sesh) that's inaccessible to javascript, and the user id (in couchers-user-id) which the javascript frontend can access, so that it knows when it's logged in/out
    """
    return [
        _create_tasty_cookie("couchers-sesh", token, expiry, httponly=True),
        _create_tasty_cookie("couchers-user-id", user_id, expiry, httponly=False),
    ]


def create_lang_cookie(lang: str) -> list[str]:
    return [
        _create_tasty_cookie("NEXT_LOCALE", lang, expiry=(now() + PREFERRED_LANGUAGE_COOKIE_EXPIRY), httponly=False)
    ]


def _parse_cookie(headers: Mapping[str, str | bytes], cookie_name: str) -> str | None:
    """
    Helper to parse a cookie value from headers by name, returning None if not found.
    """
    if "cookie" not in headers:
        return None

    cookie_str = typing.cast(str, headers["cookie"])
    cookie = http.cookies.SimpleCookie(cookie_str).get(cookie_name)

    if not cookie:
        return None

    return cookie.value


def parse_session_cookie(headers: Mapping[str, str | bytes]) -> str | None:
    """
    Returns our session cookie value (aka token) or None
    """
    return _parse_cookie(headers, "couchers-sesh")


def parse_user_id_cookie(headers: Mapping[str, str | bytes]) -> str | None:
    """
    Returns our user id cookie value or None
    """
    return _parse_cookie(headers, "couchers-user-id")


def parse_ui_lang_cookie(headers: Mapping[str, str | bytes]) -> str | None:
    """
    Returns language cookie or None
    """
    return _parse_cookie(headers, "NEXT_LOCALE")


def parse_api_key(headers: Mapping[str, str | bytes]) -> str | None:
    """
    Returns a bearer token (API key) from the `authorization` header, or None if invalid/not present
    """
    if "authorization" not in headers:
        return None

    authorization = headers["authorization"]
    if isinstance(authorization, bytes):
        authorization = authorization.decode("utf-8")

    if not authorization.startswith("Bearer "):
        return None

    return authorization[7:]


def parse_sofa_cookie(headers: Mapping[str, str | bytes]) -> str | None:
    cookie_value = _parse_cookie(headers, "sofa")
    if not cookie_value:
        return None

    try:
        decode_sofa(cookie_value)
        return cookie_value
    except Exception:
        return None


def generate_sofa_cookie() -> tuple[str, str]:
    sofa_value = encode_sofa(
        create_sofa_id(),
        internal_pb2.SofaPayload(
            version=1,
            created=Timestamp_from_datetime(now()),
        ),
    )
    return sofa_value, _create_tasty_cookie("sofa", sofa_value, now() + timedelta(days=10000), httponly=True)


def remove_duplicates_retain_order[T](list_: Sequence[T]) -> list[T]:
    out = []
    for item in list_:
        if item not in out:
            out.append(item)
    return out


def date_in_timezone(date_: Mapped[date | None], timezone: str) -> Function[Any]:
    """
    Given a naive postgres date object (postgres doesn't have tzd dates), returns a timezone-aware timestamp for the
    start of that date in that timezone. E.g., if postgres is in 'America/New_York',

    SET SESSION TIME ZONE 'America/New_York';

    CREATE TABLE tz_trouble (to_date date, timezone text);

    INSERT INTO tz_trouble(to_date, timezone) VALUES
    ('2021-03-10'::date, 'Australia/Sydney'),
    ('2021-03-20'::date, 'Europe/Berlin'),
    ('2021-04-15'::date, 'America/New_York');

    SELECT timezone(timezone, to_date::timestamp) FROM tz_trouble;

    The result is:

            timezone
    ------------------------
     2021-03-09 08:00:00-05
     2021-03-19 19:00:00-04
     2021-04-15 00:00:00-04
    """
    return func.timezone(timezone, cast(date_, DateTime(timezone=False)))


def millis_from_dt(dt: datetime) -> int:
    return round(1000 * dt.timestamp())


def dt_from_millis(millis: int) -> datetime:
    return datetime.fromtimestamp(millis / 1000, tz=UTC)


def dt_to_page_token(dt: datetime) -> str:
    """
    Python has datetime resolution equal to 1 micro, as does postgres

    We pray to deities that this never changes
    """
    assert datetime.resolution == timedelta(microseconds=1)
    return encrypt_page_token(str(round(1_000_000 * dt.timestamp())))


def dt_from_page_token(page_token: str) -> datetime:
    # see above comment
    return datetime.fromtimestamp(int(decrypt_page_token(page_token)) / 1_000_000, tz=UTC)


def dt_id_to_page_token(dt: datetime, id_: int) -> str:
    # see above comment about resolution
    return encrypt_page_token(f"{round(1_000_000 * dt.timestamp())}:{id_}")


def dt_id_from_page_token(page_token: str) -> tuple[datetime, int]:
    micros, id_ = decrypt_page_token(page_token).split(":")
    return datetime.fromtimestamp(int(micros) / 1_000_000, tz=UTC), int(id_)


def last_active_coarsen(dt: datetime) -> datetime:
    """
    Coarsens a "last active" time to the accuracy we use for last active times, currently to the last hour, e.g. if the current time is 27th June 2021, 16:53 UTC, this returns 27th June 2021, 16:00 UTC
    """
    return dt.replace(minute=0, second=0, microsecond=0)


def not_none[T](x: T | None) -> T:
    if x is None:
        raise ValueError("Expected a value but got None")
    return x


def is_geom(x: Geom | None) -> Geom:
    """not_none does not work with unions."""
    if x is None:
        raise ValueError("Expected a Geom but got None")
    return x
