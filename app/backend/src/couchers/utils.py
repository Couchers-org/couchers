import http.cookies
from datetime import datetime, timedelta, timezone
from email.utils import formatdate

import pytz
from geoalchemy2.shape import from_shape, to_shape
from google.protobuf.timestamp_pb2 import Timestamp
from shapely.geometry import Point, Polygon, shape
from sqlalchemy.sql import func

from couchers.config import config

utc = pytz.UTC


def Timestamp_from_datetime(dt: datetime):
    pb_ts = Timestamp()
    pb_ts.FromDatetime(dt)
    return pb_ts


def to_aware_datetime(ts: Timestamp):
    """
    Turns a protobuf Timestamp object into a timezone-aware datetime
    """
    return utc.localize(ts.ToDatetime())


def now():
    return datetime.now(utc)


def largest_current_date():
    """
    Get the largest date that's possible now.

    That is, get the largest date that is in effect in some part of the world now, somewhere presumably very far east.
    """
    # This is not the right way to do it, timezones can change
    # at the time of writing, Samoa observes UTC+14 in Summer
    return datetime.now(timezone(timedelta(hours=14))).strftime("%Y-%m-%d")


def least_current_date():
    """
    Same as above for earliest date (west)
    """
    # This is not the right way to do it, timezones can change
    # at the time of writing, Baker Island observes UTC-12
    return datetime.now(timezone(timedelta(hours=-12))).strftime("%Y-%m-%d")


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
