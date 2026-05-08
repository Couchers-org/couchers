"""
A simple config system
"""

import dataclasses
import os
import typing
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, ClassVar, Literal, Self


class ConfigMetaclass(type):
    _current: Config | None = None

    @property
    def current(cls) -> Config:
        """Gets the current application-global Config object, raising an exception if not yet set."""
        if cls._current is None:
            raise Exception("No global configuration set.")
        return cls._current

    @current.setter
    def current(cls, value: Config | None) -> None:
        cls._current = value


@dataclasses.dataclass(kw_only=True)
class Config(metaclass=ConfigMetaclass):
    # Whether we're in dev mode
    dev: bool
    # Whether we're `api` mode (answering API queries) or `scheduler` (scheduling background jobs), or `worker`
    # (servicing background jobs). Can also be set to `all` to do all three simultaneously
    role: Literal["api", "scheduler", "worker", "all"] = "all"
    # number of bg worker processes, requires worker or all above
    background_worker_count: int = 2
    # Version string
    version: str = "unknown"
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
    # Donations
    enable_donations: bool
    stripe_api_key: str
    stripe_webhook_secret: str
    stripe_recurring_product_id: str
    # Strong verification through Iris ID
    enable_strong_verification: bool
    iris_id_pubkey: str
    iris_id_secret: str
    verification_data_public_key: bytes
    # Postal verification
    enable_postal_verification: bool
    # MyPostcard API credentials
    mypostcard_api_key: str
    mypostcard_username: str
    mypostcard_password: str
    mypostcard_product_code: str
    mypostcard_campaign_id: str
    # SMS
    enable_sms: bool
    sms_sender_id: str
    # Email
    enable_email: bool
    # Sender name for outgoing notification emails e.g. "Couchers.org"
    notification_email_sender: str
    # Sender email, e.g. "notify@couchers.org"
    notification_email_address: str
    # An optional prefix for email subject, e.g. [STAGING]
    notification_prefix: str = ""
    enable_notification_translations: bool
    enable_email_ics_attachments: bool
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
    # Listmonk (mailing list)
    listmonk_enabled: bool
    listmonk_base_url: str
    listmonk_api_username: str
    listmonk_api_key: str
    listmonk_list_id: int
    # Google recaptcha antibot
    recapthca_enabled: bool
    recapthca_project_id: str
    recapthca_api_key: str
    recapthca_site_key: str
    # Whether we're in test
    in_test: bool = False
    # Experimentation (feature flags via Statsig)
    experimentation_enabled: bool = False
    # When enabled, all feature gates return True (useful for development/testing)
    experimentation_pass_all_gates: bool = False
    # Statsig SDK configuration
    statsig_server_secret_key: str = ""
    statsig_environment: str = "development"
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

    if TYPE_CHECKING:
        # The metaclass implements the "current" class property,
        # but mypy doesn't understand that, so give it a hint.
        current: ClassVar[Config]

    def __post_init__(self) -> None:
        self.check()

    def copy(self) -> Self:
        return dataclasses.replace(self)

    def with_changes(self, **changes: Any) -> Config:
        return dataclasses.replace(self, **changes)

    def set_from(self, other: Config) -> None:
        for field in dataclasses.fields(other):
            setattr(self, field.name, getattr(other, field.name))

    def check(self) -> None:
        if not self.dev:
            # checks for prod
            if "https" not in self.base_url:
                raise Exception("Production site must be over HTTPS")
            if not self.enable_email:
                raise Exception("Production site must have email enabled")
            if not self.enable_sms:
                raise Exception("Production site must have SMS enabled")
            if self.in_test:
                raise Exception("IN_TEST while not DEV")

        if self.enable_donations:
            if not self.stripe_api_key or not self.stripe_webhook_secret or not self.stripe_recurring_product_id:
                raise Exception("No Stripe API key/recurring donation ID but donations enabled")

        if self.enable_strong_verification:
            if not self.iris_id_pubkey or not self.iris_id_secret or not self.verification_data_public_key:
                raise Exception("No Iris ID pubkey/secret or verification data pubkey but strong verification enabled")

        if self.enable_postal_verification:
            if (
                not self.mypostcard_api_key
                or not self.mypostcard_username
                or not self.mypostcard_password
                or not self.mypostcard_product_code
                or not self.mypostcard_campaign_id
            ):
                raise Exception("MyPostcard API credentials not configured but postal verification enabled")

        if self.experimentation_enabled:
            if not self.statsig_server_secret_key:
                raise Exception("No Statsig server secret key but experimentation enabled")

    @staticmethod
    def from_env() -> Config:
        return Config.from_env_dict(os.environ)

    @staticmethod
    def from_env_dict(env: Mapping[str, Any]) -> Config:
        type_hints = typing.get_type_hints(Config)
        kwargs: dict[str, object] = {}

        for field in dataclasses.fields(Config):
            env_name = field.name.upper()
            field_type = type_hints[field.name]
            has_default = field.default is not dataclasses.MISSING

            raw = env.get(env_name)
            if not raw:
                if not has_default:
                    raise ValueError(f"Required config value {env_name} not set")
                kwargs[field.name] = field.default
                continue

            origin = typing.get_origin(field_type)
            if origin is Literal:
                allowed = typing.get_args(field_type)
                if raw not in allowed:
                    raise ValueError(f"Invalid value for {env_name}, need one of {', '.join(allowed)}")
                kwargs[field.name] = raw
            elif field_type is bool:
                if raw not in ("0", "1"):
                    raise ValueError(f'Invalid bool for {env_name}, need "0" or "1"')
                kwargs[field.name] = raw == "1"
            elif field_type is bytes:
                kwargs[field.name] = bytes.fromhex(raw)
            elif field_type is int:
                kwargs[field.name] = int(raw)
            elif field_type is str:
                kwargs[field.name] = raw
            else:
                raise ValueError(f"Unknown type {field_type} for {env_name}")

        return Config(**kwargs)  # type: ignore[arg-type]
