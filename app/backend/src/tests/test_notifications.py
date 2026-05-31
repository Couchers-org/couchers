import html
import json
import re
from datetime import timedelta
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlparse

import grpc
import pytest
from google.protobuf import empty_pb2, timestamp_pb2
from sqlalchemy import select, update

from couchers.config import config
from couchers.constants import DATETIME_INFINITY
from couchers.context import make_background_user_context
from couchers.crypto import b64decode
from couchers.db import session_scope
from couchers.i18n import LocalizationContext
from couchers.jobs.handlers import check_expo_push_receipts
from couchers.jobs.worker import process_job
from couchers.models import (
    DeviceType,
    HostingStatus,
    MeetupStatus,
    Notification,
    NotificationDelivery,
    NotificationDeliveryType,
    NotificationTopicAction,
    PushNotificationDeliveryAttempt,
    PushNotificationDeliveryOutcome,
    PushNotificationPlatform,
    PushNotificationSubscription,
    User,
)
from couchers.notifications.background import handle_notification
from couchers.notifications.expo_api import get_expo_push_receipts
from couchers.notifications.notify import notify
from couchers.notifications.settings import get_topic_actions_by_delivery_type
from couchers.proto import (
    api_pb2,
    auth_pb2,
    conversations_pb2,
    editor_pb2,
    events_pb2,
    notification_data_pb2,
    notifications_pb2,
)
from couchers.proto.internal import jobs_pb2, unsubscribe_pb2
from couchers.servicers.api import user_model_to_pb
from couchers.utils import not_none, now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import EmailCollector, PushCollector, process_jobs
from tests.fixtures.sessions import (
    api_session,
    auth_api_session,
    conversations_session,
    notifications_session,
    real_editor_session,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@pytest.mark.parametrize("enabled", [True, False])
def test_SetNotificationSettings_preferences_respected_editable(db, enabled):
    user, token = generate_user()

    # enable a notification type and check it gets delivered
    topic_action = NotificationTopicAction.badge__add

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="push",
                        enabled=enabled,
                    )
                ],
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    process_job()

    with session_scope() as session:
        deliv = session.execute(
            select(NotificationDelivery)
            .join(Notification, Notification.id == NotificationDelivery.notification_id)
            .where(Notification.user_id == user.id)
            .where(Notification.topic_action == topic_action)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
        ).scalar_one_or_none()

        if enabled:
            assert deliv is not None
        else:
            assert deliv is None


def test_SetNotificationSettings_preferences_not_editable(db):
    user, token = generate_user()

    # enable a notification type and check it gets delivered
    topic_action = NotificationTopicAction.password_reset__start

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.SetNotificationSettings(
                notifications_pb2.SetNotificationSettingsReq(
                    preferences=[
                        notifications_pb2.SingleNotificationPreference(
                            topic=topic_action.topic,
                            action=topic_action.action,
                            delivery_method="push",
                            enabled=False,
                        )
                    ],
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "That notification preference is not user editable."


def test_unsubscribe(db, email_collector: EmailCollector):
    # this is the ugliest test i've written

    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # first enable email notifs
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method=method,
                        enabled=enabled,
                    )
                    for method, enabled in [("email", True), ("digest", False), ("push", False)]
                ],
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    email = email_collector.pop_for_recipient(user.email, last=True)

    # very ugly
    # http://localhost:3000/quick-link?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    for link in re.findall(r'<a href="(.*?)"', email.html):
        if "payload" not in link:
            continue
        print(link)
        url_parts = urlparse(html.unescape(link))
        params = parse_qs(url_parts.query)
        print(params["payload"][0])
        payload = unsubscribe_pb2.UnsubscribePayload.FromString(b64decode(params["payload"][0]))
        if payload.HasField("topic_action"):
            with auth_api_session() as (auth_api, metadata_interceptor):
                assert (
                    auth_api.Unsubscribe(
                        auth_pb2.UnsubscribeReq(
                            payload=b64decode(params["payload"][0]),
                            sig=b64decode(params["sig"][0]),
                        )
                    ).response
                    == "You've been unsubscribed from email notifications of that type."
                )
            break
    else:
        raise Exception("Didn't find link")

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())

    for group in res.groups:
        for topic in group.topics:
            for item in topic.items:
                if topic == topic_action.topic and item == topic_action.action:
                    assert not item.email

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    assert email_collector.count_for_recipient(user.email) == 0


def test_unsubscribe_do_not_email(db, email_collector: EmailCollector, moderator):
    user, token = generate_user()

    _, token2 = generate_user(complete_profile=True)
    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id = res.sent[0].friend_request_id

    # Moderator approves the friend request, which triggers the notification email
    moderator.approve_friend_request(fr_id)

    email = email_collector.pop_for_recipient(user.email, last=True)
    assert email.recipient == user.email
    # very ugly
    # http://localhost:3000/quick-link?payload=CAEiGAoOZnJpZW5kX3JlcXVlc3QSBmFjY2VwdA==&sig=BQdk024NTATm8zlR0krSXTBhP5U9TlFv7VhJeIHZtUg=
    for link in re.findall(r'<a href="(.*?)"', email.html):
        if "payload" not in link:
            continue
        print(link)
        url_parts = urlparse(html.unescape(link))
        params = parse_qs(url_parts.query)
        print(params["payload"][0])
        payload = unsubscribe_pb2.UnsubscribePayload.FromString(b64decode(params["payload"][0]))
        if payload.HasField("do_not_email"):
            with auth_api_session() as (auth_api, metadata_interceptor):
                assert (
                    auth_api.Unsubscribe(
                        auth_pb2.UnsubscribeReq(
                            payload=b64decode(params["payload"][0]),
                            sig=b64decode(params["sig"][0]),
                        )
                    ).response
                    == "You will not receive any non-security emails, and your hosting status has been turned off. You may still receive the newsletter, and need to unsubscribe from it separately."
                )
            break
    else:
        raise Exception("Didn't find link")

    _, token3 = generate_user(complete_profile=True)
    with api_session(token3) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id3 = res.sent[0].friend_request_id

    # Approving this friend request should NOT send an email since user has do_not_email set
    moderator.approve_friend_request(fr_id3)

    assert email_collector.count_for_recipient(user.email) == 0

    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert user_.do_not_email


