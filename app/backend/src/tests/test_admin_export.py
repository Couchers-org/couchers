import json
from datetime import date, timedelta
from typing import Any

import grpc
import pytest
from sqlalchemy import update

from couchers.db import session_scope
from couchers.models import (
    FriendRelationship,
    FriendStatus,
    HostRequest,
    Invoice,
    InvoiceType,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    PhotoGalleryItem,
    Upload,
    User,
)
from couchers.proto import (
    admin_pb2,
    conversations_pb2,
    discussions_pb2,
    events_pb2,
    messages_pb2,
    public_trips_pb2,
    references_pb2,
    requests_pb2,
    threads_pb2,
)
from couchers.utils import datetime_to_iso8601_local, not_none, now, today
from tests.fixtures.db import generate_user, make_friends, make_user_block, make_user_invisible
from tests.fixtures.sessions import (
    conversations_session,
    discussions_session,
    events_session,
    public_trips_session,
    real_admin_session,
    references_session,
    requests_session,
    threads_session,
)
from tests.test_communities import create_community
from tests.test_public_trips import VALID_DESCRIPTION as TRIP_DESCRIPTION
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _export(super_token: str, user: User) -> Any:
    with real_admin_session(super_token) as api:
        res = api.ExportUserData(admin_pb2.ExportUserDataReq(user=user.username))
    assert res.user_id == user.id
    return json.loads(res.json)


def test_ExportUserData(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, _ = generate_user(complete_profile=False, about_me="I like couches", pronouns="she/her")

    with real_admin_session(super_token) as api:
        res = api.ExportUserData(admin_pb2.ExportUserDataReq(user=user.username))

    assert res.user_id == user.id
    assert res.filename.startswith(f"couchers-data-export-{user.username}-")
    assert res.filename.endswith(".json")

    export = json.loads(res.json)
    assert export["export_format_version"] == 1
    assert export["account"]["user_id"] == str(user.id)
    assert export["account"]["username"] == user.username
    assert export["account"]["email"] == user.email
    assert export["account"]["pronouns"] == "she/her"
    assert export["profile"]["about_me"] == "I like couches"
    assert export["home"]["about_place"] == user.about_place

    with real_admin_session(super_token) as api:
        details = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=user.username))
    assert [action.action_type for action in details.admin_actions] == ["export_user_data"]
    assert details.admin_actions[0].level == admin_pb2.ADMIN_ACTION_LEVEL_HIGH


def test_ExportUserData_not_found(db):
    _, super_token = generate_user(is_superuser=True)

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.ExportUserData(admin_pb2.ExportUserDataReq(user="nonexistentuser"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_ExportUserData_references_written(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    friend, _ = generate_user()

    make_friends(user, friend)

    with references_session(token) as api:
        api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=friend.id,
                text="a good friend",
                private_text="but they snore",
                was_appropriate=True,
                rating=0.5,
            )
        )

    export = _export(super_token, user)

    written = export["references"]["written"]
    assert len(written) == 1
    assert written[0]["text"] == "a good friend"
    assert written[0]["to_user"] == {"user_id": str(friend.id), "username": f"@{friend.username}"}


def test_ExportUserData_conversations_with_visible_user(db, moderator):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    other, other_token = generate_user()

    make_friends(user, other)

    with conversations_session(token) as api:
        chat_id = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[other.id])).group_chat_id
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello from me"))
    moderator.approve_group_chat(chat_id)
    with conversations_session(other_token) as api:
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello back from them"))

    today_plus_2 = (date.today() + timedelta(days=2)).isoformat()
    today_plus_3 = (date.today() + timedelta(days=3)).isoformat()
    with requests_session(token) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=other.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)
    with requests_session(other_token) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="sure, come on over")
        )

    export = _export(super_token, user)

    (chat,) = export["group_chats"]
    assert chat["creator"] == {"user_id": str(user.id), "username": f"@{user.username}"}
    texts = [message.get("text") for message in chat["messages"]]
    assert "hello from me" in texts
    assert "hello back from them" in texts
    their_message = next(message for message in chat["messages"] if message.get("text") == "hello back from them")
    assert their_message["author"] == {"user_id": str(other.id), "username": f"@{other.username}"}
    assert their_message["time"]

    (request,) = export["host_requests"]
    assert request["role"] == "surfer"
    assert request["host"] == {"user_id": str(other.id), "username": f"@{other.username}"}
    request_texts = [message.get("text") for message in request["messages"]]
    assert valid_request_text() in request_texts
    assert "sure, come on over" in request_texts


