from datetime import datetime, timedelta, timezone

import pytz
from google.protobuf.timestamp_pb2 import Timestamp

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