def test_get_do_not_email(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.do_not_email = False

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())
    assert not res.do_not_email_enabled

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.do_not_email = True
        user.hosting_status = HostingStatus.cant_host
        user.meetup_status = MeetupStatus.does_not_want_to_meetup

    with notifications_session(token) as notifications:
        res = notifications.GetNotificationSettings(notifications_pb2.GetNotificationSettingsReq())
    assert res.do_not_email_enabled


def test_set_do_not_email(db):
    _, token = generate_user()

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        user.do_not_email = False
        user.hosting_status = HostingStatus.can_host
        user.meetup_status = MeetupStatus.wants_to_meetup

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=False))

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.do_not_email

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert user.do_not_email
        assert user.hosting_status == HostingStatus.cant_host
        assert user.meetup_status == MeetupStatus.does_not_want_to_meetup

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=False))

    with session_scope() as session:
        user = session.execute(select(User)).scalar_one()
        assert not user.do_not_email


def test_list_notifications(db, push_collector: PushCollector, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id = res.sent[0].friend_request_id

    # Moderator approves the friend request so the notification is sent
    moderator.approve_friend_request(fr_id)

    with notifications_session(token1) as notifications:
        res = notifications.ListNotifications(notifications_pb2.ListNotificationsReq())
        assert len(res.notifications) == 1

        n = res.notifications[0]

    assert n.topic == "friend_request"
    assert n.action == "create"
    assert n.key == str(user2.id)
    assert n.title == f"Friend request from {user2.name}"
    assert n.body == f"{user2.name} wants to be your friend."
    assert n.icon.startswith("http://localhost:5001/img/thumbnail/")
    assert n.url == f"http://localhost:3000/connections/friends/?from={user2.id}"

    with conversations_session(token2) as c:
        res = c.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user1.id]))
        group_chat_id = res.group_chat_id
        moderator.approve_group_chat(group_chat_id)
        for i in range(17):
            c.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text=f"Test message {i}"))

    process_jobs()

    all_notifs = []
    with notifications_session(token1) as notifications:
        page_token = None
        for _ in range(100):
            res = notifications.ListNotifications(
                notifications_pb2.ListNotificationsReq(
                    page_size=5,
                    page_token=page_token,
                )
            )
            assert len(res.notifications) == 5 or not res.next_page_token
            all_notifs += res.notifications
            page_token = res.next_page_token
            if not page_token:
                break

    bodys = [f"Test message {16 - i}" for i in range(17)] + [f"{user2.name} wants to be your friend."]
    assert bodys == [n.body for n in all_notifs]


