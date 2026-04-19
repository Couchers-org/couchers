from datetime import datetime, timedelta

import pytz

# terms of service version
TOS_VERSION = 2

# community guidelines version
GUIDELINES_VERSION = 1

EMAIL_REGEX = r"^[0-9a-z]([0-9a-z\-\_\+]|(\.[0-9a-z\-\_\+]))*@([0-9a-z\-]+\.)*[0-9a-z\-]+\.[a-z]{2,}$"

BANNED_USERNAME_PHRASES = [
    "admin",
    "bot",
    "couchers",
    "help",
    "moderation",
    "moderator",
    "noreply",
    "official",
    "security",
    "staff",
    "support",
    "system",
    "team",
    "verify",
]

# expiry time for a verified phone number
PHONE_VERIFICATION_LIFETIME = timedelta(days=2 * 365)

# shortest period between phone verification code requests
PHONE_REVERIFICATION_INTERVAL = timedelta(days=2)

# expiry time for an sms code
SMS_CODE_LIFETIME = timedelta(hours=24)

# max attempts to enter the sms code
SMS_CODE_ATTEMPTS = 3

# Postal verification constants
POSTAL_VERIFICATION_CODE_LENGTH = 6
# Reduced alphabet to avoid confusion (no I, O, 0, 1)
POSTAL_VERIFICATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
# Code valid for 90 days after postcard sent
POSTAL_VERIFICATION_CODE_LIFETIME = timedelta(days=90)
# Max wrong code attempts before lockout
POSTAL_VERIFICATION_MAX_ATTEMPTS = 5
# Can only initiate once per 30 days
POSTAL_VERIFICATION_RATE_LIMIT = timedelta(days=30)

SIGNUP_EMAIL_TOKEN_VALIDITY = timedelta(hours=48)

DATETIME_MINUS_INFINITY = pytz.UTC.localize(datetime(1, 1, 1))
DATETIME_INFINITY = pytz.UTC.localize(datetime(9876, 12, 31, hour=23, minute=59, second=59))

SERVER_THREADS = 128

WORKER_THREADS = 1

# how long the user has to undelete their account
UNDELETE_DAYS = 7

# expiry time for preferred language cookie
PREFERRED_LANGUAGE_COOKIE_EXPIRY = timedelta(days=3650)


# activeness probe settings
# wait about 11 months before sending one out
ACTIVENESS_PROBE_INACTIVITY_PERIOD = timedelta(days=333)
# times at which to send notifications after inactivity (cumulative since start of probe)
ACTIVENESS_PROBE_TIME_REMINDERS = [timedelta(days=0), timedelta(days=2, hours=8)]
# total time from initiation after which to expire the probe
ACTIVENESS_PROBE_EXPIRY_TIME = timedelta(days=4)

HOST_REQUEST_MAX_REMINDERS = 1
HOST_REQUEST_REMINDER_INTERVAL = timedelta(days=2)

# Note: Javascript's string.length is in utf16 code units, Python's len(str) is in utf8 code units.
HOST_REQUEST_MIN_LENGTH_UTF16 = 250  # Must match frontend
PUBLIC_TRIP_DESCRIPTION_MIN_LENGTH_UTF16 = 150  # Must match frontend

ANTIBOT_FREQ = timedelta(hours=48)

EVENT_REMINDER_TIMEDELTA = timedelta(hours=24)

COMMUNITIES_SEARCH_FUZZY_SIMILARITY_THRESHOLD = 0.35

UNKNOWN_ERROR_MESSAGE = "An unknown backend error occurred. Please consider filing a bug!"

# NOTE: these codes are on purpose not translatable
NONEXISTENT_API_CALL_ERROR_MESSAGE = "API call does not exist. Please refresh and try again."
MISSING_AUTH_LEVEL_ERROR_MESSAGE = "Internal authentication error."
COOKIES_AND_AUTH_HEADER_ERROR_MESSAGE = 'Both "cookie" and "authorization" in request'
CALL_CANCELLED_ERROR_MESSAGE = "Call cancelled."

# NOTE: the frontend uses these (and error codes) to distinguish between jailed and logged out
UNAUTHORIZED_ERROR_MESSAGE = "Unauthorized"
PERMISSION_DENIED_ERROR_MESSAGE = "Permission denied"

GHOST_USERNAME = "ghost"

# Donation drive start date - set to None to disable donation drive banner
# When set, users who haven't donated since this date will see a donation banner
DONATION_DRIVE_START: datetime | None = None

DONATION_GOAL_USD = 5000
# exclude big donations from Aapeli + Itsi that we're hoping to do without :)
DONATION_OFFSET_USD = 2000

# Photo gallery limits
GALLERY_MAX_PHOTOS_NOT_VERIFIED = 1
GALLERY_MAX_PHOTOS_VERIFIED = 4

COMPLETED_PROFILE_MINIMUM_CHAR_LENGTH = 150

# How long a container must run uninterrupted before /status reports stable=true
STABLE_THRESHOLD_SECONDS = 5 * 60
