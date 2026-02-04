import enum
from datetime import datetime
from typing import TYPE_CHECKING

from google.protobuf import empty_pb2
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy import LargeBinary as Binary
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from couchers.constants import DATETIME_INFINITY
from couchers.models import ModerationState
from couchers.models.base import Base
from couchers.proto import notification_data_pb2

if TYPE_CHECKING:
    from couchers.models import User


class NotificationDeliveryType(enum.Enum):
    # send push notification to mobile/web
    push = enum.auto()
    # send individual email immediately
    email = enum.auto()
    # send in digest
    digest = enum.auto()


dt = NotificationDeliveryType
nd = notification_data_pb2
dt_sec = [dt.email, dt.push]
dt_all = [dt.email, dt.push, dt.digest]
dt_empty: list[NotificationDeliveryType] = []


class NotificationTopicAction(enum.Enum):
    """
    Identifies a type of notification by the topic it relates to and the action triggered.
    The grouping by topic allows users to unsubscribe from notifications in two ways:
    - All notifications of a certain type (topic+action), e.g. all friend requests.
    - All notifications about a certain instance of a topic,
      e.g. all notifications about an event, where the key is the event id.
    """

    def __init__(
        self, topic_action: str, defaults: list[NotificationDeliveryType], user_editable: bool, data_type: type
    ) -> None:
        self.topic, self.action = topic_action.split(":")
        self.defaults = defaults
        self.user_editable = user_editable

        self.data_type = data_type

    def unpack(self) -> tuple[str, str]:
        return self.topic, self.action

    @property
    def display(self) -> str:
        return f"{self.topic}:{self.action}"

    @property
    def is_critical(self) -> bool:
        """Whether the notification is critical cannot be disabled."""
        return not self.user_editable

    def __str__(self) -> str:
        return self.display

    # topic, action, default delivery types
    friend_request__create = ("friend_request:create", dt_all, True, nd.FriendRequestCreate)
    friend_request__accept = ("friend_request:accept", dt_all, True, nd.FriendRequestAccept)

    # host requests
    host_request__create = ("host_request:create", dt_all, True, nd.HostRequestCreate)
    host_request__accept = ("host_request:accept", dt_all, True, nd.HostRequestAccept)
    host_request__reject = ("host_request:reject", dt_all, True, nd.HostRequestReject)
    host_request__confirm = ("host_request:confirm", dt_all, True, nd.HostRequestConfirm)
    host_request__cancel = ("host_request:cancel", dt_all, True, nd.HostRequestCancel)
    host_request__message = ("host_request:message", [dt.push, dt.digest], True, nd.HostRequestMessage)
    host_request__missed_messages = ("host_request:missed_messages", [dt.email], True, nd.HostRequestMissedMessages)
    host_request__reminder = ("host_request:reminder", dt_all, True, nd.HostRequestReminder)

    activeness__probe = ("activeness:probe", dt_sec, False, nd.ActivenessProbe)

    # you receive a friend ref
    reference__receive_friend = ("reference:receive_friend", dt_all, True, nd.ReferenceReceiveFriend)
    # you receive a reference from ... the host
    reference__receive_hosted = ("reference:receive_hosted", dt_all, True, nd.ReferenceReceiveHostRequest)
    # ... the surfer
    reference__receive_surfed = ("reference:receive_surfed", dt_all, True, nd.ReferenceReceiveHostRequest)

    # you hosted
    reference__reminder_hosted = ("reference:reminder_hosted", dt_all, True, nd.ReferenceReminder)
    # you surfed
    reference__reminder_surfed = ("reference:reminder_surfed", dt_all, True, nd.ReferenceReminder)

    badge__add = ("badge:add", [dt.push, dt.digest], True, nd.BadgeAdd)
    badge__remove = ("badge:remove", [dt.push, dt.digest], True, nd.BadgeRemove)

    # group chats
    chat__message = ("chat:message", [dt.push, dt.digest], True, nd.ChatMessage)
    chat__missed_messages = ("chat:missed_messages", [dt.email], True, nd.ChatMissedMessages)

    # events
    # approved by mods
    event__create_approved = ("event:create_approved", dt_all, True, nd.EventCreate)
    # any user creates any event, default to no notifications
    event__create_any = ("event:create_any", dt_empty, True, nd.EventCreate)
    event__update = ("event:update", dt_all, True, nd.EventUpdate)
    event__cancel = ("event:cancel", dt_all, True, nd.EventCancel)
    event__delete = ("event:delete", dt_all, True, nd.EventDelete)
    event__invite_organizer = ("event:invite_organizer", dt_all, True, nd.EventInviteOrganizer)
    event__reminder = ("event:reminder", dt_all, True, nd.EventReminder)
    # toplevel comment on an event
    event__comment = ("event:comment", dt_all, True, nd.EventComment)

    # discussion created
    discussion__create = ("discussion:create", [dt.digest], True, nd.DiscussionCreate)
    # someone comments on your discussion
    discussion__comment = ("discussion:comment", dt_all, True, nd.DiscussionComment)

    # someone responds to any of your top-level comment across the platform
    thread__reply = ("thread:reply", dt_all, True, nd.ThreadReply)

    # account settings
    password__change = ("password:change", dt_sec, False, empty_pb2.Empty)
    email_address__change = ("email_address:change", dt_sec, False, nd.EmailAddressChange)
    email_address__verify = ("email_address:verify", dt_sec, False, empty_pb2.Empty)
    phone_number__change = ("phone_number:change", dt_sec, False, nd.PhoneNumberChange)
    phone_number__verify = ("phone_number:verify", dt_sec, False, nd.PhoneNumberVerify)
    # reset password
    password_reset__start = ("password_reset:start", dt_sec, False, nd.PasswordResetStart)
    password_reset__complete = ("password_reset:complete", dt_sec, False, empty_pb2.Empty)

    # account deletion
    account_deletion__start = ("account_deletion:start", dt_sec, False, nd.AccountDeletionStart)
    # no more pushing to do
    account_deletion__complete = ("account_deletion:complete", dt_sec, False, nd.AccountDeletionComplete)
    # undeleted
    account_deletion__recovered = ("account_deletion:recovered", dt_sec, False, empty_pb2.Empty)

    # admin actions
    gender__change = ("gender:change", dt_sec, False, nd.GenderChange)
    birthdate__change = ("birthdate:change", dt_sec, False, nd.BirthdateChange)
    api_key__create = ("api_key:create", dt_sec, False, nd.ApiKeyCreate)

    donation__received = ("donation:received", dt_sec, False, nd.DonationReceived)

    onboarding__reminder = ("onboarding:reminder", dt_sec, True, empty_pb2.Empty)

    modnote__create = ("modnote:create", dt_sec, False, empty_pb2.Empty)

    verification__sv_fail = ("verification:sv_fail", dt_sec, False, nd.VerificationSVFail)
    verification__sv_success = ("verification:sv_success", dt_sec, False, empty_pb2.Empty)

    # postal verification
    postal_verification__postcard_sent = (
        "postal_verification:postcard_sent",
        dt_sec,
        False,
        nd.PostalVerificationPostcardSent,
    )
    postal_verification__success = ("postal_verification:success", dt_sec, False, empty_pb2.Empty)
    postal_verification__failed = ("postal_verification:failed", dt_sec, False, nd.PostalVerificationFailed)

    # general announcements
    general__new_blog_post = ("general:new_blog_post", [dt.push, dt.digest], True, nd.GeneralNewBlogPost)