def test_notifications_seen(db, push_collector: PushCollector, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    user4, token4 = generate_user()

    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id2 = res.sent[0].friend_request_id

    with api_session(token3) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id3 = res.sent[0].friend_request_id

    # Moderator approves the friend requests so notifications are sent
    moderator.approve_friend_request(fr_id2)
    moderator.approve_friend_request(fr_id3)

    with notifications_session(token1) as notifications, api_session(token1) as api:
        res = notifications.ListNotifications(notifications_pb2.ListNotificationsReq())
        assert len(res.notifications) == 2
        assert [n.is_seen for n in res.notifications] == [False, False]
        notification_ids = [n.notification_id for n in res.notifications]
        # should be listed desc time
        assert notification_ids[0] > notification_ids[1]

        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 2

    with api_session(token4) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id4 = res.sent[0].friend_request_id

    # Moderator approves the friend request so notification is sent
    moderator.approve_friend_request(fr_id4)

    with notifications_session(token1) as notifications, api_session(token1) as api:
        # mark everything before just the last one as seen (pretend we didn't load the last one yet in the api)
        notifications.MarkAllNotificationsSeen(
            notifications_pb2.MarkAllNotificationsSeenReq(latest_notification_id=notification_ids[0])
        )

        # last one is still unseen
        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 1

        # mark the first one unseen
        notifications.MarkNotificationSeen(
            notifications_pb2.MarkNotificationSeenReq(notification_id=notification_ids[1], set_seen=False)
        )
        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 2

        # mark the last one seen
        res = notifications.ListNotifications(notifications_pb2.ListNotificationsReq())
        assert len(res.notifications) == 3
        assert [n.is_seen for n in res.notifications] == [False, True, False]
        notification_ids2 = [n.notification_id for n in res.notifications]

        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 2

        notifications.MarkNotificationSeen(
            notifications_pb2.MarkNotificationSeenReq(notification_id=notification_ids2[0], set_seen=True)
        )

        res = notifications.ListNotifications(notifications_pb2.ListNotificationsReq())
        assert len(res.notifications) == 3
        assert [n.is_seen for n in res.notifications] == [True, True, False]

        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 1


def test_unseen_notification_count_excludes_ums_hidden(db, moderator):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id = res.sent[0].friend_request_id

    # Before moderation the friend request is shadowed, so the resulting notification
    # is not visible to the recipient and must not contribute to their unseen count.
    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 0

    moderator.approve_friend_request(fr_id)

    with api_session(token1) as api:
        assert api.Ping(api_pb2.PingReq()).unseen_notification_count == 1


def test_GetVapidPublicKey(db):
    _, token = generate_user()

    with notifications_session(token) as notifications:
        assert (
            notifications.GetVapidPublicKey(empty_pb2.Empty()).vapid_public_key
            == "BApMo2tGuon07jv-pEaAKZmVo6E_d4HfcdDeV6wx2k9wV8EovJ0ve00bdLzZm9fizDrGZXRYJFqCcRJUfBcgA0A"
        )


def test_RegisterPushNotificationSubscription(db):
    _, token = generate_user()

    subscription_info = {
        "endpoint": "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABmW2_iYKVyZRJPhAhktbkXd6Bc8zjIUvtVi5diYL7ZYn8FHka94kIdF46Mp8DwCDWlACnbKOEo97ikaa7JYowGLiGz3qsWL7Vo19LaV4I71mUDUOIKxWIsfp_kM77MlRJQKDUddv-sYyiffOyg63d1lnc_BMIyLXt69T5SEpfnfWTNb6I",
        "expirationTime": None,
        "keys": {
            "auth": "TnuEJ1OdfEkf6HKcUovl0Q",
            "p256dh": "BK7Rp8og3eFJPqm0ofR8F-l2mtNCCCWYo6f_5kSs8jPEFiKetnZHNOglvC6IrgU9vHmgFHlG7gHGtB1HM599sy0",
        },
    }

    with notifications_session(token) as notifications:
        res = notifications.RegisterPushNotificationSubscription(
            notifications_pb2.RegisterPushNotificationSubscriptionReq(
                full_subscription_json=json.dumps(subscription_info),
            )
        )


def test_RegisterPushNotificationSubscription_invalid_endpoint(db):
    _, token = generate_user()

    subscription_info = {
        "endpoint": "https://permanently-removed.invalid/some-id",
        "expirationTime": None,
        "keys": {
            "auth": "TnuEJ1OdfEkf6HKcUovl0Q",
            "p256dh": "BK7Rp8og3eFJPqm0ofR8F-l2mtNCCCWYo6f_5kSs8jPEFiKetnZHNOglvC6IrgU9vHmgFHlG7gHGtB1HM599sy0",
        },
    }

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.RegisterPushNotificationSubscription(
                notifications_pb2.RegisterPushNotificationSubscriptionReq(
                    full_subscription_json=json.dumps(subscription_info),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT


def test_SendTestPushNotification(db, push_collector: PushCollector):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.SendTestPushNotification(empty_pb2.Empty())

    assert push_collector.count_for_user(user.id) == 1
    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Push notifications test"
    assert push.content.body == "If you see this, then it's working :)"


def test_SendBlogPostNotification(db, email_collector: EmailCollector, push_collector: PushCollector):
    super_user, super_token = generate_user(is_superuser=True)

    user1, user1_token = generate_user()
    # enabled email
    user2, user2_token = generate_user()
    # disabled push
    user3, user3_token = generate_user()

    topic_action = NotificationTopicAction.general__new_blog_post

    with notifications_session(user2_token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ],
            )
        )

    with notifications_session(user3_token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="push",
                        enabled=False,
                    )
                ],
            )
        )

    with real_editor_session(super_token) as editor_api:
        editor_api.SendBlogPostNotification(
            editor_pb2.SendBlogPostNotificationReq(
                title="Couchers.org v0.9.9 Release Notes",
                blurb="Read about last major updates before v1!",
                url="https://couchers.org/blog/2025/05/11/v0.9.9-release",
            )
        )

    email = email_collector.pop_for_recipient(user2.email, last=True)
    assert email.recipient == user2.email
    assert "Couchers.org v0.9.9 Release Notes" in email.html
    assert "Couchers.org v0.9.9 Release Notes" in email.plain
    assert "Read about last major updates before v1!" in email.html
    assert "Read about last major updates before v1!" in email.plain
    assert "https://couchers.org/blog/2025/05/11/v0.9.9-release" in email.html
    assert "https://couchers.org/blog/2025/05/11/v0.9.9-release" in email.plain

    push = push_collector.pop_for_user(user1.id, last=True)
    assert push.content.title == "New blog post: Couchers.org v0.9.9 Release Notes"
    assert push.content.body == "Read about last major updates before v1!"
    assert push.content.action_url == "https://couchers.org/blog/2025/05/11/v0.9.9-release"

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == "New blog post: Couchers.org v0.9.9 Release Notes"
    assert push.content.body == "Read about last major updates before v1!"
    assert push.content.action_url == "https://couchers.org/blog/2025/05/11/v0.9.9-release"

    assert push_collector.count_for_user(user3.id) == 0


def test_get_topic_actions_by_delivery_type(db):
    user, token = generate_user()

    # these are enabled by default
    assert NotificationDeliveryType.push in NotificationTopicAction.reference__receive_friend.defaults
    assert NotificationDeliveryType.push in NotificationTopicAction.host_request__accept.defaults

    # these are disabled by default
    assert NotificationDeliveryType.push not in NotificationTopicAction.event__create_any.defaults
    assert NotificationDeliveryType.push not in NotificationTopicAction.discussion__create.defaults

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=NotificationTopicAction.reference__receive_friend.topic,
                        action=NotificationTopicAction.reference__receive_friend.action,
                        delivery_method="push",
                        enabled=False,
                    ),
                    notifications_pb2.SingleNotificationPreference(
                        topic=NotificationTopicAction.event__create_any.topic,
                        action=NotificationTopicAction.event__create_any.action,
                        delivery_method="push",
                        enabled=True,
                    ),
                ],
            )
        )

    with session_scope() as session:
        deliver = get_topic_actions_by_delivery_type(session, user.id, NotificationDeliveryType.push)
        assert NotificationTopicAction.reference__receive_friend not in deliver
        assert NotificationTopicAction.host_request__accept in deliver
        assert NotificationTopicAction.event__create_any in deliver
        assert NotificationTopicAction.discussion__create not in deliver
        assert NotificationTopicAction.account_deletion__start in deliver


