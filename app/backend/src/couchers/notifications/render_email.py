import logging
from dataclasses import dataclass, field
from typing import Any, assert_never

import couchers.email.emails as emails
from couchers import urls
from couchers.config import config
from couchers.email.calendar_events import create_host_request_attachment, create_host_request_cancellation_attachment
from couchers.email.rendering import (
    EmailFooter,
    UnsubscribeInfo,
    UnsubscribeLink,
    render_html_body,
    render_plaintext_body,
)
from couchers.i18n import LocalizationContext
from couchers.models import Notification, NotificationTopicAction, User
from couchers.notifications.quick_links import (
    can_unsubscribe_topic_key,
    generate_do_not_email,
    generate_unsub_topic_action,
    generate_unsub_topic_key,
)
from couchers.proto import api_pb2
from couchers.proto.internal.jobs_pb2 import EmailAttachmentV2
from couchers.utils import now

logger = logging.getLogger(__name__)


@dataclass(kw_only=True, slots=True)
class RenderedEmailNotification:
    subject: str
    body_plaintext: str
    body_html: str | None
    source_data: str | None
    list_unsubscribe_header: str | None
    attachments: list[EmailAttachmentV2] = field(default_factory=list)


def render_email_notification(
    user: User, notification: Notification, loc_context: LocalizationContext, *, include_ics_attachments: bool
) -> RenderedEmailNotification:
    email = _notification_to_email(notification, user_name=user.name)
    subject = email.get_subject_line(loc_context)
    preview = email.get_preview_line(loc_context)
    body_blocks = email.get_body_blocks(loc_context)
    footer = get_email_footer(user, notification, loc_context)
    body_plaintext = render_plaintext_body(blocks=body_blocks, footer=footer, loc_context=loc_context)
    body_html = render_html_body(
        subject=subject, preview=preview, blocks=body_blocks, footer=footer, loc_context=loc_context
    )
    source_data = f"notification; topic-action={notification.topic_action}; version={config.VERSION}"

    list_unsubscribe_header = get_list_unsubscribe_header(notification)
    if include_ics_attachments:
        attachment = get_ics_attachment(notification, loc_context)
    else:
        attachment = None

    return RenderedEmailNotification(
        subject=subject,
        body_plaintext=body_plaintext,
        body_html=body_html,
        source_data=source_data,
        list_unsubscribe_header=list_unsubscribe_header,
        attachments=[attachment] if attachment else [],
    )