class NotificationPreference(Base, kw_only=True):
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    topic_action: Mapped[NotificationTopicAction] = mapped_column(Enum(NotificationTopicAction))
    delivery_type: Mapped[NotificationDeliveryType] = mapped_column(Enum(NotificationDeliveryType))
    deliver: Mapped[bool] = mapped_column(Boolean)

    user: Mapped[User] = relationship(init=False, foreign_keys="NotificationPreference.user_id")

    __table_args__ = (UniqueConstraint("user_id", "topic_action", "delivery_type"),)


class Notification(Base, kw_only=True):
    """
    Table for accumulating notifications until it is time to send email digest
    """

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # recipient user id
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    topic_action: Mapped[NotificationTopicAction] = mapped_column(Enum(NotificationTopicAction))
    key: Mapped[str] = mapped_column(String)

    data: Mapped[bytes] = mapped_column(Binary)

    # whether the user has marked this notification as seen or not
    is_seen: Mapped[bool] = mapped_column(Boolean, server_default=expression.false(), init=False)

    # optional link to moderation state for content that requires moderation approval
    # if set, notification delivery is deferred until content becomes VISIBLE/UNLISTED
    moderation_state_id: Mapped[int | None] = mapped_column(
        ForeignKey("moderation_states.id"), default=None, index=True
    )

    user: Mapped[User] = relationship(init=False, foreign_keys="Notification.user_id")
    moderation_state: Mapped[ModerationState] = relationship(
        init=False, foreign_keys="Notification.moderation_state_id"
    )

    __table_args__ = (
        # used in looking up which notifications need delivery
        Index(
            "ix_notifications_created",
            created,
        ),
        # Fast lookup for unseen notification count
        Index(
            "ix_notifications_unseen",
            user_id,
            topic_action,
            postgresql_where=(is_seen == False),
        ),
        # Fast lookup for latest notifications
        Index(
            "ix_notifications_latest",
            user_id,
            id.desc(),
            topic_action,
        ),
    )

    @property
    def topic(self) -> str:
        return self.topic_action.topic

    @property
    def action(self) -> str:
        return self.topic_action.action