def test_event_reminder_email_sent(db, email_collector: EmailCollector):
    user, token = generate_user()
    title = "Board Game Night"
    start_event_time = timestamp_pb2.Timestamp(seconds=1751690400)

    expected_time_str = LocalizationContext.from_user(user).localize_datetime(start_event_time)

    with session_scope() as session:
        user_in_session = session.get_one(User, user.id)

        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.event__reminder,
            key="",
            data=notification_data_pb2.EventReminder(
                event=events_pb2.Event(
                    event_id=1,
                    slug="board-game-night",
                    title=title,
                    start_time=start_event_time,
                ),
                user=user_model_to_pb(user_in_session, session, make_background_user_context(user_id=user.id)),
            ),
        )

    email = email_collector.pop_for_recipient(user.email, last=True)
    assert email.recipient == user.email
    assert title in email.html
    assert title in email.plain
    assert expected_time_str in email.html
    assert expected_time_str in email.plain


def test_RegisterMobilePushNotificationSubscription(db):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.RegisterMobilePushNotificationSubscription(
            notifications_pb2.RegisterMobilePushNotificationSubscriptionReq(
                token="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
                device_name="My iPhone",
                device_type="ios",
            )
        )

    # Check subscription was created
    with session_scope() as session:
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.user_id == user.id)
        ).scalar_one()
        assert sub.platform == PushNotificationPlatform.expo
        assert sub.token == "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
        assert sub.device_name == "My iPhone"
        assert sub.device_type == DeviceType.ios
        assert sub.disabled_at == DATETIME_INFINITY


def test_RegisterMobilePushNotificationSubscription_android(db):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.RegisterMobilePushNotificationSubscription(
            notifications_pb2.RegisterMobilePushNotificationSubscriptionReq(
                token="ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]",
                device_name="My Android",
                device_type="android",
            )
        )

    with session_scope() as session:
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.user_id == user.id)
        ).scalar_one()
        assert sub.platform == PushNotificationPlatform.expo
        assert sub.device_type == DeviceType.android


def test_RegisterMobilePushNotificationSubscription_no_device_type(db):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.RegisterMobilePushNotificationSubscription(
            notifications_pb2.RegisterMobilePushNotificationSubscriptionReq(
                token="ExponentPushToken[zzzzzzzzzzzzzzzzzzzzzz]",
            )
        )

    with session_scope() as session:
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.user_id == user.id)
        ).scalar_one()
        assert sub.platform == PushNotificationPlatform.expo
        assert sub.device_name is None
        assert sub.device_type is None


def test_RegisterMobilePushNotificationSubscription_re_enable(db):
    user, token = generate_user()

    # Create a disabled subscription directly in the DB
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[reeeeeeeeeeeeeeeeeeeee]",
            device_name="Old Device",
            device_type=DeviceType.ios,
        )
        sub.disabled_at = now()
        session.add(sub)
        session.flush()
        sub_id = sub.id

    # Re-register with the same token
    with notifications_session(token) as notifications:
        notifications.RegisterMobilePushNotificationSubscription(
            notifications_pb2.RegisterMobilePushNotificationSubscriptionReq(
                token="ExponentPushToken[reeeeeeeeeeeeeeeeeeeee]",
                device_name="New Device Name",
                device_type="android",
            )
        )

    # Check subscription was re-enabled and updated
    with session_scope() as session:
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.id == sub_id)
        ).scalar_one()
        assert sub.disabled_at == DATETIME_INFINITY
        assert sub.device_name == "New Device Name"
        assert sub.device_type == DeviceType.android


def test_RegisterMobilePushNotificationSubscription_already_exists(db):
    user, token = generate_user()

    # Create an active subscription directly in the DB
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[existingtoken]",
            device_name="Existing Device",
            device_type=DeviceType.ios,
        )
        session.add(sub)

    # Try to register with the same token - should just return without error
    with notifications_session(token) as notifications:
        notifications.RegisterMobilePushNotificationSubscription(
            notifications_pb2.RegisterMobilePushNotificationSubscriptionReq(
                token="ExponentPushToken[existingtoken]",
                device_name="Different Name",
            )
        )

    # Check subscription was NOT modified (already active)
    with session_scope() as session:
        sub = session.execute(
            select(PushNotificationSubscription).where(
                PushNotificationSubscription.token == "ExponentPushToken[existingtoken]"
            )
        ).scalar_one()
        assert sub.device_name == "Existing Device"  # unchanged


def test_SendTestMobilePushNotification(db, push_collector: PushCollector):
    user, token = generate_user()

    with notifications_session(token) as notifications:
        notifications.SendTestMobilePushNotification(empty_pb2.Empty())

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Mobile notifications test"
    assert push.content.body == "If you see this on your phone, everything is wired up correctly 🎉"


def test_get_expo_push_receipts(db):
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {
            "ticket-1": {"status": "ok"},
            "ticket-2": {"status": "error", "details": {"error": "DeviceNotRegistered"}},
        }
    }

    with patch("couchers.notifications.expo_api.requests.post", return_value=mock_response) as mock_post:
        result = get_expo_push_receipts(["ticket-1", "ticket-2"])

        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[0][0] == "https://exp.host/--/api/v2/push/getReceipts"
        assert call_args[1]["json"] == {"ids": ["ticket-1", "ticket-2"]}

    assert result == {
        "ticket-1": {"status": "ok"},
        "ticket-2": {"status": "error", "details": {"error": "DeviceNotRegistered"}},
    }


def test_get_expo_push_receipts_empty(db):
    result = get_expo_push_receipts([])
    assert result == {}