def test_ExportUserData_conversations_with_invisible_user(db, moderator):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    other, other_token = generate_user()

    make_friends(user, other)

    with conversations_session(token) as api:
        chat_id = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[other.id])).group_chat_id
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello from me"))
    moderator.approve_group_chat(chat_id)
    with conversations_session(other_token) as api:
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello back from them"))

    today_plus_2 = (date.today() + timedelta(days=2)).isoformat()
    today_plus_3 = (date.today() + timedelta(days=3)).isoformat()
    with requests_session(token) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=other.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)
    with requests_session(other_token) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(host_request_id=host_request_id, text="sure, come on over")
        )

    make_user_invisible(other.id)

    export = _export(super_token, user)

    (chat,) = export["group_chats"]
    # the chat-created control message has no text of its own
    assert [message["text"] for message in chat["messages"] if message.get("text")] == ["hello from me"]
    assert "hello back from them" not in json.dumps(export)
    assert other.username not in json.dumps(export)

    (request,) = export["host_requests"]
    assert request["host"] == {"user_id": str(other.id)}
    assert [message["text"] for message in request["messages"] if message.get("text")] == [valid_request_text()]


def test_ExportUserData_conversations_with_blocked_user(db, moderator):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    other, other_token = generate_user()

    make_friends(user, other)

    with conversations_session(token) as api:
        chat_id = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[other.id])).group_chat_id
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello from me"))
    moderator.approve_group_chat(chat_id)
    with conversations_session(other_token) as api:
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello back from them"))

    make_user_block(user, other)

    export = _export(super_token, user)

    (chat,) = export["group_chats"]
    assert [message["text"] for message in chat["messages"] if message.get("text")] == ["hello from me"]
    assert chat["messages"][0]["author"] == {"user_id": str(user.id), "username": f"@{user.username}"}
    assert chat["messages"][-1]["author"] == {"user_id": str(user.id), "username": f"@{user.username}"}

    # but their own block list still names who they blocked, as it does in the app
    assert export["blocked_users"] == [
        {
            "user": {"user_id": str(other.id), "username": f"@{other.username}"},
            "time_blocked": export["blocked_users"][0]["time_blocked"],
        }
    ]


def test_ExportUserData_covers_content_across_the_site(db, moderator):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()

    with session_scope() as session:
        node_id = create_community(session, 0, 2, "Export Community", [user], [], None).id

    with discussions_session(token) as api:
        discussion = api.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title="export discussion",
                content="export discussion content",
                owner_community_id=node_id,
            )
        )

    with threads_session(token) as api:
        comment_thread_id = api.PostReply(
            threads_pb2.PostReplyReq(thread_id=discussion.thread.thread_id, content="export comment")
        ).thread_id
        api.PostReply(threads_pb2.PostReplyReq(thread_id=comment_thread_id, content="export reply"))

    start_time = now() + timedelta(hours=2)
    with events_session(token) as api:
        api.CreateEvent(
            events_pb2.CreateEventReq(
                title="export event",
                content="export event content",
                location=events_pb2.EventLocation(address="Near Null Island", lat=0.1, lng=0.2),
                start_datetime_iso8601_local=datetime_to_iso8601_local(start_time),
                end_datetime_iso8601_local=datetime_to_iso8601_local(start_time + timedelta(hours=3)),
            )
        )

    with public_trips_session(token) as api:
        api.CreatePublicTrip(
            public_trips_pb2.CreatePublicTripReq(
                community_id=node_id,
                from_date=(today() + timedelta(days=5)).isoformat(),
                to_date=(today() + timedelta(days=10)).isoformat(),
                description=TRIP_DESCRIPTION,
            )
        )

    with session_scope() as session:
        session.add(Upload(key="export_key", filename="export.jpg", creator_user_id=user.id, credit="me"))
        session.flush()
        session.add(
            PhotoGalleryItem(
                gallery_id=not_none(user.profile_gallery_id), upload_key="export_key", position=1.0, caption="hi"
            )
        )
        session.add(
            Invoice(
                user_id=user.id,
                amount=25.0,
                stripe_payment_intent_id="pi_export",
                stripe_receipt_url="https://stripe.example.org/receipt",
                invoice_type=InvoiceType.on_platform,
            )
        )

    export = _export(super_token, user)

    assert [community["name"] for community in export["communities"]] == ["Export Community"]

    assert [item["title"] for item in export["discussions"]["created"]] == ["export discussion"]
    (comment,) = export["discussions"]["comments"]
    assert comment["content"] == "export comment"
    assert comment["posted_in"]["type"] == "discussion"
    assert comment["posted_in"]["title"] == "export discussion"
    (reply,) = export["discussions"]["replies"]
    assert reply["content"] == "export reply"
    assert reply["posted_in"]["title"] == "export discussion"

    (event,) = export["events"]["created"]
    assert event["title"] == "export event"
    assert event["address"] == "Near Null Island"
    assert event["start"] and event["end"]
    assert [item["title"] for item in export["events"]["attending"]] == ["export event"]
    assert export["events"]["attending"][0]["attendee_status"] == "going"
    assert [item["title"] for item in export["events"]["organizing"]] == ["export event"]

    (trip,) = export["public_trips"]
    assert trip["description"] == TRIP_DESCRIPTION

    photos = {photo["url"]: photo for gallery in export["photos"]["galleries"] for photo in gallery["photos"]}
    (photo_url,) = [url for url in photos if url.endswith("/img/full/export.jpg")]
    assert photos[photo_url]["caption"] == "hi"
    assert photo_url in [upload["url"] for upload in export["photos"]["uploads"]]

    (invoice,) = export["donations"]
    assert invoice["amount"] == 25.0
    assert invoice["receipt_url"] == "https://stripe.example.org/receipt"


