from datetime import datetime, timedelta

import pytz

# terms of service version
TOS_VERSION = 2

# community guidelines version
GUIDELINES_VERSION = 1

EMAIL_REGEX = r"^[0-9a-z][0-9a-z\-\_\+\.]*@([0-9a-z\-]+\.)*[0-9a-z\-]+\.[a-z]{2,}$"

# expiry time for a verified phone number
PHONE_VERIFICATION_LIFETIME = timedelta(days=2 * 365)

# shortest period between phone verification code requests
PHONE_REVERIFICATION_INTERVAL = timedelta(days=2)

# expiry time for an sms code
SMS_CODE_LIFETIME = timedelta(hours=24)

# max attempts to enter the sms code
SMS_CODE_ATTEMPTS = 3

SIGNUP_EMAIL_TOKEN_VALIDITY = timedelta(hours=48)

DATETIME_MINUS_INFINITY = pytz.UTC.localize(datetime(1, 1, 1))
DATETIME_INFINITY = pytz.UTC.localize(datetime(9876, 12, 31, hour=23, minute=59, second=59))

SERVER_THREADS = 128

# default digest settings
DIGEST_FREQUENCY = timedelta(hours=48)