def test_check_expo_push_receipts_success(db):
    """Test batch receipt checking with successful delivery."""
    user, token = generate_user()

    # Create a push subscription and delivery attempt (old enough to be checked)
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[testtoken123]",
            device_name="Test Device",
            device_type=DeviceType.ios,
        )
        session.add(sub)
        session.flush()

        attempt = PushNotificationDeliveryAttempt(
            push_notification_subscription_id=sub.id,
            outcome=PushNotificationDeliveryOutcome.success,
            status_code=200,
            expo_ticket_id="test-ticket-id",
        )
        session.add(attempt)
        session.flush()
        # Make the attempt old enough to be checked (>15 min)
        attempt.time = now() - timedelta(minutes=20)
        attempt_id = attempt.id
        sub_id = sub.id

    # Mock the receipt API call
    with patch("couchers.notifications.expo_api.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"data": {"test-ticket-id": {"status": "ok"}}}

        check_expo_push_receipts(empty_pb2.Empty())

    # Verify the attempt was updated
    with session_scope() as session:
        attempt = session.execute(
            select(PushNotificationDeliveryAttempt).where(PushNotificationDeliveryAttempt.id == attempt_id)
        ).scalar_one()
        assert attempt.receipt_checked_at is not None
        assert attempt.receipt_status == "ok"
        assert attempt.receipt_error_code is None

        # Subscription should still be enabled
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.id == sub_id)
        ).scalar_one()
        assert sub.disabled_at == DATETIME_INFINITY


def test_check_expo_push_receipts_device_not_registered(db):
    """Test batch receipt checking with DeviceNotRegistered error disables subscription."""
    user, token = generate_user()

    # Create a push subscription and delivery attempt
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[devicegone]",
            device_name="Test Device",
            device_type=DeviceType.android,
        )
        session.add(sub)
        session.flush()

        attempt = PushNotificationDeliveryAttempt(
            push_notification_subscription_id=sub.id,
            outcome=PushNotificationDeliveryOutcome.success,
            status_code=200,
            expo_ticket_id="ticket-device-gone",
        )
        session.add(attempt)
        session.flush()
        # Make the attempt old enough to be checked
        attempt.time = now() - timedelta(minutes=15)
        attempt_id = attempt.id
        sub_id = sub.id

    # Mock the receipt API call with DeviceNotRegistered error
    with patch("couchers.notifications.expo_api.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "data": {
                "ticket-device-gone": {
                    "status": "error",
                    "details": {"error": "DeviceNotRegistered"},
                }
            }
        }

        check_expo_push_receipts(empty_pb2.Empty())

    # Verify the attempt was updated and subscription disabled
    with session_scope() as session:
        attempt = session.execute(
            select(PushNotificationDeliveryAttempt).where(PushNotificationDeliveryAttempt.id == attempt_id)
        ).scalar_one()
        assert attempt.receipt_checked_at is not None
        assert attempt.receipt_status == "error"
        assert attempt.receipt_error_code == "DeviceNotRegistered"

        # Subscription should be disabled
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.id == sub_id)
        ).scalar_one()
        assert sub.disabled_at <= now()


def test_check_expo_push_receipts_not_found(db):
    """Test batch receipt checking when ticket not found (expired)."""
    user, token = generate_user()

    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[notfound]",
        )
        session.add(sub)
        session.flush()

        attempt = PushNotificationDeliveryAttempt(
            push_notification_subscription_id=sub.id,
            outcome=PushNotificationDeliveryOutcome.success,
            status_code=200,
            expo_ticket_id="unknown-ticket",
        )
        session.add(attempt)
        session.flush()
        # Make the attempt old enough to be checked
        attempt.time = now() - timedelta(minutes=15)
        attempt_id = attempt.id
        sub_id = sub.id

    # Mock empty receipt response (ticket not found)
    with patch("couchers.notifications.expo_api.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {"data": {}}

        check_expo_push_receipts(empty_pb2.Empty())

    with session_scope() as session:
        attempt = session.execute(
            select(PushNotificationDeliveryAttempt).where(PushNotificationDeliveryAttempt.id == attempt_id)
        ).scalar_one()
        assert attempt.receipt_checked_at is not None
        assert attempt.receipt_status == "not_found"

        # Subscription should still be enabled
        sub = session.execute(
            select(PushNotificationSubscription).where(PushNotificationSubscription.id == sub_id)
        ).scalar_one()
        assert sub.disabled_at == DATETIME_INFINITY


def test_check_expo_push_receipts_skips_already_checked(db):
    """Test that already-checked receipts are not re-checked."""
    user, token = generate_user()

    # Create an attempt that was already checked
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[alreadychecked]",
        )
        session.add(sub)
        session.flush()

        attempt = PushNotificationDeliveryAttempt(
            push_notification_subscription_id=sub.id,
            outcome=PushNotificationDeliveryOutcome.success,
            status_code=200,
            expo_ticket_id="already-checked-ticket",
            receipt_checked_at=now(),
            receipt_status="ok",
        )
        session.add(attempt)
        session.flush()
        # Make the attempt old enough
        attempt.time = now() - timedelta(minutes=15)

    # Should not call the API since the only attempt is already checked
    with patch("couchers.notifications.expo_api.requests.post") as mock_post:
        check_expo_push_receipts(empty_pb2.Empty())
        mock_post.assert_not_called()


def test_SendDevPushNotification_success(db, push_collector: PushCollector):
    """Test SendDevPushNotification sends push with all specified parameters."""
    user, token = generate_user()

    # Enable dev APIs for this test
    config["ENABLE_DEV_APIS"] = True

    with notifications_session(token) as notifications:
        notifications.SendDevPushNotification(
            notifications_pb2.SendDevPushNotificationReq(
                title="Test Dev Title",
                body="Test dev notification body",
                icon="https://example.com/icon.png",
                url="https://example.com/action",
                key="test-key",
                ttl=3600,
            )
        )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Test Dev Title"
    assert push.content.body == "Test dev notification body"
    assert push.content.action_url == "https://example.com/action"
    assert push.content.icon_url == "https://example.com/icon.png"
    assert push.topic_action == "adhoc:testing"
    assert push.key == "test-key"
    assert push.ttl == 3600


