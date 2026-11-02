import re

from sqlalchemy import select

from couchers.context import make_logged_out_context
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.email.zz import (
    OPEN_PIXEL_GIF,
    add_open_pixel,
    add_zz_to_html_links,
    generate_zz,
    open_pixel_url,
)
from couchers.i18n import LocalizationContext
from couchers.models import Notification, NotificationTopicAction, SignupFlow
from couchers.models.logging import EventLog
from couchers.proto import api_pb2, bugs_pb2
from couchers.tasks import send_signup_email
from tests.fixtures.db import generate_user, get_friend_relationship
from tests.fixtures.misc import EmailCollector, Moderator
from tests.fixtures.sessions import api_session, real_bugs_session


def test_add_zz_to_html_links():
    html = (
        '<a href="http://localhost:3000/quick-link?payload=x&amp;sig=y">a</a>'
        '<a href="http://localhost:3000/dashboard#top">b</a>'
        '<a href="https://example.com/">c</a>'
        '<a href="http://localhost:3000.evil.com/x">d</a>'
        '<img src="http://localhost:3000/logo512.png">'
        "<p>http://localhost:3000/user/bob</p>"
    )
    assert add_zz_to_html_links(html, "abc") == (
        '<a href="http://localhost:3000/quick-link?payload=x&amp;sig=y&amp;zz=abc">a</a>'
        '<a href="http://localhost:3000/dashboard?zz=abc#top">b</a>'
        '<a href="https://example.com/">c</a>'
        '<a href="http://localhost:3000.evil.com/x">d</a>'
        '<img src="http://localhost:3000/logo512.png">'
        "<p>http://localhost:3000/user/bob</p>"
    )


def test_add_open_pixel():
    html = add_open_pixel("<html><body><p>hi</p></body></html>", "abc")
    assert html.startswith("<html><body><p>hi</p><img ")
    assert html.endswith("></body></html>")
    assert f'src="{open_pixel_url("abc")}"' in html


def test_notification_email_gets_zz(db, email_collector: EmailCollector, moderator: Moderator, feature_flags):
    feature_flags.set("email_zz_links_enabled", True)
    to_user, _ = generate_user()
    from_user, from_token = generate_user()

    with api_session(from_token) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=to_user.id))
    friend_relationship = get_friend_relationship(from_user, to_user)
    assert friend_relationship
    moderator.approve_friend_request(friend_relationship.id)

    email = email_collector.pop_for_recipient(to_user.email, last=True)

    with session_scope() as session:
        notification_id = session.execute(
            select(Notification.id)
            .where(Notification.user_id == to_user.id)
            .where(Notification.topic_action == NotificationTopicAction.friend_request__create)
        ).scalar_one()
        properties = session.execute(
            select(EventLog.properties).where(EventLog.event_type == "email.sent").where(EventLog.user_id == to_user.id)
        ).scalar_one()

    zz = properties["zz"]
    assert properties == {"zz": zz, "source_data": email.source_data, "notification_id": notification_id}

    hrefs = re.findall(r'href="(http://localhost:3000[^"]*)"', email.html)
    assert hrefs
    assert all(f"zz={zz}" in href for href in hrefs)
    assert "zz=" not in email.plain
    assert "/email/open/" not in email.html


def test_userless_email_gets_open_pixel_without_zz_links(db, email_collector: EmailCollector, feature_flags):
    feature_flags.set("email_open_pixel_enabled", True)
    recipient = f"{random_hex(12)}@couchers.org.invalid"

    with session_scope() as session:
        send_signup_email(
            make_logged_out_context(LocalizationContext.en_utc()),
            session,
            SignupFlow(name="Frodo", email=recipient, flow_token=""),
        )

    email = email_collector.pop_for_recipient(recipient, last=True)

    with session_scope() as session:
        event = session.execute(select(EventLog).where(EventLog.event_type == "email.sent")).scalar_one()
        assert event.user_id is None
        zz = event.properties["zz"]

    assert "zz=" not in email.html
    assert "zz=" not in email.plain
    assert f'src="{open_pixel_url(zz)}"' in email.html


def test_record_email_open(db):
    zz = generate_zz()

    with real_bugs_session() as (bugs, metadata_interceptor):
        res = bugs.RecordEmailOpen(bugs_pb2.RecordEmailOpenReq(zz=zz))

    assert res.content_type == "image/gif"
    assert res.data == OPEN_PIXEL_GIF
    assert metadata_interceptor.latest_headers["cache-control"] == "no-store"

    with session_scope() as session:
        properties = session.execute(
            select(EventLog.properties).where(EventLog.event_type == "email.opened")
        ).scalar_one()
    assert properties == {"zz": zz}


def test_record_email_open_ignores_malformed_zz(db):
    with real_bugs_session() as (bugs, _):
        res = bugs.RecordEmailOpen(bugs_pb2.RecordEmailOpenReq(zz="not an zz"))

    assert res.data == OPEN_PIXEL_GIF

    with session_scope() as session:
        assert not session.execute(select(EventLog).where(EventLog.event_type == "email.opened")).scalars().all()