def _add_friend_relationship(from_user: User, to_user: User, status: FriendStatus) -> None:
    with session_scope() as session:
        moderation_state = ModerationState(
            object_type=ModerationObjectType.friend_request,
            object_id=0,
            visibility=ModerationVisibility.visible,
        )
        session.add(moderation_state)
        session.flush()
        relationship = FriendRelationship(
            from_user_id=from_user.id,
            to_user_id=to_user.id,
            status=status,
            moderation_state_id=moderation_state.id,
        )
        session.add(relationship)
        session.flush()
        moderation_state.object_id = relationship.id


def test_ExportUserData_leaves_out_how_others_answered_friend_requests(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, _ = generate_user()
    accepted, _ = generate_user()
    they_rejected, _ = generate_user()
    they_cancelled, _ = generate_user()
    asked_them, _ = generate_user()
    they_asked, _ = generate_user()

    make_friends(user, accepted)
    _add_friend_relationship(user, they_rejected, FriendStatus.rejected)
    _add_friend_relationship(user, they_cancelled, FriendStatus.cancelled)
    _add_friend_relationship(user, asked_them, FriendStatus.pending)
    _add_friend_relationship(they_asked, user, FriendStatus.pending)

    export = _export(super_token, user)

    friends = {friend["user"]["username"]: friend for friend in export["friends"]}
    assert set(friends) == {f"@{accepted.username}", f"@{asked_them.username}", f"@{they_asked.username}"}

    # a rejected or cancelled request is the other party's answer, and the app never shows it
    assert they_rejected.username not in json.dumps(export)
    assert they_cancelled.username not in json.dumps(export)

    assert friends[f"@{accepted.username}"]["status"] == "friends"
    assert friends[f"@{asked_them.username}"]["status"] == "request_sent"
    assert friends[f"@{asked_them.username}"]["time_sent"]
    # when they sent it isn't this user's to know
    assert friends[f"@{they_asked.username}"]["status"] == "request_received"
    assert "time_sent" not in friends[f"@{they_asked.username}"]


def test_ExportUserData_leaves_out_references_the_user_cannot_see_yet(db, moderator):
    super_user, super_token = generate_user(is_superuser=True)
    surfer, surfer_token = generate_user()
    host, host_token = generate_user()

    today_plus_2 = (date.today() + timedelta(days=2)).isoformat()
    today_plus_3 = (date.today() + timedelta(days=3)).isoformat()
    with requests_session(surfer_token) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=host.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id
    moderator.approve_host_request(host_request_id)
    with requests_session(host_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id, status=messages_pb2.HOST_REQUEST_STATUS_ACCEPTED
            )
        )
    with session_scope() as session:
        session.execute(
            update(HostRequest)
            .where(HostRequest.conversation_id == host_request_id)
            .values(from_date=date.today() - timedelta(days=3), to_date=date.today() - timedelta(days=2))
        )

    with references_session(host_token) as api:
        reference_id = api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=host_request_id,
                text="they were a fine guest",
                was_appropriate=True,
                rating=0.5,
            )
        ).reference_id
    moderator.approve_reference(reference_id)

    # the surfer hasn't written theirs back and the window is still open, so the app hides it
    assert _export(super_token, surfer).get("references", {}).get("received", []) == []

    with references_session(surfer_token) as api:
        api.WriteHostRequestReference(
            references_pb2.WriteHostRequestReferenceReq(
                host_request_id=host_request_id,
                text="a fine host",
                was_appropriate=True,
                rating=0.5,
            )
        )

    (received,) = _export(super_token, surfer)["references"]["received"]
    assert received["text"] == "they were a fine guest"
    assert "rating" not in received


def test_ExportUserData_leaves_out_moderation_hidden_content(db, moderator):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    other, other_token = generate_user()

    make_friends(user, other)

    with conversations_session(token) as api:
        chat_id = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[other.id])).group_chat_id
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=chat_id, text="hello from me"))
    moderator.approve_group_chat(chat_id)

    assert "hello from me" in json.dumps(_export(super_token, user))

    with session_scope() as session:
        session.execute(
            update(ModerationState)
            .where(ModerationState.object_type == ModerationObjectType.group_chat)
            .where(ModerationState.object_id == chat_id)
            .values(visibility=ModerationVisibility.hidden)
        )

    assert "hello from me" not in json.dumps(_export(super_token, user))