def test_SendDevPushNotification_minimal(db, push_collector: PushCollector):
    """Test SendDevPushNotification with minimal parameters."""
    user, token = generate_user()

    config["ENABLE_DEV_APIS"] = True

    with notifications_session(token) as notifications:
        notifications.SendDevPushNotification(
            notifications_pb2.SendDevPushNotificationReq(
                title="Minimal Title",
                body="Minimal body",
            )
        )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Minimal Title"
    assert push.content.body == "Minimal body"
    assert push.topic_action == "adhoc:testing"


def test_SendDevPushNotification_disabled(db, push_collector: PushCollector):
    """Test SendDevPushNotification fails when ENABLE_DEV_APIS is disabled."""
    user, token = generate_user()

    # Ensure dev APIs are disabled (default in tests)
    config["ENABLE_DEV_APIS"] = False

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.SendDevPushNotification(
                notifications_pb2.SendDevPushNotificationReq(
                    title="Should Fail",
                    body="This should not be sent",
                )
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert "Development APIs are not enabled" in not_none(e.value.details())

    assert push_collector.count_for_user(user.id) == 0


def test_SendDevPushNotification_push_notifications_disabled(db, push_collector: PushCollector):
    """Test SendDevPushNotification fails when push notifications are disabled."""
    user, token = generate_user()

    config["ENABLE_DEV_APIS"] = True
    config["PUSH_NOTIFICATIONS_ENABLED"] = False

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.SendDevPushNotification(
                notifications_pb2.SendDevPushNotificationReq(
                    title="Should Fail",
                    body="This should not be sent",
                )
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert "Push notifications are currently disabled" in not_none(e.value.details())

    assert push_collector.count_for_user(user.id) == 0


def test_check_expo_push_receipts_skips_too_recent(db):
    """Test that too-recent receipts (<15 min) are not checked."""
    user, token = generate_user()

    # Create a recent attempt (not old enough to check)
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[recent]",
        )
        session.add(sub)
        session.flush()

        attempt = PushNotificationDeliveryAttempt(
            push_notification_subscription_id=sub.id,
            outcome=PushNotificationDeliveryOutcome.success,
            status_code=200,
            expo_ticket_id="recent-ticket",
        )
        session.add(attempt)
        session.flush()
        # Make the attempt only 5 minutes old (too recent)
        attempt.time = now() - timedelta(minutes=5)

    # Should not call the API since the attempt is too recent
    with patch("couchers.notifications.expo_api.requests.post") as mock_post:
        check_expo_push_receipts(empty_pb2.Empty())
        mock_post.assert_not_called()


def test_check_expo_push_receipts_batch(db):
    """Test that multiple receipts are checked in a single batch."""
    user, token = generate_user()

    # Create multiple delivery attempts
    attempt_ids = []
    with session_scope() as session:
        sub = PushNotificationSubscription(
            user_id=user.id,
            platform=PushNotificationPlatform.expo,
            token="ExponentPushToken[batch]",
        )
        session.add(sub)
        session.flush()

        for i in range(3):
            attempt = PushNotificationDeliveryAttempt(
                push_notification_subscription_id=sub.id,
                outcome=PushNotificationDeliveryOutcome.success,
                status_code=200,
                expo_ticket_id=f"batch-ticket-{i}",
            )
            session.add(attempt)
            session.flush()
            attempt.time = now() - timedelta(minutes=20)
            attempt_ids.append(attempt.id)

    # Mock the batch receipt API call
    with patch("couchers.notifications.expo_api.requests.post") as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            "data": {
                "batch-ticket-0": {"status": "ok"},
                "batch-ticket-1": {"status": "ok"},
                "batch-ticket-2": {"status": "ok"},
            }
        }

        check_expo_push_receipts(empty_pb2.Empty())

        # Should only call the API once for all tickets
        assert mock_post.call_count == 1

    # Verify all attempts were updated
    with session_scope() as session:
        for attempt_id in attempt_ids:
            attempt = session.execute(
                select(PushNotificationDeliveryAttempt).where(PushNotificationDeliveryAttempt.id == attempt_id)
            ).scalar_one()
            assert attempt.receipt_checked_at is not None
            assert attempt.receipt_status == "ok"


def test_DebugRedeliverPushNotification_success(db, push_collector: PushCollector):
    """Test DebugRedeliverPushNotification redelivers an existing notification."""
    user, token = generate_user()

    config["ENABLE_DEV_APIS"] = True

    # Create a notification for the user
    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=NotificationTopicAction.badge__add,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    process_job()

    # Pop the initial push notification
    push_collector.pop_for_user(user.id, last=True)

    # Get the notification_id
    with session_scope() as session:
        notification = session.execute(select(Notification).where(Notification.user_id == user.id)).scalar_one()
        notification_id = notification.id

    # Redeliver the notification
    with notifications_session(token) as notifications:
        notifications.DebugRedeliverPushNotification(
            notifications_pb2.DebugRedeliverPushNotificationReq(notification_id=notification_id)
        )

    # Verify a new push was sent
    push = push_collector.pop_for_user(user.id, last=True)
    assert "Active Volunteer" in push.content.title
    assert push.topic_action == "badge:add"
    assert push.key == "test-badge"