class NotificationDelivery(Base, kw_only=True):
    __tablename__ = "notification_deliveries"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    notification_id: Mapped[int] = mapped_column(ForeignKey("notifications.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    delivered: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    read: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    # todo: enum of "phone, web, digest"
    delivery_type: Mapped[NotificationDeliveryType] = mapped_column(Enum(NotificationDeliveryType))
    # todo: device id
    # todo: receipt id, etc
    notification: Mapped[Notification] = relationship(init=False, foreign_keys="NotificationDelivery.notification_id")

    __table_args__ = (
        UniqueConstraint("notification_id", "delivery_type"),
        # used in looking up which notifications need delivery
        Index(
            "ix_notification_deliveries_delivery_type",
            delivery_type,
            postgresql_where=(delivered != None),
        ),
        Index(
            "ix_notification_deliveries_dt_ni_dnull",
            delivery_type,
            notification_id,
            delivered == None,
        ),
    )


class DeviceType(enum.Enum):
    ios = enum.auto()
    android = enum.auto()


class PushNotificationPlatform(enum.Enum):
    web_push = enum.auto()
    expo = enum.auto()


class PushNotificationDeliveryOutcome(enum.Enum):
    success = enum.auto()
    # transient failure, will retry
    transient_failure = enum.auto()
    # message can't be delivered (e.g. too long), but subscription is fine
    permanent_message_failure = enum.auto()
    # subscription is broken (e.g. device unregistered), was disabled
    permanent_subscription_failure = enum.auto()


class PushNotificationSubscription(Base, kw_only=True):
    __tablename__ = "push_notification_subscriptions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    # which user this is connected to
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    platform: Mapped[PushNotificationPlatform] = mapped_column(Enum(PushNotificationPlatform))

    ## platform specific: web_push
    # these come from https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription
    # the endpoint
    endpoint: Mapped[str | None] = mapped_column(String, default=None)
    # the "auth" key
    auth_key: Mapped[bytes | None] = mapped_column(Binary, default=None)
    # the "p256dh" key
    p256dh_key: Mapped[bytes | None] = mapped_column(Binary, default=None)

    full_subscription_info: Mapped[str | None] = mapped_column(String, default=None)

    # the browser user-agent, so we can tell the user what browser notifications are going to
    user_agent: Mapped[str | None] = mapped_column(String, default=None)

    ## platform specific: expo
    token: Mapped[str | None] = mapped_column(String, unique=True, index=True, default=None)
    device_name: Mapped[str | None] = mapped_column(String, default=None)
    device_type: Mapped[DeviceType | None] = mapped_column(Enum(DeviceType), default=None)

    # when it was disabled
    disabled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=DATETIME_INFINITY.isoformat(), init=False
    )

    user: Mapped[User] = relationship(init=False)

    __table_args__ = (
        # web_push platform requires: endpoint, auth_key, p256dh_key, full_subscription_info
        # expo platform requires: token
        CheckConstraint(
            """
            (platform = 'web_push' AND endpoint IS NOT NULL AND auth_key IS NOT NULL AND p256dh_key IS NOT NULL AND full_subscription_info IS NOT NULL AND token IS NULL)
            OR
            (platform = 'expo' AND token IS NOT NULL AND endpoint IS NULL AND auth_key IS NULL AND p256dh_key IS NULL AND full_subscription_info IS NULL)
            """,
            name="platform_columns",
        ),
    )


class PushNotificationDeliveryAttempt(Base, kw_only=True):
    __tablename__ = "push_notification_delivery_attempt"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    push_notification_subscription_id: Mapped[int] = mapped_column(
        ForeignKey("push_notification_subscriptions.id"), index=True
    )

    outcome: Mapped[PushNotificationDeliveryOutcome] = mapped_column(Enum(PushNotificationDeliveryOutcome))
    # the HTTP status code, 201 is success, or similar for other platforms
    status_code: Mapped[int | None] = mapped_column(Integer, default=None)

    # can be null if it was a success
    response: Mapped[str | None] = mapped_column(String, default=None)

    # Expo-specific: ticket ID for receipt checking
    expo_ticket_id: Mapped[str | None] = mapped_column(String, default=None)

    # Receipt check results (populated by delayed job)
    receipt_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    receipt_status: Mapped[str | None] = mapped_column(String, default=None)  # "ok" or "error"
    receipt_error_code: Mapped[str | None] = mapped_column(String, default=None)  # e.g., "DeviceNotRegistered"

    push_notification_subscription: Mapped[PushNotificationSubscription] = relationship(init=False)