def _notification_to_email(notification: Notification, *, user_name: str) -> emails.EmailBase:
    data = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    match notification.topic_action:
        case NotificationTopicAction.account_deletion__start:
            return emails.AccountDeletionStartedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.account_deletion__complete:
            return emails.AccountDeletionCompletedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.account_deletion__recovered:
            return emails.AccountDeletionRecoveredEmail(user_name=user_name)
        case NotificationTopicAction.activeness__probe:
            return emails.ActivenessProbeEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.api_key__create:
            return emails.APIKeyIssuedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.badge__add | NotificationTopicAction.badge__remove:
            return emails.BadgeChangedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.birthdate__change:
            return emails.BirthdateChangedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.chat__message:
            return emails.ChatMessageReceivedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.chat__missed_messages:
            return emails.ChatMessagesMissedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.discussion__create:
            return emails.DiscussionCreatedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.discussion__comment:
            return emails.DiscussionCommentEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.donation__received:
            return emails.DonationReceivedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.email_address__change:
            return emails.EmailAddressChangedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.email_address__verify:
            return emails.EmailAddressVerifiedEmail(user_name=user_name)
        case NotificationTopicAction.event__create_approved:
            return emails.EventCreatedEmail.from_notification(data, user_name=user_name, is_invite=True)
        case NotificationTopicAction.event__create_any:
            return emails.EventCreatedEmail.from_notification(data, user_name=user_name, is_invite=False)
        case NotificationTopicAction.event__update:
            return emails.EventUpdatedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.event__invite_organizer:
            return emails.EventOrganizerInvitedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.event__comment:
            return emails.EventCommentEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.event__reminder:
            return emails.EventReminderEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.event__cancel:
            return emails.EventCancelledEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.event__delete:
            return emails.EventDeletedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.host_request__create:
            return emails.HostRequestCreatedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.host_request__reminder:
            return emails.HostRequestReminderEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.host_request__message:
            return emails.HostRequestMessageEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.host_request__missed_messages:
            return emails.HostRequestMissedMessagesEmail.from_notification(data, user_name=user_name)
        case (
            NotificationTopicAction.host_request__accept
            | NotificationTopicAction.host_request__reject
            | NotificationTopicAction.host_request__cancel
            | NotificationTopicAction.host_request__confirm
        ):
            return emails.HostRequestStatusChangedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.friend_request__create:
            return emails.FriendRequestReceivedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.friend_request__accept:
            return emails.FriendRequestAcceptedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.gender__change:
            return emails.GenderChangedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.general__new_blog_post:
            return emails.NewBlogPostEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.modnote__create:
            return emails.ModeratorNoteEmail(user_name=user_name)
        case NotificationTopicAction.onboarding__reminder:
            return emails.OnboardingReminderEmail(user_name=user_name, initial=notification.key == "1")
        case NotificationTopicAction.password__change:
            return emails.PasswordChangedEmail(user_name=user_name)
        case NotificationTopicAction.password_reset__complete:
            return emails.PasswordResetCompletedEmail(user_name=user_name)
        case NotificationTopicAction.password_reset__start:
            return emails.PasswordResetStartedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.phone_number__change:
            return emails.PhoneNumberChangeEmail.from_change_notification(data, user_name=user_name)
        case NotificationTopicAction.phone_number__verify:
            return emails.PhoneNumberChangeEmail.from_verify_notification(data, user_name=user_name)
        case NotificationTopicAction.postal_verification__failed:
            return emails.PostalVerificationFailedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.postal_verification__postcard_sent:
            return emails.PostalVerificationPostcardSentEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.postal_verification__success:
            return emails.PostalVerificationSucceededEmail(user_name=user_name)
        case NotificationTopicAction.reference__receive_friend:
            return emails.FriendReferenceReceivedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.reference__receive_hosted:
            # Reference received from the host, so I'm the surfer
            return emails.HostReferenceReceivedEmail.from_notification(data, user_name=user_name, surfed=True)
        case NotificationTopicAction.reference__receive_surfed:
            return emails.HostReferenceReceivedEmail.from_notification(data, user_name=user_name, surfed=False)
        case NotificationTopicAction.reference__reminder_hosted:
            # Reminder to send a "hosted" reference, so I'm the host
            return emails.HostReferenceReminderEmail.from_notification(data, user_name=user_name, surfed=False)
        case NotificationTopicAction.reference__reminder_surfed:
            return emails.HostReferenceReminderEmail.from_notification(data, user_name=user_name, surfed=True)
        case NotificationTopicAction.thread__reply:
            return emails.ThreadReplyEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.verification__sv_fail:
            return emails.StrongVerificationFailedEmail.from_notification(data, user_name=user_name)
        case NotificationTopicAction.verification__sv_success:
            return emails.StrongVerificationSucceededEmail(user_name=user_name)
        case _:
            # Enable mypy's exhaustiveness checking
            assert_never(notification.topic_action)


@dataclass(kw_only=True)
class CustomTemplatedEmail:
    # email subject
    subject: str
    # shows up when listing emails in many clients
    preview: str
    # corresponds to .mjml + .txt file in templates/v2
    template_name: str
    # other template args
    template_args: dict[str, Any]


def get_ics_attachment(notification: Notification, loc_context: LocalizationContext) -> EmailAttachmentV2 | None:
    data = notification.topic_action.data_type.FromString(notification.data)  # type: ignore[attr-defined]
    if notification.topic_action == NotificationTopicAction.host_request__accept:
        # Caveat: The surfer technically still hasn't confirmed, but when they do they don't receive an email,
        # so the accept notification is our last opportunity to provide them with a calendar event.
        return create_host_request_attachment(
            data.host_request, other_name=data.host.name, hosting=False, loc_context=loc_context
        )
    elif notification.topic_action == NotificationTopicAction.host_request__confirm:
        return create_host_request_attachment(
            data.host_request, other_name=data.surfer.name, hosting=True, loc_context=loc_context
        )
    elif notification.topic_action == NotificationTopicAction.host_request__cancel:
        # Caveat: only the party getting cancelled receives this notification,
        # we have no opportunity to provide the cancelling party with a cancelled ics attachment.
        return create_host_request_cancellation_attachment(
            data.host_request, other_name=data.surfer.name, hosting=True, loc_context=loc_context
        )
    else:
        return None


def get_list_unsubscribe_header(notification: Notification) -> str | None:
    if notification.topic_action.is_critical:
        return None

    # We can only have one List-Unsubscribe header.
    # Prefer topic-key unsubscription as it is more specific than topic-action (e.g. current chat, not all chats).
    list_unsubscribe_url: str
    if can_unsubscribe_topic_key(notification.topic_action):
        list_unsubscribe_url = generate_unsub_topic_key(notification)
    else:
        list_unsubscribe_url = generate_unsub_topic_action(notification)

    return f"<{list_unsubscribe_url}>"