def test_DebugRedeliverPushNotification_not_found(db, push_collector: PushCollector):
    """Test DebugRedeliverPushNotification fails when notification doesn't exist."""
    user, token = generate_user()

    config["ENABLE_DEV_APIS"] = True

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.DebugRedeliverPushNotification(
                notifications_pb2.DebugRedeliverPushNotificationReq(notification_id=999999)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert "notification not found" in not_none(e.value.details()).lower()

    assert push_collector.count_for_user(user.id) == 0


def test_DebugRedeliverPushNotification_wrong_user(db, push_collector: PushCollector):
    """Test DebugRedeliverPushNotification fails when notification belongs to another user."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    config["ENABLE_DEV_APIS"] = True

    # Create a notification for user1
    with session_scope() as session:
        notify(
            session,
            user_id=user1.id,
            topic_action=NotificationTopicAction.badge__add,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer for Couchers.org",
            ),
        )

    process_job()

    # Get the notification_id
    with session_scope() as session:
        notification = session.execute(select(Notification).where(Notification.user_id == user1.id)).scalar_one()
        notification_id = notification.id

    # user2 tries to redeliver user1's notification
    with notifications_session(token2) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.DebugRedeliverPushNotification(
                notifications_pb2.DebugRedeliverPushNotificationReq(notification_id=notification_id)
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert "notification not found" in not_none(e.value.details()).lower()

    assert push_collector.count_for_user(user2.id) == 0


def test_DebugRedeliverPushNotification_disabled(db, push_collector: PushCollector):
    """Test DebugRedeliverPushNotification fails when ENABLE_DEV_APIS is disabled."""
    user, token = generate_user()

    config["ENABLE_DEV_APIS"] = False

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.DebugRedeliverPushNotification(
                notifications_pb2.DebugRedeliverPushNotificationReq(notification_id=1)
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert "Development APIs are not enabled" in not_none(e.value.details())

    assert push_collector.count_for_user(user.id) == 0


def test_DebugRedeliverPushNotification_push_notifications_disabled(db, push_collector: PushCollector):
    """Test DebugRedeliverPushNotification fails when push notifications are disabled."""
    user, token = generate_user()

    config["ENABLE_DEV_APIS"] = True
    config["PUSH_NOTIFICATIONS_ENABLED"] = False

    with notifications_session(token) as notifications:
        with pytest.raises(grpc.RpcError) as e:
            notifications.DebugRedeliverPushNotification(
                notifications_pb2.DebugRedeliverPushNotificationReq(notification_id=1)
            )
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert "Push notifications are currently disabled" in not_none(e.value.details())

    assert push_collector.count_for_user(user.id) == 0


def test_handle_notification_email_delivery(db, email_collector: EmailCollector):
    """Test that email notifications are delivered when email preference is enabled."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Enable email notifications for this topic
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ],
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    email = email_collector.pop_for_recipient(user.email, last=True)
    assert email.recipient == user.email

    with session_scope() as session:
        delivery = session.execute(
            select(NotificationDelivery)
            .join(Notification, Notification.id == NotificationDelivery.notification_id)
            .where(Notification.user_id == user.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.email)
        ).scalar_one()
        assert delivery.delivered is not None


def test_handle_notification_push_delivery(db, push_collector: PushCollector):
    """Test that push notifications are delivered immediately when push preference is enabled."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    process_job()

    push = push_collector.pop_for_user(user.id, last=True)
    assert "Active Volunteer" in push.content.title

    with session_scope() as session:
        delivery = session.execute(
            select(NotificationDelivery)
            .join(Notification, Notification.id == NotificationDelivery.notification_id)
            .where(Notification.user_id == user.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
        ).scalar_one()
        assert delivery.delivered is not None


def test_handle_notification_digest_delivery(db):
    """Test that digest notifications are queued without a delivered timestamp."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Enable only digest notifications for this topic
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="push",
                        enabled=False,
                    ),
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="digest",
                        enabled=True,
                    ),
                ],
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    process_job()

    # Verify digest NotificationDelivery was created WITHOUT delivered timestamp
    with session_scope() as session:
        delivery = session.execute(
            select(NotificationDelivery)
            .join(Notification, Notification.id == NotificationDelivery.notification_id)
            .where(Notification.user_id == user.id)
            .where(NotificationDelivery.delivery_type == NotificationDeliveryType.digest)
        ).scalar_one()
        assert delivery.delivered is None


def test_handle_notification_banned_user_no_email(db, email_collector: EmailCollector):
    """Test that banned users don't receive email notifications."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Enable email notifications
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ],
            )
        )

    # Ban the user
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(banned_at=now()))

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    # Email should not be sent to the banned user
    assert email_collector.count_for_recipient(user.email) == 0


def test_handle_notification_deleted_user_no_regular_email(db, email_collector: EmailCollector):
    """Test that deleted users don't receive non-account-deletion email notifications."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Enable email notifications
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ],
            )
        )

    # Delete the user
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(deleted_at=now()))

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    # Email should not be sent to deleted user for non-account-deletion notification
    assert email_collector.count_for_recipient(user.email) == 0


def test_handle_notification_deleted_user_receives_account_deletion_email(db, email_collector: EmailCollector):
    """Test that deleted users CAN receive account deletion notifications."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.account_deletion__complete

    # Delete the user
    with session_scope() as session:
        session.execute(update(User).where(User.id == user.id).values(deleted_at=now()))

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="",
            data=notification_data_pb2.AccountDeletionComplete(
                undelete_token="test-token",
                undelete_days=7,
            ),
        )

    # Email SHOULD be sent to deleted user for account deletion notification
    email = email_collector.pop_for_recipient(user.email, last=True)
    assert email.recipient == user.email


def test_handle_notification_do_not_email_respected(db, email_collector: EmailCollector):
    """Test that users with do_not_email set don't receive non-critical emails."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Enable email notifications
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=True,
                    )
                ],
            )
        )

    # Set do_not_email (requires hosting/meetup status to be set due to DB constraint)
    with session_scope() as session:
        session.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                hosting_status=HostingStatus.cant_host,
                meetup_status=MeetupStatus.does_not_want_to_meetup,
                do_not_email=True,
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    # Email should not be sent when do_not_email is True
    assert email_collector.count_for_recipient(user.email) == 0


