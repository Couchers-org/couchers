"""
A simple config system
"""

import os
from typing import Any

CONFIG_T = list[tuple[str, type | list[str]] | tuple[str, type | list[str], str | int]]

# Allowed config options, as tuples (name, type, default).
# All fields are required
CONFIG_OPTIONS: CONFIG_T = [
    # Whether we're in dev mode
    ("DEV", bool),
    # Whether we're `api` mode (answering API queries) or `scheduler` (scheduling background jobs), or `worker`
    # (servicing background jobs). Can also be set to `all` to do all three simultaneously
    ("ROLE", ["api", "scheduler", "worker", "all"], "all"),
    # number of bg worker processes, requires worker or all above
    ("BACKGROUND_WORKER_COUNT", int, 2),
    # Version string
    ("VERSION", str, "unknown"),
    # Base URL of frontend, e.g. https://couchers.org
    ("BASE_URL", str),
    # URL of the backend, e.g. https://api.couchers.org
    ("BACKEND_BASE_URL", str),
    # URL of the console, e.g. https://console.couchers.org
    ("CONSOLE_BASE_URL", str),
    # URL of the merch shop, e.g. https://shop.couchershq.org
    ("MERCH_SHOP_URL", str),
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
    ("GEOLITE2_ASN_MMDB_FILE_LOCATION", str, ""),
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
    # Postal verification
    ("ENABLE_POSTAL_VERIFICATION", bool),
    # MyPostcard API credentials
    ("MYPOSTCARD_API_KEY", str),
    ("MYPOSTCARD_USERNAME", str),
    ("MYPOSTCARD_PASSWORD", str),
    ("MYPOSTCARD_PRODUCT_CODE", str),
    ("MYPOSTCARD_CAMPAIGN_ID", str),
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
    ("ENABLE_NOTIFICATION_TRANSLATIONS", bool),
    ("ENABLE_EMAIL_ICS_ATTACHMENTS", bool),
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
    # Whether to initiate new activeness probes
    ("ACTIVENESS_PROBES_ENABLED", bool),
    # Listmonk (mailing list)
    ("LISTMONK_ENABLED", bool),
    ("LISTMONK_BASE_URL", str),
    ("LISTMONK_API_USERNAME", str),
    ("LISTMONK_API_KEY", str),
    ("LISTMONK_LIST_ID", int),
    # Google recaptcha antibot
    ("RECAPTHCA_ENABLED", bool),
    ("RECAPTHCA_PROJECT_ID", str),
    ("RECAPTHCA_API_KEY", str),
    ("RECAPTHCA_SITE_KEY", str),
    # Whether we're in test
    ("IN_TEST", bool, "0"),
    # Experimentation (feature flags via GrowthBook)
    ("EXPERIMENTATION_ENABLED", bool, "0"),
    # When enabled, all feature gates return True (useful for development/testing)
    ("EXPERIMENTATION_PASS_ALL_GATES", bool, "0"),
    # GrowthBook SDK configuration
    ("GROWTHBOOK_API_HOST", str, "https://cdn.growthbook.io"),
    ("GROWTHBOOK_CLIENT_KEY", str, ""),
    # Disk path for the last-known-good feature payload, used as a cold-start fallback when GrowthBook
    # is unreachable. Required when experimentation is enabled so we never start on in-code defaults.
    ("GROWTHBOOK_CACHE_PATH", str, ""),
    # Moderation auto-approval deadline in seconds (0 to disable auto-approval)
    ("MODERATION_AUTO_APPROVE_DEADLINE_SECONDS", int),
    # User ID of the bot user for automated moderation actions
    ("MODERATION_BOT_USER_ID", int),
    # Enable development APIs (e.g., SendDevPushNotification)
    ("ENABLE_DEV_APIS", bool),
    # Slack notifications
    ("SLACK_ENABLED", bool),
    ("SLACK_BOT_TOKEN", str),
    ("SLACK_DONATIONS_CHANNEL", str),
    ("SLACK_MERCH_CHANNEL", str),
]


def check_config(cfg: dict[str, Any]) -> None:
    for name, *_ in CONFIG_OPTIONS:
        if name not in cfg:
            raise ValueError(f"Required config value {name} not set")

    if not cfg["DEV"]:
        # checks for prod
        if "https" not in cfg["BASE_URL"]:
            raise Exception("Production site must be over HTTPS")
        if not cfg["ENABLE_EMAIL"]:
            raise Exception("Production site must have email enabled")
        if not cfg["ENABLE_SMS"]:
            raise Exception("Production site must have SMS enabled")
        if cfg["IN_TEST"]:
            raise Exception("IN_TEST while not DEV")

    if cfg["ENABLE_DONATIONS"]:
        if not cfg["STRIPE_API_KEY"] or not cfg["STRIPE_WEBHOOK_SECRET"] or not cfg["STRIPE_RECURRING_PRODUCT_ID"]:
            raise Exception("No Stripe API key/recurring donation ID but donations enabled")

    if cfg["ENABLE_STRONG_VERIFICATION"]:
        if not cfg["IRIS_ID_PUBKEY"] or not cfg["IRIS_ID_SECRET"] or not cfg["VERIFICATION_DATA_PUBLIC_KEY"]:
            raise Exception("No Iris ID pubkey/secret or verification data pubkey but strong verification enabled")

    if cfg["ENABLE_POSTAL_VERIFICATION"]:
        if (
            not cfg["MYPOSTCARD_API_KEY"]
            or not cfg["MYPOSTCARD_USERNAME"]
            or not cfg["MYPOSTCARD_PASSWORD"]
            or not cfg["MYPOSTCARD_PRODUCT_CODE"]
            or not cfg["MYPOSTCARD_CAMPAIGN_ID"]
        ):
            raise Exception("MyPostcard API credentials not configured but postal verification enabled")

    if cfg["EXPERIMENTATION_ENABLED"]:
        if not cfg["GROWTHBOOK_CLIENT_KEY"]:
            raise Exception("No GrowthBook client key but experimentation enabled")
        if not cfg["GROWTHBOOK_CACHE_PATH"]:
            raise Exception("No GrowthBook cache path but experimentation enabled")


def make_config() -> dict[str, Any]:
    cfg = {}

    for config_option in CONFIG_OPTIONS:
        if len(config_option) == 2:
            name, type_ = config_option
            optional = False
        elif len(config_option) == 3:
            name, type_, default_value = config_option
            optional = True
        else:
            raise ValueError("Invalid CONFIG_OPTIONS")

        value: str | int | bytes | None = os.getenv(name)

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
            if not isinstance(value, str):
                raise RuntimeError(type(value))
            value = bytes.fromhex(value)
        elif isinstance(type_, list):
            # list of allowed string values
            if value not in type_:
                raise ValueError(f"Invalid value for {name}, need one of {', '.join(type_)}")
        else:
            value = type_(value)

        cfg[name] = value

    return cfg


config = make_config()
