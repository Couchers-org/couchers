"""
A simple config system
"""

import os
import typing
from collections.abc import Mapping
from typing import Any, Literal


# Not a dataclass. Not all attributes must be initialized.
class Config:
    """
    Defines strongly-typed application config values,
    initializable from matching environment variables,
    also supporting weakly-typed dict-like access for backcompat with existing code.
    """

    # Whether we're in dev mode
    DEV: bool
    # Whether we're `api` mode (answering API queries) or `scheduler` (scheduling background jobs), or `worker`
    # (servicing background jobs). Can also be set to `all` to do all three simultaneously
    ROLE: Literal["api", "scheduler", "worker", "all"] = "all"
    # number of bg worker processes, requires worker or all above
    BACKGROUND_WORKER_COUNT: int = 2
    # Version string
    VERSION: str = "unknown"
    # ISO 8601 timestamp of the deployed commit (CI_COMMIT_TIMESTAMP), empty outside CI builds
    COMMIT_TIMESTAMP: str = ""
    # Base URL of frontend, e.g. https://couchers.org
    BASE_URL: str
    # URL of the backend, e.g. https://api.couchers.org
    BACKEND_BASE_URL: str
    # URL of the console, e.g. https://console.couchers.org
    CONSOLE_BASE_URL: str
    # URL of the merch shop, e.g. https://shop.couchershq.org
    MERCH_SHOP_URL: str
    # Used to generate a variety of secrets
    SECRET: bytes
    # Domain that cookies should set as their domain value
    COOKIE_DOMAIN: str
    # SQLAlchemy database connection string
    DATABASE_CONNECTION_STRING: str
    # OpenTelemetry endpoint to send traces to
    OPENTELEMETRY_ENDPOINT: str = ""
    # Path to a GeoLite2-City.mmdb file for geocoding IPs in user session info
    GEOLITE2_CITY_MMDB_FILE_LOCATION: str = ""
    GEOLITE2_ASN_MMDB_FILE_LOCATION: str = ""
    # Whether to try adding dummy data
    ADD_DUMMY_DATA: bool
    # Donations (gated at runtime by the `donations_enabled` feature flag)
    STRIPE_API_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_RECURRING_PRODUCT_ID: str
    # Strong verification through Iris ID (gated at runtime by the `strong_verification_enabled` feature flag)
    IRIS_ID_PUBKEY: str
    IRIS_ID_SECRET: str
    VERIFICATION_DATA_PUBLIC_KEY: bytes
    # Postal verification (MyPostcard API; gated at runtime by the `postal_verification_enabled` feature flag)
    MYPOSTCARD_API_KEY: str
    MYPOSTCARD_USERNAME: str
    MYPOSTCARD_PASSWORD: str
    MYPOSTCARD_PRODUCT_CODE: str
    MYPOSTCARD_CAMPAIGN_ID: str
    # SMS (gated at runtime by the `sms_enabled` feature flag)
    SMS_SENDER_ID: str
    # Email
    ENABLE_EMAIL: bool
    # Sender name for outgoing notification emails e.g. "Couchers.org"
    NOTIFICATION_EMAIL_SENDER: str
    # Sender email, e.g. "notify@couchers.org"
    NOTIFICATION_EMAIL_ADDRESS: str
    # An optional prefix for email subject, e.g. [STAGING]
    NOTIFICATION_PREFIX: str = ""
    # Address to send emails about reported users
    REPORTS_EMAIL_RECIPIENT: str
    # Address to send contributor forms when users sign up/fill the form
    CONTRIBUTOR_FORM_EMAIL_RECIPIENT: str
    # Address to moderation notifications
    MODS_EMAIL_RECIPIENT: str
    # SMTP settings
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    # Media server
    ENABLE_MEDIA: bool
    MEDIA_SERVER_SECRET_KEY: bytes
    MEDIA_SERVER_BEARER_TOKEN: str
    MEDIA_SERVER_BASE_URL: str
    MEDIA_SERVER_UPLOAD_BASE_URL: str
    # Bug reporting tool
    BUG_TOOL_ENABLED: bool
    BUG_TOOL_GITHUB_REPO: str
    BUG_TOOL_GITHUB_USERNAME: str
    BUG_TOOL_GITHUB_TOKEN: str
    # Sentry
    SENTRY_ENABLED: bool
    SENTRY_URL: str
    # Push notifications
    PUSH_NOTIFICATIONS_ENABLED: bool
    PUSH_NOTIFICATIONS_VAPID_PRIVATE_KEY: str
    PUSH_NOTIFICATIONS_VAPID_SUBJECT: str
    # Whether to initiate new activeness probes
    ACTIVENESS_PROBES_ENABLED: bool
    # Listmonk (mailing list, gated at runtime by the `listmonk_enabled` feature flag)
    LISTMONK_BASE_URL: str
    LISTMONK_API_USERNAME: str
    LISTMONK_API_KEY: str
    LISTMONK_LIST_ID: int
    # Google recaptcha antibot (gated at runtime by the `recaptcha_enabled` feature flag)
    RECAPTHCA_PROJECT_ID: str
    RECAPTHCA_API_KEY: str
    RECAPTHCA_SITE_KEY: str
    # Whether we're in test
    IN_TEST: bool = False
    # Experimentation (feature flags via GrowthBook)
    EXPERIMENTATION_ENABLED: bool = False
    # When enabled, all feature gates return True (useful for development/testing)
    EXPERIMENTATION_PASS_ALL_GATES: bool = False
    # GrowthBook SDK configuration
    GROWTHBOOK_API_HOST: str = "https://cdn.growthbook.io"
    GROWTHBOOK_CLIENT_KEY: str = ""
    # Disk path for the last-known-good feature payload, used as a cold-start fallback when GrowthBook
    # is unreachable. Required when experimentation is enabled so we never start on in-code defaults.
    GROWTHBOOK_CACHE_PATH: str = ""
    # Continuous profiling (Pyroscope). Profiling is gated at runtime by the `profiling_enabled` feature
    # flag; PYROSCOPE_ENABLED is the per-deployment master switch.
    PYROSCOPE_ENABLED: bool
    PYROSCOPE_SERVER: str
    PYROSCOPE_AUTH_TOKEN: str
    # Moderation auto-approval deadline in seconds (0 to disable auto-approval)
    MODERATION_AUTO_APPROVE_DEADLINE_SECONDS: int
    # User ID of the bot user for automated moderation actions
    MODERATION_BOT_USER_ID: int
    # Enable development APIs (e.g., SendDevPushNotification)
    ENABLE_DEV_APIS: bool
    # Slack notifications
    SLACK_ENABLED: bool
    SLACK_BOT_TOKEN: str
    SLACK_DONATIONS_CHANNEL: str
    SLACK_MERCH_CHANNEL: str

    def __init__(self) -> None:
        # Initialize instance attributes with default values from class attributes.
        for var_name in Config.__annotations__.keys():
            try:
                default_value = getattr(Config, var_name)
            except AttributeError:
                continue
            self.__setattr__(var_name, default_value)

    def copy_from(self, other: Config) -> None:
        for var_name in Config.__annotations__.keys():
            try:
                attr_value = other.__getattribute__(var_name)
            except AttributeError:
                try:
                    self.__delattr__(var_name)
                except AttributeError:
                    pass
                continue
            self.__setattr__(var_name, attr_value)

    def copy(self) -> Config:
        copy = Config()
        copy.copy_from(self)
        return copy

    def check(self) -> None:
        """Checks that the config is valid, i.e., all required values are set to valid values."""
        for attr_name in Config.__annotations__.keys():
            if not hasattr(self, attr_name):
                raise ValueError(f"Config value {attr_name} not set")

        if not self.DEV:
            # checks for prod
            if "https" not in self.BASE_URL:
                raise Exception("Production site must be over HTTPS")
            if not self.ENABLE_EMAIL:
                raise Exception("Production site must have email enabled")
            if self.IN_TEST:
                raise Exception("IN_TEST while not DEV")

            # Donations are gated at runtime by the `donations_enabled` feature flag, which can be flipped on
            # remotely at any time, so prod must always have Stripe credentials present so the feature can run.
            if not self.STRIPE_API_KEY or not self.STRIPE_WEBHOOK_SECRET or not self.STRIPE_RECURRING_PRODUCT_ID:
                raise Exception("Stripe credentials must be configured in production")

            # Listmonk is gated at runtime by the `listmonk_enabled` feature flag, which can be flipped on
            # remotely at any time, so prod must always have the Listmonk credentials present.
            if (
                not self.LISTMONK_BASE_URL
                or not self.LISTMONK_API_USERNAME
                or not self.LISTMONK_API_KEY
                or not self.LISTMONK_LIST_ID
            ):
                raise Exception("Listmonk credentials must be configured in production")

            # The following features are gated at runtime by feature flags (`strong_verification_enabled`,
            # `postal_verification_enabled`, `recaptcha_enabled`), which can be flipped on remotely at any
            # time, so prod must always have their credentials present.
            if not self.IRIS_ID_PUBKEY or not self.IRIS_ID_SECRET or not self.VERIFICATION_DATA_PUBLIC_KEY:
                raise Exception("Iris ID credentials must be configured in production")
            if (
                not self.MYPOSTCARD_API_KEY
                or not self.MYPOSTCARD_USERNAME
                or not self.MYPOSTCARD_PASSWORD
                or not self.MYPOSTCARD_PRODUCT_CODE
                or not self.MYPOSTCARD_CAMPAIGN_ID
            ):
                raise Exception("MyPostcard API credentials must be configured in production")
            if not self.RECAPTHCA_PROJECT_ID or not self.RECAPTHCA_API_KEY or not self.RECAPTHCA_SITE_KEY:
                raise Exception("reCAPTCHA credentials must be configured in production")

        if self.EXPERIMENTATION_ENABLED:
            if not self.GROWTHBOOK_CLIENT_KEY:
                raise Exception("No GrowthBook client key but experimentation enabled")
            if not self.GROWTHBOOK_CACHE_PATH:
                raise Exception("No GrowthBook cache path but experimentation enabled")

        if self.PYROSCOPE_ENABLED:
            if not self.PYROSCOPE_SERVER or not self.PYROSCOPE_AUTH_TOKEN:
                raise Exception("No Pyroscope server or auth token but profiling enabled")

    def load_from_env(self, env: Mapping[str, str]) -> None:
        """Populates this config object from environment variables."""
        for var_name, var_type in Config.__annotations__.items():
            env_value = env.get(var_name)
            if env_value is None:
                continue

            attr_value: Any
            if var_type is str:
                attr_value = env_value
            elif var_type is int:
                if not env_value.isdigit():
                    raise ValueError(f"Invalid int for {var_name}")
                attr_value = int(env_value)
            elif var_type is bool:
                # 1 is true, 0 is false, everything else is illegal
                if env_value not in ("0", "1"):
                    raise ValueError(f'Invalid bool for {var_name}, need "0" or "1"')
                attr_value = env_value == "1"
            elif var_type is bytes:
                # decode from hex
                attr_value = bytes.fromhex(env_value)
            # mypy erroneously reports an error below (https://github.com/python/mypy/issues/15630)
            elif typing.get_origin(var_type) is Literal:  # type: ignore[comparison-overlap]
                # list of allowed string values
                options = typing.get_args(var_type)
                if env_value not in options:
                    raise ValueError(f"Invalid value for {var_name}, need one of {', '.join(options)}")
                attr_value = env_value
            else:
                raise ValueError(f"Unsupported config type {var_type} for {var_name}")

            self.__setattr__(var_name, attr_value)

    # Weakly typed dict-like interface using env var names for backcompat.

    def __getitem__(self, key: str) -> Any:
        """Weakly-typed indexer access using env var names for backcompat."""
        if Config.__annotations__.get(key) is None:
            raise KeyError(f"No such config key: {key}.")

        try:
            return self.__getattribute__(key)
        except AttributeError:
            raise KeyError(f"Config key undefined and has no default: {key}.") from None

    def __setitem__(self, key: str, value: Any) -> None:
        """Weakly-typed indexer access using env var names for backcompat."""
        var_type = Config.__annotations__.get(key)
        if var_type is None:
            raise KeyError(f"No such config key: {key}.")

        if typing.get_origin(var_type) is Literal:  # type: ignore[comparison-overlap]
            options = typing.get_args(var_type)
            if value not in options:
                raise ValueError(f"Invalid value for {key}, need one of {', '.join(options)}")
        elif not isinstance(value, var_type):
            raise TypeError(f"Invalid type for {key}: expected {var_type}, got {type(value)}")

        self.__setattr__(key, value)

    def __delitem__(self, key: str) -> None:
        """Weakly-typed indexer access using env var names for backcompat."""
        self.__delattr__(key)

    def get(self, key: str, default: Any = None) -> Any:
        """Weakly-typed indexer access using env var names for backcompat."""
        try:
            return self.__getitem__(key)
        except KeyError:
            return default


config = Config()
config.load_from_env(os.environ)