def test_handle_notification_critical_bypasses_do_not_email(db, email_collector: EmailCollector):
    """Test that critical notifications bypass do_not_email setting."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.password__change

    # Set do_not_email (requires hosting/meetup status to be set due to DB constraint)
    with session_scope() as session:
        session.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                hosting_status=HostingStatus.cant_host,
                meetup_status=MeetupStatus.does_not_want_to_meetup,
                do_not_email=True,
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="",
            data=None,
        )

    # Critical email SHOULD be sent even with do_not_email=True
    email = email_collector.pop_for_recipient(user.email, last=True)
    assert email.recipient == user.email


def test_handle_notification_duplicate_delivery_skipped(db, push_collector: PushCollector):
    """Test that duplicate deliveries are skipped when NotificationDelivery already exists."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Create notification manually
    with session_scope() as session:
        notification = Notification(
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ).SerializeToString(),
        )
        session.add(notification)
        session.flush()
        notification_id = notification.id

        # Manually create a push delivery (simulating it was already delivered)
        session.add(
            NotificationDelivery(
                notification_id=notification_id,
                delivery_type=NotificationDeliveryType.push,
                delivered=now(),
            )
        )

    # Try to handle the notification again
    handle_notification(jobs_pb2.HandleNotificationPayload(notification_id=notification_id))

    # No new push should be sent since delivery already exists
    assert push_collector.count_for_user(user.id) == 0

    # Verify only one delivery exists
    with session_scope() as session:
        delivery_count = len(
            session.execute(
                select(NotificationDelivery)
                .where(NotificationDelivery.notification_id == notification_id)
                .where(NotificationDelivery.delivery_type == NotificationDeliveryType.push)
            )
            .scalars()
            .all()
        )
        assert delivery_count == 1


def test_handle_notification_deferred_when_content_not_visible(db, moderator):
    """Test that notifications linked to non-visible moderated content are deferred."""
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=True)

    # Create a friend request (which creates a moderation state)
    # This also queues a notification via SendFriendRequest
    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))

    # Process the queued job (handle_notification)
    process_job()

    # The notification should exist but have no deliveries because content is shadowed
    with session_scope() as session:
        notification = session.execute(
            select(Notification)
            .where(Notification.user_id == user1.id)
            .where(Notification.topic_action == NotificationTopicAction.friend_request__create)
        ).scalar_one()

        deliveries = (
            session.execute(select(NotificationDelivery).where(NotificationDelivery.notification_id == notification.id))
            .scalars()
            .all()
        )
        # No deliveries because content is not yet visible (shadowed)
        assert len(deliveries) == 0


def test_handle_notification_delivered_when_content_visible(db, moderator):
    """Test that notifications linked to visible moderated content are delivered."""
    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=True)

    # Create a friend request
    with api_session(token2) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user1.id))
        res = api.ListFriendRequests(empty_pb2.Empty())
        fr_id = res.sent[0].friend_request_id

    # Process initial job (which is deferred because content is shadowed)
    process_job()

    # Approve the friend request so it becomes visible (this queues the notification job again)
    moderator.approve_friend_request(fr_id)

    # Process the notification job that was re-queued after approval
    process_jobs()

    # Notification should have been delivered
    with session_scope() as session:
        notification = session.execute(
            select(Notification)
            .where(Notification.user_id == user1.id)
            .where(Notification.topic_action == NotificationTopicAction.friend_request__create)
        ).scalar_one()

        deliveries = (
            session.execute(select(NotificationDelivery).where(NotificationDelivery.notification_id == notification.id))
            .scalars()
            .all()
        )
        # At least one delivery should exist
        assert len(deliveries) > 0


def test_handle_notification_multiple_delivery_types(
    db, email_collector: EmailCollector, push_collector: PushCollector
):
    """Test that multiple delivery types are processed for a single notification."""
    user, token = generate_user()

    topic_action = NotificationTopicAction.badge__add

    # Enable both email and push notifications
    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(
            notifications_pb2.SetNotificationSettingsReq(
                preferences=[
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="email",
                        enabled=True,
                    ),
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="push",
                        enabled=True,
                    ),
                    notifications_pb2.SingleNotificationPreference(
                        topic=topic_action.topic,
                        action=topic_action.action,
                        delivery_method="digest",
                        enabled=True,
                    ),
                ],
            )
        )

    with session_scope() as session:
        notify(
            session,
            user_id=user.id,
            topic_action=topic_action,
            key="test-badge",
            data=notification_data_pb2.BadgeAdd(
                badge_id="volunteer",
                badge_name="Active Volunteer",
                badge_description="This user is an active volunteer",
            ),
        )

    # Email should be sent
    email_collector.pop_for_recipient(user.email, last=True)

    # Push should be sent
    push = push_collector.pop_for_user(user.id, last=True)
    assert "Active Volunteer" in push.content.title

    # All three delivery types should have deliveries
    with session_scope() as session:
        notification = session.execute(select(Notification).where(Notification.user_id == user.id)).scalar_one()

        deliveries = (
            session.execute(select(NotificationDelivery).where(NotificationDelivery.notification_id == notification.id))
            .scalars()
            .all()
        )

        delivery_types = {d.delivery_type for d in deliveries}
        assert NotificationDeliveryType.email in delivery_types
        assert NotificationDeliveryType.push in delivery_types
        assert NotificationDeliveryType.digest in delivery_types

        # Email and push should have delivered timestamps
        for delivery in deliveries:
            if delivery.delivery_type in [NotificationDeliveryType.email, NotificationDeliveryType.push]:
                assert delivery.delivered is not None
            elif delivery.delivery_type == NotificationDeliveryType.digest:
                assert delivery.delivered is None