def get_topic_action_unsubscribe_text(topic_action: NotificationTopicAction) -> str:
    if topic_action.is_critical:
        raise ValueError(f"Notification {topic_action} does not support unsubscription.")

    # Not localized because the design will change so avoid useless work by translators.
    match topic_action:
        case NotificationTopicAction.host_request__missed_messages:
            return "missed messages in host requests"
        case NotificationTopicAction.host_request__create:
            return "new host requests"
        case NotificationTopicAction.host_request__message:
            return "messages in host request"
        case NotificationTopicAction.host_request__accept:
            return "accepted host requests"
        case NotificationTopicAction.host_request__reject:
            return "declined host requests"
        case NotificationTopicAction.host_request__confirm:
            return "confirmed host requests"
        case NotificationTopicAction.host_request__cancel:
            return "cancelled host requests"
        case NotificationTopicAction.host_request__reminder:
            return "Pending host request reminders"
        case NotificationTopicAction.reference__receive_friend:
            return "new references from friends"
        case NotificationTopicAction.reference__receive_hosted:
            return "new references from hosts"
        case NotificationTopicAction.reference__receive_surfed:
            return "new references from surfers"
        case NotificationTopicAction.reference__reminder_hosted:
            return "hosted reference reminders"
        case NotificationTopicAction.reference__reminder_surfed:
            return "surfed reference reminders"
        case NotificationTopicAction.badge__add:
            return "badge additions"
        case NotificationTopicAction.badge__remove:
            return "badge removals"
        case NotificationTopicAction.chat__message:
            return "new chat messages"
        case NotificationTopicAction.chat__missed_messages:
            return "unseen chat messages"
        case NotificationTopicAction.event__create_approved:
            return "invitations to events (approved by moderators)"
        case NotificationTopicAction.event__create_any:
            return "new events by community members"
        case NotificationTopicAction.event__update:
            return "event updates"
        case NotificationTopicAction.event__cancel:
            return "event cancellations"
        case NotificationTopicAction.event__delete:
            return "event deletions"
        case NotificationTopicAction.event__invite_organizer:
            return "invitations to co-organize events"
        case NotificationTopicAction.event__reminder:
            return "event reminders"
        case NotificationTopicAction.event__comment:
            return "event comments"
        case NotificationTopicAction.discussion__create:
            return "new discussions"
        case NotificationTopicAction.discussion__comment:
            return "discussion comments"
        case NotificationTopicAction.thread__reply:
            return "comment replies"
        case NotificationTopicAction.friend_request__create:
            return "new friend requests"
        case NotificationTopicAction.friend_request__accept:
            return "accepted friend requests"
        case NotificationTopicAction.onboarding__reminder:
            return "onboarding emails"
        case NotificationTopicAction.postal_verification__postcard_sent:
            return "postal verification postcards"
        case NotificationTopicAction.general__new_blog_post:
            return "new blog post alerts"
        case _:
            raise NotImplementedError(f"No topic-action unsubscribe text for {topic_action}.")


def get_topic_key_unsubscribe_text(topic_action: NotificationTopicAction) -> str:
    if not can_unsubscribe_topic_key(topic_action):
        raise ValueError(f"Notification {topic_action} does not support topic-key unsubscription.")

    # Not localized because the design will change so avoid useless work by translators.
    match topic_action:
        case NotificationTopicAction.chat__message:
            return "this chat (mute)"
        case _:
            raise NotImplementedError(f"No topic-key unsubscribe text for {topic_action}.")


def get_email_footer(user: User, notification: Notification, loc_context: LocalizationContext) -> EmailFooter:
    return EmailFooter(
        timezone_name=loc_context.localized_timezone,
        copyright_year=now().year,
        unsubscribe_info=UnsubscribeInfo(
            manage_notifications_url=urls.notification_settings_link(),
            do_not_email_url=generate_do_not_email(user),
            topic_action_link=UnsubscribeLink(
                text=get_topic_action_unsubscribe_text(notification.topic_action),
                url=generate_unsub_topic_action(notification),
            ),
            topic_key_link=UnsubscribeLink(
                text=get_topic_key_unsubscribe_text(notification.topic_action),
                url=generate_unsub_topic_key(notification),
            )
            if can_unsubscribe_topic_key(notification.topic_action)
            else None,
        )
        if not notification.topic_action.is_critical
        else None,
    )


@dataclass(frozen=True, slots=True, kw_only=True)
class UserTemplateArgs:
    """
    A user's information for email template placeholders.
    Allows decoupling from protocol buffer objects.
    """

    name: str
    age: int
    city: str
    avatar_url: str
    profile_url: str

    @staticmethod
    def from_protobuf_user(user: api_pb2.User) -> UserTemplateArgs:
        return UserTemplateArgs(
            name=user.name,
            age=user.age,
            city=user.city,
            avatar_url=user.avatar_thumbnail_url or urls.icon_url(),
            profile_url=urls.user_link(username=user.username),
        )
