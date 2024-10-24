"""
A simple config system
"""

import os

# Allowed config options, as tuples (name, type, default).
# All fields are required
CONFIG_OPTIONS = [
    # Whether we're in dev mode
    ("DEV", bool),
    # Whether we're `api` mode (answering API queries) or `scheduler` (scheduling background jobs), or `worker`
    # (servicing background jobs). Can also be set to `all` to do all three simultaneously
    ("ROLE", ["api", "scheduler", "worker", "all"], "all"),
    # Version string
    ("VERSION", str, "unknown"),
    # Base URL of frontend, e.g. https://couchers.org
    ("BASE_URL", str),
    # URL of the backend, e.g. https://api.couchers.org
    ("BACKEND_BASE_URL", str),
    # URL of the console, e.g. https://console.couchers.org
    ("CONSOLE_BASE_URL", str),
    # Used to generate a variety of secrets
    ("SECRET", bytes),
    # Domain that cookies should set as their domain value
    ("COOKIE_DOMAIN", str),
    # SQLAlchemy database connection string
    ("DATABASE_CONNECTION_STRING", str),
    # OpenTelemetry endpoint to send traces to
    ("OPENTELEMETRY_ENDPOINT", str, ""),
    # Path to a GeoLite2-City.mmdb file for geocoding IPs in user session info
    ("GEOLITE2_CITY_MMDB_FILE_LOCATION", str, ""),
    # Whether to try adding dummy data
    ("ADD_DUMMY_DATA", bool),
    # Donations
    ("ENABLE_DONATIONS", bool),
    ("STRIPE_API_KEY", str),
    ("STRIPE_WEBHOOK_SECRET", str),
    ("STRIPE_RECURRING_PRODUCT_ID", str),
    # Strong verification through Iris ID
    ("ENABLE_STRONG_VERIFICATION", bool),
    ("IRIS_ID_PUBKEY", str),
    ("IRIS_ID_SECRET", str),
    ("VERIFICATION_DATA_PUBLIC_KEY", bytes),
    # SMS
    ("ENABLE_SMS", bool),
    ("SMS_SENDER_ID", str),
    # Email
    ("ENABLE_EMAIL", bool),
    # Sender name for outgoing notification emails e.g. "Couchers.org"
    ("NOTIFICATION_EMAIL_SENDER", str),
    # Sender email, e.g. "notify@couchers.org"
    ("NOTIFICATION_EMAIL_ADDRESS", str),
    # An optional prefix for email subject, e.g. [STAGING]
    ("NOTIFICATION_PREFIX", str, ""),
    # Address to send emails about reported users
    ("REPORTS_EMAIL_RECIPIENT", str),
    # Address to send contributor forms when users sign up/fill the form
    ("CONTRIBUTOR_FORM_EMAIL_RECIPIENT", str),
    # Address to moderation notifications
    ("MODS_EMAIL_RECIPIENT", str),
    # SMTP settings
    ("SMTP_HOST", str),
    ("SMTP_PORT", int),
    ("SMTP_USERNAME", str),
    ("SMTP_PASSWORD", str),
    # Media server
    ("ENABLE_MEDIA", bool),
    ("MEDIA_SERVER_SECRET_KEY", bytes),
    ("MEDIA_SERVER_BEARER_TOKEN", str),
    ("MEDIA_SERVER_BASE_URL", str),
    ("MEDIA_SERVER_UPLOAD_BASE_URL", str),
    # Bug reporting tool
    ("BUG_TOOL_ENABLED", bool),
    ("BUG_TOOL_GITHUB_REPO", str),
    ("BUG_TOOL_GITHUB_USERNAME", str),
    ("BUG_TOOL_GITHUB_TOKEN", str),
    # Sentry
    ("SENTRY_ENABLED", bool),
    ("SENTRY_URL", str),
    # Push notifications
    ("PUSH_NOTIFICATIONS_ENABLED", bool),
    ("PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY", str),
    ("PUSH_NOTIFICATIONS_VAPID_SUBJECT", str),
    # Listmonk (mailing list)
    ("LISTMONK_ENABLED", bool),
    ("LISTMONK_BASE_URL", str),
    ("LISTMONK_API_KEY", str),
    ("LISTMONK_LIST_UUID", str),
    # Whether we're in test
    ("IN_TEST", bool, "0"),
]

config = {}

for config_option in CONFIG_OPTIONS:
    if len(config_option) == 2:
        name, type_ = config_option
        optional = False
    elif len(config_option) == 3:
        name, type_, default_value = config_option
        optional = True
    else:
        raise ValueError("Invalid CONFIG_OPTIONS")

    value = os.getenv(name)

    if not value:
        if not optional:
            # config value not set - will cause a KeyError when trying
            # to access it.
            continue
        else:
            value = default_value

    if type_ is bool:
        # 1 is true, 0 is false, everything else is illegal
        if value not in ["0", "1"]:
            raise ValueError(f'Invalid bool for {name}, need "0" or "1"')
        value = value == "1"
    elif type_ is bytes:
        # decode from hex
        value = bytes.fromhex(value)
    elif isinstance(type_, list):
        # list of allowed string values
        if value not in type_:
            raise ValueError(f'Invalid value for {name}, need one of {", ".join(type_)}')
    else:
        value = type_(value)

    config[name] = value


## Config checks
def check_config():
    for name, *_ in CONFIG_OPTIONS:
        if name not in config:
            raise ValueError(f"Required config value {name} not set")

    if not config["DEV"]:
        # checks for prod
        if "https" not in config["BASE_URL"]:
            raise Exception("Production site must be over HTTPS")
        if not config["ENABLE_EMAIL"]:
            raise Exception("Production site must have email enabled")
        if not config["ENABLE_SMS"]:
            raise Exception("Production site must have SMS enabled")
        if config["IN_TEST"]:
            raise Exception("IN_TEST while not DEV")

    if config["ENABLE_DONATIONS"]:
        if (
            not config["STRIPE_API_KEY"]
            or not config["STRIPE_WEBHOOK_SECRET"]
            or not config["STRIPE_RECURRING_PRODUCT_ID"]
        ):
            raise Exception("No Stripe API key/recurring donation ID but donations enabled")

    if config["ENABLE_STRONG_VERIFICATION"]:
        if not config["IRIS_ID_PUBKEY"] or not config["IRIS_ID_SECRET"] or not config["VERIFICATION_DATA_PUBLIC_KEY"]:
            raise Exception("No Iris ID pubkey/secret or verification data pubkey but strong verification enabled")
