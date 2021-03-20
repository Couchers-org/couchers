import http.cookies
from datetime import date, datetime, timedelta, timezone
from email.utils import formatdate

import pytz
from geoalchemy2.shape import from_shape, to_shape
from google.protobuf.timestamp_pb2 import Timestamp
from shapely.geometry import Point, Polygon, shape
from sqlalchemy.sql import cast, func
from sqlalchemy.types import DateTime

from couchers.config import config

utc = pytz.UTC


def Timestamp_from_datetime(dt: datetime):
    pb_ts = Timestamp()
    pb_ts.FromDatetime(dt)
    return pb_ts


def parse_date(date_str: str):
    """
    Parses a date-only string in the format "YYYY-MM-DD" returning None if it fails
    """
    try:
        return date.fromisoformat(date_str)
    except ValueError:
        return None


def date_to_api(date: date):
    return date.isoformat()


def to_aware_datetime(ts: Timestamp):
    """
    Turns a protobuf Timestamp object into a timezone-aware datetime
    """
    return utc.localize(ts.ToDatetime())


def now():
    return datetime.now(utc)


def today():
    """
    Date only in UTC
    """
    return now().date()


def largest_current_date():
    """
    Get the largest date that's possible now.

    That is, get the largest date that is in effect in some part of the world now, somewhere presumably very far east.
    """
    # This is not the right way to do it, timezones can change
    # at the time of writing, Samoa observes UTC+14 in Summer
    return datetime.now(timezone(timedelta(hours=14))).date()


def least_current_date():
    """
    Same as above for earliest date (west)
    """
    # This is not the right way to do it, timezones can change
    # at the time of writing, Baker Island observes UTC-12
    return datetime.now(timezone(timedelta(hours=-12))).date()


# Note: be very careful with ordering of lat/lng!
# In a lot of cases they come as (lng, lat), but us humans tend to use them from GPS as (lat, lng)...
# When entering as EPSG4326, we also need it in (lng, lat)


def create_coordinate(lat, lng):
    """
    Creates a WKT point from a (lat, lng) tuple in EPSG4326 coordinate system (normal GPS-coordinates)
    """
    return from_shape(Point(lng, lat), srid=4326)


def create_polygon_lat_lng(points):
    """
    Creates a EPSG4326 WKT polygon from a list of (lat, lng) tuples
    """
    return from_shape(Polygon([(lng, lat) for (lat, lng) in points]), srid=4326)


def create_polygon_lng_lat(points):
    """
    Creates a EPSG4326 WKT polygon from a list of (lng, lat) tuples
    """
    return from_shape(Polygon(points), srid=4326)


def geojson_to_geom(geojson):
    """
    Turns GeoJSON to PostGIS geom data in EPSG4326
    """
    return from_shape(shape(geojson), srid=4326)


def to_multi(polygon):
    return func.ST_Multi(polygon)


def get_coordinates(geom):
    """
    Returns EPSG4326 (lat, lng) pair for a given WKT geom point
    """
    shp = to_shape(geom)
    # note the funiness with 4326 normally being (x, y) = (lng, lat)
    return (shp.y, shp.x)


def http_date(dt=None):
    """
    Format the datetime for HTTP cookies
    """
    if not dt:
        dt = now()
    return formatdate(dt.timestamp(), usegmt=True)


def create_session_cookie(token, expiry):
    cookie = http.cookies.Morsel()
    cookie.set("couchers-sesh", token, token)
    # tell the browser when to stop sending the cookie
    cookie["expires"] = http_date(expiry)
    # restrict to our domain, note if there's no domain, it won't include subdomains
    cookie["domain"] = config["COOKIE_DOMAIN"]
    # path so that it's accessible for all API requests, otherwise defaults to something like /org.couchers.auth/
    cookie["path"] = "/"
    if config["DEV"]:
        # send only on requests from first-party domains
        cookie["samesite"] = "Strict"
    else:
        # send on all requests, requires Secure
        cookie["samesite"] = "None"
        # only set cookie on HTTPS sites in production
        cookie["secure"] = True
    # not accessible from javascript
    cookie["httponly"] = True

    return cookie.OutputString()


def parse_session_cookie(headers):
    """
    Returns our session cookie value (aka token) or None
    """
    if "cookie" not in headers:
        return None

    # parse the cookie
    cookie = http.cookies.SimpleCookie(headers["cookie"]).get("couchers-sesh")

    if not cookie:
        return None

    return cookie.value


def remove_duplicates_retain_order(list_):
    out = []
    for item in list_:
        if item not in out:
            out.append(item)
    return out


def date_in_timezone(date_, timezone):
    """
    Given a naive postgres date object (postgres doesn't have tzd dates), returns a timezone-aware timestamp for the
    start of that date in that timezone. E.g. if postgres is in 'America/New_York',

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
