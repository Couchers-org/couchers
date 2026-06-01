"""
A simple config system
"""

import os
import typing
from collections.abc import Mapping
from typing import Any, Literal


# Not a dataclass. Not all attributes must be initialized.
class Config:
    # Whether we're in dev mode
    dev: bool
    # Whether we're `api` mode (answering API queries) or `scheduler` (scheduling background jobs), or `worker`
    # (servicing background jobs). Can also be set to `all` to do all three simultaneously
    role: Literal["api", "scheduler", "worker", "all"] = "all"
    # number of bg worker processes, requires worker or all above
    background_worker_count: int = 2
    # Version string
    version: str = "unknown"
    # ISO 8601 timestamp of the deployed commit (CI_COMMIT_TIMESTAMP), empty outside CI builds
    commit_timestamp: str = ""
    # Base URL of frontend, e.g. https://couchers.org
    base_url: str
    # URL of the backend, e.g. https://api.couchers.org
    backend_base_url: str
    # URL of the console, e.g. https://console.couchers.org
    console_base_url: str
    # URL of the merch shop, e.g. https://shop.couchershq.org
    merch_shop_url: str
    # Used to generate a variety of secrets
    secret: bytes
    # Domain that cookies should set as their domain value
    cookie_domain: str
    # SQLAlchemy database connection string
    database_connection_string: str
    # OpenTelemetry endpoint to send traces to
    opentelemetry_endpoint: str = ""
    # Path to a GeoLite2-City.mmdb file for geocoding IPs in user session info
    geolite2_city_mmdb_file_location: str = ""
    geolite2_asn_mmdb_file_location: str = ""
    # Whether to try adding dummy data
    add_dummy_data: bool
    # Donations (gated at runtime by the `donations_enabled` feature flag)
    stripe_api_key: str
    stripe_webhook_secret: str
    stripe_recurring_product_id: str
    # Strong verification through Iris ID (gated at runtime by the `strong_verification_enabled` feature flag)
    iris_id_pubkey: str
    iris_id_secret: str
    verification_data_public_key: bytes
    # Postal verification (MyPostcard API; gated at runtime by the `postal_verification_enabled` feature flag)
    mypostcard_api_key: str
    mypostcard_username: str
    mypostcard_password: str
    mypostcard_product_code: str
    mypostcard_campaign_id: str
    # SMS (gated at runtime by the `sms_enabled` feature flag)
    sms_sender_id: str
    # Email
    enable_email: bool
    # Sender name for outgoing notification emails e.g. "Couchers.org"
    notification_email_sender: str
    # Sender email, e.g. "notify@couchers.org"
    notification_email_address: str
    # An optional prefix for email subject, e.g. [STAGING]
    notification_prefix: str = ""
    # Address to send emails about reported users
    reports_email_recipient: str
    # Address to send contributor forms when users sign up/fill the form
    contributor_form_email_recipient: str
    # Address to moderation notifications
    mods_email_recipient: str
    # SMTP settings
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    # Media server
    enable_media: bool
    media_server_secret_key: bytes
    media_server_bearer_token: str
    media_server_base_url: str
    media_server_upload_base_url: str
    # Bug reporting tool
    bug_tool_enabled: bool
    bug_tool_github_repo: str
    bug_tool_github_username: str
    bug_tool_github_token: str
    # Sentry
    sentry_enabled: bool
    sentry_url: str
    # Push notifications
    push_notifications_enabled: bool
    push_notifications_vapid_private_key: str
    push_notifications_vapid_subject: str
    # Whether to initiate new activeness probes
    activeness_probes_enabled: bool
    # Listmonk (mailing list, gated at runtime by the `listmonk_enabled` feature flag)
    listmonk_base_url: str
    listmonk_api_username: str
    listmonk_api_key: str
    listmonk_list_id: int
    # Google recaptcha antibot (gated at runtime by the `recaptcha_enabled` feature flag)
    recapthca_project_id: str
    recapthca_api_key: str
    recapthca_site_key: str
    # Whether we're in test
    in_test: bool = False
    # Experimentation (feature flags via GrowthBook)
    experimentation_enabled: bool = False
    # When enabled, all feature gates return True (useful for development/testing)
    experimentation_pass_all_gates: bool = False
    # GrowthBook SDK configuration
    growthbook_api_host: str = "https://cdn.growthbook.io"
    growthbook_client_key: str = ""
    # Disk path for the last-known-good feature payload, used as a cold-start fallback when GrowthBook
    # is unreachable. Required when experimentation is enabled so we never start on in-code defaults.
    growthbook_cache_path: str = ""
    # Continuous profiling (Pyroscope). Profiling is gated at runtime by the `profiling_enabled` feature
    # flag; PYROSCOPE_ENABLED is the per-deployment master switch.
    pyroscope_enabled: bool
    pyroscope_server: str
    pyroscope_auth_token: str
    # Moderation auto-approval deadline in seconds (0 to disable auto-approval)
    moderation_auto_approve_deadline_seconds: int
    # User ID of the bot user for automated moderation actions
    moderation_bot_user_id: int
    # Enable development APIs (e.g., SendDevPushNotification)
    enable_dev_apis: bool
    # Slack notifications
    slack_enabled: bool
    slack_bot_token: str
    slack_donations_channel: str
    slack_merch_channel: str

    def __init__(self) -> None:
        # Initialize instance attributes with default values from class attributes.
        for attr_name in Config.__annotations__.keys():
            try:
                default_value = getattr(Config, attr_name)
            except AttributeError:
                continue
            self.__setattr__(attr_name, default_value)

    def __getitem__(self, key: str) -> Any:
        """Weakly-typed indexer access using env var names for backcompat."""
        attr_name = key.lower()
        if Config.__annotations__.get(attr_name) is None:
            raise KeyError(f"No such config key: {key}.")

        try:
            return self.__getattribute__(attr_name)
        except AttributeError:
            raise KeyError(f"Config key undefined and has no default: {key}.") from None

    def __setitem__(self, key: str, value: Any) -> None:
        """Weakly-typed indexer access using env var names for backcompat."""
        attr_name = key.lower()
        attr_type = Config.__annotations__.get(attr_name)
        if attr_type is None:
            raise KeyError(f"No such config key: {key}.")

        if typing.get_origin(attr_type) is Literal:  # type: ignore[comparison-overlap]
            options = typing.get_args(attr_type)
            if value not in options:
                raise ValueError(f"Invalid value for {key}, need one of {', '.join(options)}")
        elif not isinstance(value, attr_type):
            raise TypeError(f"Invalid type for {key}: expected {attr_type}, got {type(value)}")

        self.__setattr__(attr_name, value)

    def get(self, key: str, default: Any = None) -> Any:
        """Weakly-typed indexer access using env var names for backcompat."""
        attr_name = key.lower()
        try:
            return self.__getitem__(attr_name)
        except KeyError:
            return default

    def copy(self) -> Config:
        copy = Config()
        copy.copy_from(self)
        return copy

    def copy_from(self, other: Config) -> None:
        for attr_name in Config.__annotations__.keys():
            try:
                attr_value = other.__getattribute__(attr_name)
            except AttributeError:
                try:
                    self.__delattr__(attr_name)
                except AttributeError:
                    pass
                continue
            self.__setattr__(attr_name, attr_value)

    def check(self) -> None:
        """Checks that the config is valid, i.e., all required values are set to valid values."""
        for attr_name in Config.__annotations__.keys():
            if not hasattr(self, attr_name):
                raise ValueError(f"Config value {attr_name} not set")

        if not self.dev:
            # checks for prod
            if "https" not in self.base_url:
                raise Exception("Production site must be over HTTPS")
            if not self.enable_email:
                raise Exception("Production site must have email enabled")
            if self.in_test:
                raise Exception("IN_TEST while not DEV")

            # Donations are gated at runtime by the `donations_enabled` feature flag, which can be flipped on
            # remotely at any time, so prod must always have Stripe credentials present so the feature can run.
            if not self.stripe_api_key or not self.stripe_webhook_secret or not self.stripe_recurring_product_id:
                raise Exception("Stripe credentials must be configured in production")

            # Listmonk is gated at runtime by the `listmonk_enabled` feature flag, which can be flipped on
            # remotely at any time, so prod must always have the Listmonk credentials present.
            if (
                not self.listmonk_base_url
                or not self.listmonk_api_username
                or not self.listmonk_api_key
                or not self.listmonk_list_id
            ):
                raise Exception("Listmonk credentials must be configured in production")

            # The following features are gated at runtime by feature flags (`strong_verification_enabled`,
            # `postal_verification_enabled`, `recaptcha_enabled`), which can be flipped on remotely at any
            # time, so prod must always have their credentials present.
            if not self.iris_id_pubkey or not self.iris_id_secret or not self.verification_data_public_key:
                raise Exception("Iris ID credentials must be configured in production")
            if (
                not self.mypostcard_api_key
                or not self.mypostcard_username
                or not self.mypostcard_password
                or not self.mypostcard_product_code
                or not self.mypostcard_campaign_id
            ):
                raise Exception("MyPostcard API credentials must be configured in production")
            if not self.recapthca_project_id or not self.recapthca_api_key or not self.recapthca_site_key:
                raise Exception("reCAPTCHA credentials must be configured in production")

        if self.experimentation_enabled:
            if not self.growthbook_client_key:
                raise Exception("No GrowthBook client key but experimentation enabled")
            if not self.growthbook_cache_path:
                raise Exception("No GrowthBook cache path but experimentation enabled")

        if self.pyroscope_enabled:
            if not self.pyroscope_server or not self.pyroscope_auth_token:
                raise Exception("No Pyroscope server or auth token but profiling enabled")

    def load_from_env(self, env: Mapping[str, str]) -> None:
        """Populates this config object from environment variables."""
        for attr_name, attr_type in Config.__annotations__.items():
            env_name = attr_name.upper()
            env_value = env.get(env_name)
            if env_value is None:
                continue

            attr_value: Any
            if attr_type is str:
                attr_value = env_value
            elif attr_type is int:
                if not env_value.isdigit():
                    raise ValueError(f"Invalid int for {env_name}")
                attr_value = int(env_value)
            elif attr_type is bool:
                # 1 is true, 0 is false, everything else is illegal
                if env_value not in ("0", "1"):
                    raise ValueError(f'Invalid bool for {env_name}, need "0" or "1"')
                attr_value = env_value == "1"
            elif attr_type is bytes:
                # decode from hex
                attr_value = bytes.fromhex(env_value)
            # mypy erroneously reports an error below (https://github.com/python/mypy/issues/15630)
            elif typing.get_origin(attr_type) is Literal:  # type: ignore[comparison-overlap]
                # list of allowed string values
                options = typing.get_args(attr_type)
                if env_value not in options:
                    raise ValueError(f"Invalid value for {env_name}, need one of {', '.join(options)}")
                attr_value = env_value
            else:
                raise ValueError(f"Unsupported config type {attr_type} for {env_name}")

            self.__setattr__(attr_name, attr_value)


config = Config()
config.load_from_env(os.environ)
