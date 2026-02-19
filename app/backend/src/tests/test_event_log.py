from datetime import timedelta

import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import select

from couchers.context import make_interactive_context
from couchers.crypto import hash_password
from couchers.db import session_scope
from couchers.event_log import log_event
from couchers.models.logging import EventLog
from couchers.proto import (
    api_pb2,
    auth_pb2,
    conversations_pb2,
    events_pb2,
    references_pb2,
    reporting_pb2,
    requests_pb2,
    search_pb2,
)
from couchers.utils import Timestamp_from_datetime, create_coordinate, now, today
from tests.fixtures.db import generate_user, make_friends
from tests.fixtures.sessions import (
    MockGrpcContext,
    api_session,
    auth_api_session,
    conversations_session,
    events_session,
    references_session,
    reporting_session,
    requests_session,
    search_session,
)
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig, fast_passwords):
    pass


def _get_events(session, event_type=None):
    """Helper to query EventLog entries, optionally filtered by event_type."""
    stmt = select(EventLog).order_by(EventLog.id)
    if event_type:
        stmt = stmt.where(EventLog.event_type == event_type)
    return session.execute(stmt).scalars().all()


# ===== Unit tests for log_event function =====


def test_log_event_authenticated_context(db):
    """log_event stores event with user_id from context."""
    user, token = generate_user()

    with session_scope() as session:
        context = make_interactive_context(
            grpc_context=MockGrpcContext(),
            user_id=user.id,
            is_api_key=False,
            token=token,
            ui_language_preference=None,
            sofa="test-sofa-123",
        )
        log_event(context, session, "test.event", {"key": "value"})

    with session_scope() as session:
        events = _get_events(session, "test.event")
        assert len(events) == 1
        assert events[0].user_id == user.id
        assert events[0].event_type == "test.event"
        assert events[0].properties == {"key": "value"}
        assert events[0].sofa == "test-sofa-123"
        assert events[0].created is not None


def test_log_event_with_override_user_id(db):
    """log_event uses _override_user_id to set user_id."""
    user, token = generate_user()

    with session_scope() as session:
        context = make_interactive_context(
            grpc_context=MockGrpcContext(),
            user_id=None,
            is_api_key=False,
            token=None,
            ui_language_preference=None,
            sofa="sofa-456",
        )
        log_event(context, session, "account.signup_completed", {"gender": "Woman"}, _override_user_id=user.id)

    with session_scope() as session:
        events = _get_events(session, "account.signup_completed")
        assert len(events) == 1
        assert events[0].user_id == user.id
        assert events[0].properties == {"gender": "Woman"}
        assert events[0].sofa == "sofa-456"


def test_log_event_anonymous(db):
    """log_event stores event with user_id=None when context has no user."""
    with session_scope() as session:
        context = make_interactive_context(
            grpc_context=MockGrpcContext(),
            user_id=None,
            is_api_key=False,
            token=None,
            ui_language_preference=None,
        )
        log_event(context, session, "account.signup_initiated", {"has_invite_code": False})

    with session_scope() as session:
        events = _get_events(session, "account.signup_initiated")
        assert len(events) == 1
        assert events[0].user_id is None
        assert events[0].properties == {"has_invite_code": False}


def test_log_event_complex_properties(db):
    """Properties dict with various types is stored as JSONB correctly."""
    user, token = generate_user()

    props = {
        "string_val": "hello",
        "int_val": 42,
        "float_val": 3.14,
        "bool_val": True,
        "none_val": None,
        "list_val": [1, 2, 3],
        "nested": {"a": 1, "b": "two"},
    }

    with session_scope() as session:
        context = make_interactive_context(
            grpc_context=MockGrpcContext(),
            user_id=user.id,
            is_api_key=False,
            token=token,
            ui_language_preference=None,
        )
        log_event(context, session, "test.complex", props)

    with session_scope() as session:
        events = _get_events(session, "test.complex")
        assert len(events) == 1
        assert events[0].properties == props


def test_log_event_empty_properties(db):
    """Empty properties dict is stored correctly."""
    user, token = generate_user()

    with session_scope() as session:
        context = make_interactive_context(
            grpc_context=MockGrpcContext(),
            user_id=user.id,
            is_api_key=False,
            token=token,
            ui_language_preference=None,
        )
        log_event(context, session, "account.logout", {})

    with session_scope() as session:
        events = _get_events(session, "account.logout")
        assert len(events) == 1
        assert events[0].properties == {}


def test_log_event_multiple_events(db):
    """Multiple events are stored independently."""
    user, token = generate_user()

    with session_scope() as session:
        context = make_interactive_context(
            grpc_context=MockGrpcContext(),
            user_id=user.id,
            is_api_key=False,
            token=token,
            ui_language_preference=None,
        )
        log_event(context, session, "test.first", {"n": 1})
        log_event(context, session, "test.second", {"n": 2})
        log_event(context, session, "test.first", {"n": 3})

    with session_scope() as session:
        all_events = _get_events(session)
        assert len(all_events) == 3

        first_events = _get_events(session, "test.first")
        assert len(first_events) == 2
        assert first_events[0].properties == {"n": 1}
        assert first_events[1].properties == {"n": 3}

        second_events = _get_events(session, "test.second")
        assert len(second_events) == 1
        assert second_events[0].properties == {"n": 2}


# ===== Integration tests: auth events =====


def test_signup_flow_creates_events(db):
    """Full signup flow creates account.signup_initiated and account.signup_completed events."""
    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                basic=auth_pb2.SignupBasic(name="testing", email="email@couchers.org.invalid"),
            )
        )

    flow_token = res.flow_token

    with session_scope() as session:
        events = _get_events(session, "account.signup_initiated")
        assert len(events) == 1
        assert events[0].properties["has_invite_code"] is False

    # complete signup: get email token, verify, fill account, etc.
    from couchers.models import SignupFlow

    with session_scope() as session:
        flow = session.execute(select(SignupFlow).where(SignupFlow.flow_token == flow_token)).scalar_one()
        email_token = flow.email_token

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                email_token=email_token,
            )
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                accept_community_guidelines=wrappers_pb2.BoolValue(value=True),
            )
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                account=auth_pb2.SignupAccount(
                    username="frodo",
                    password="a very insecure password",
                    birthdate="1970-01-01",
                    gender="Bot",
                    hosting_status=api_pb2.HOSTING_STATUS_MAYBE,
                    city="New York City",
                    lat=40.7331,
                    lng=-73.9778,
                    radius=500,
                    accept_tos=True,
                ),
            )
        )

    with auth_api_session() as (auth_api, metadata_interceptor):
        res = auth_api.SignupFlow(
            auth_pb2.SignupFlowReq(
                flow_token=flow_token,
                intents=auth_pb2.SignupIntents(intents=["surfing"]),
            )
        )

    assert res.HasField("auth_res")
    user_id = res.auth_res.user_id

    with session_scope() as session:
        events = _get_events(session, "account.signup_completed")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user_id
        assert e.properties["gender"] == "Bot"
        assert e.properties["hosting_status"] is not None
        assert e.properties["city"] == "New York City"
        assert e.properties["has_invite_code"] is False
        assert isinstance(e.properties["signup_duration_s"], (int, float))
        assert "filled_contributor_form" in e.properties


def test_login_creates_event(db):
    """Login creates account.login event with gender and remember_device."""
    user, token = generate_user(hashed_password=hash_password("password123"))

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Authenticate(
            auth_pb2.AuthReq(
                user=user.username,
                password="password123",
                remember_device=True,
            )
        )

    with session_scope() as session:
        events = _get_events(session, "account.login")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user.id
        assert e.properties["gender"] == user.gender
        assert e.properties["remember_device"] is True


def test_logout_creates_event(db):
    """Logout creates account.logout event."""
    user, token = generate_user()

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Deauthenticate(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}"),))

    with session_scope() as session:
        events = _get_events(session, "account.logout")
        assert len(events) == 1
        assert events[0].user_id == user.id
        assert events[0].properties == {}


# ===== Integration tests: host request events =====


def test_host_request_created_event(db, moderator):
    """Creating a host request logs host_request.created with full context."""
    user1, token1 = generate_user()
    user2, token2 = generate_user(
        city="Berlin",
        geom=create_coordinate(52.5200, 13.4050),
        geom_radius=200,
    )

    from_date = today() + timedelta(days=2)
    to_date = today() + timedelta(days=5)

    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                text="a]" * 200 + "Hello! I would love to stay with you.",
            )
        )

    host_request_id = res.host_request_id

    with session_scope() as session:
        events = _get_events(session, "host_request.created")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["host_request_id"] == host_request_id
        assert e.properties["host_id"] == user2.id
        assert e.properties["surfer_gender"] == user1.gender
        assert e.properties["host_gender"] == user2.gender
        assert e.properties["city"] == "Berlin"
        assert e.properties["from_date"] == str(from_date)
        assert e.properties["to_date"] == str(to_date)
        assert e.properties["nights"] == 3


def test_host_request_status_change_events(db, moderator):
    """Accepting a host request logs event with both parties' info."""
    user1, token1 = generate_user()
    user2, token2 = generate_user(
        city="Berlin",
        geom=create_coordinate(52.5200, 13.4050),
        geom_radius=200,
    )

    from_date = today() + timedelta(days=2)
    to_date = today() + timedelta(days=5)

    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                text="a]" * 200 + "Hello! I would love to stay with you.",
            )
        )
    host_request_id = res.host_request_id
    moderator.approve_host_request(host_request_id)

    # Host accepts
    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
            )
        )

    with session_scope() as session:
        events = _get_events(session, "host_request.accepted")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user2.id
        assert e.properties["host_request_id"] == host_request_id
        assert e.properties["surfer_id"] == user1.id
        assert e.properties["host_id"] == user2.id
        assert e.properties["surfer_gender"] == user1.gender
        assert e.properties["host_gender"] == user2.gender
        assert e.properties["from_date"] == str(from_date)
        assert e.properties["to_date"] == str(to_date)
        assert e.properties["host_city"] == "Berlin"

    # Surfer confirms
    with requests_session(token1) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
            )
        )

    with session_scope() as session:
        events = _get_events(session, "host_request.confirmed")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["surfer_id"] == user1.id
        assert e.properties["host_id"] == user2.id
        assert e.properties["surfer_gender"] == user1.gender
        assert e.properties["host_gender"] == user2.gender


def test_host_request_rejected_event(db, moderator):
    """Rejecting a host request logs event."""
    user1, token1 = generate_user()
    user2, token2 = generate_user(
        city="Paris",
        geom=create_coordinate(48.8566, 2.3522),
        geom_radius=200,
    )

    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=(today() + timedelta(days=2)).isoformat(),
                to_date=(today() + timedelta(days=4)).isoformat(),
                text="a]" * 200 + "Would love to visit!",
            )
        )
    moderator.approve_host_request(res.host_request_id)

    with requests_session(token2) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=res.host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_REJECTED,
            )
        )

    with session_scope() as session:
        events = _get_events(session, "host_request.rejected")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user2.id
        assert e.properties["surfer_id"] == user1.id
        assert e.properties["host_id"] == user2.id
        assert e.properties["host_city"] == "Paris"


def test_host_request_cancelled_event(db, moderator):
    """Cancelling a host request logs event."""
    user1, token1 = generate_user()
    user2, token2 = generate_user(
        geom=create_coordinate(52.5200, 13.4050),
        geom_radius=200,
    )

    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=(today() + timedelta(days=2)).isoformat(),
                to_date=(today() + timedelta(days=4)).isoformat(),
                text="a]" * 200 + "Would love to visit!",
            )
        )
    moderator.approve_host_request(res.host_request_id)

    with requests_session(token1) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=res.host_request_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
            )
        )

    with session_scope() as session:
        events = _get_events(session, "host_request.cancelled")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["surfer_id"] == user1.id
        assert e.properties["host_id"] == user2.id


def test_host_request_message_event(db, moderator):
    """Sending a message in a host request logs event with role."""
    user1, token1 = generate_user()
    user2, token2 = generate_user(
        geom=create_coordinate(52.5200, 13.4050),
        geom_radius=200,
    )

    with requests_session(token1) as api:
        res = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                host_user_id=user2.id,
                from_date=(today() + timedelta(days=2)).isoformat(),
                to_date=(today() + timedelta(days=4)).isoformat(),
                text="a]" * 200 + "Hello!",
            )
        )
    host_request_id = res.host_request_id
    moderator.approve_host_request(host_request_id)

    # Host sends a message
    with requests_session(token2) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(
                host_request_id=host_request_id,
                text="Welcome!",
            )
        )

    with session_scope() as session:
        events = _get_events(session, "host_request.message_sent")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user2.id
        assert e.properties["host_request_id"] == host_request_id
        assert e.properties["role"] == "host"
        assert e.properties["surfer_id"] == user1.id
        assert e.properties["host_id"] == user2.id

    # Surfer sends a message
    with requests_session(token1) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(
                host_request_id=host_request_id,
                text="Thanks!",
            )
        )

    with session_scope() as session:
        events = _get_events(session, "host_request.message_sent")
        assert len(events) == 2
        e = events[1]
        assert e.user_id == user1.id
        assert e.properties["role"] == "surfer"


# ===== Integration tests: messaging events =====


def test_send_message_creates_event(db):
    """Sending a direct message creates a message.sent event."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)

    with conversations_session(token1) as api:
        res = api.SendDirectMessage(
            conversations_pb2.SendDirectMessageReq(
                recipient_user_id=user2.id,
                text="Hello friend!",
            )
        )

    with session_scope() as session:
        events = _get_events(session, "message.sent")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["group_chat_id"] == res.group_chat_id
        assert e.properties["is_dm"] is True
        assert e.properties["recipient_id"] == user2.id


def test_create_group_chat_event(db):
    """Creating a group chat creates a group_chat.created event."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)

    with conversations_session(token1) as api:
        res = api.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id, user3.id],
                title=wrappers_pb2.StringValue(value="Test Group"),
            )
        )

    with session_scope() as session:
        events = _get_events(session, "group_chat.created")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["group_chat_id"] == res.group_chat_id
        assert e.properties["is_dm"] is False
        assert e.properties["recipient_count"] == 2


# ===== Integration tests: friendship events =====


def test_friendship_request_events(db, moderator):
    """Friend request lifecycle creates appropriate events."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    # Send friend request
    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    with session_scope() as session:
        events = _get_events(session, "friendship.request_sent")
        assert len(events) == 1
        assert events[0].user_id == user1.id
        assert events[0].properties["to_user_id"] == user2.id

    # Approve and accept friend request
    from couchers.models import FriendRelationship

    with session_scope() as session:
        fr = session.execute(select(FriendRelationship)).scalar_one()
        fr_id = fr.id

    moderator.approve_friend_request(fr_id)

    with api_session(token2) as api:
        api.RespondFriendRequest(api_pb2.RespondFriendRequestReq(friend_request_id=fr_id, accept=True))

    with session_scope() as session:
        events = _get_events(session, "friendship.request_responded")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user2.id
        assert e.properties["from_user_id"] == user1.id
        assert e.properties["accepted"] is True

    # Remove friend
    with api_session(token1) as api:
        api.RemoveFriend(api_pb2.RemoveFriendReq(user_id=user2.id))

    with session_scope() as session:
        events = _get_events(session, "friendship.removed")
        assert len(events) == 1
        assert events[0].user_id == user1.id
        assert events[0].properties["other_user_id"] == user2.id


def test_friendship_cancel_event(db, moderator):
    """Cancelling a friend request creates event."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with api_session(token1) as api:
        api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=user2.id))

    from couchers.models import FriendRelationship

    with session_scope() as session:
        fr = session.execute(select(FriendRelationship)).scalar_one()
        fr_id = fr.id

    with api_session(token1) as api:
        api.CancelFriendRequest(api_pb2.CancelFriendRequestReq(friend_request_id=fr_id))

    with session_scope() as session:
        events = _get_events(session, "friendship.request_cancelled")
        assert len(events) == 1
        assert events[0].properties["to_user_id"] == user2.id


# ===== Integration tests: reporting events =====


def test_report_creates_event(db):
    """Reporting content creates content.reported event with full context."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with reporting_session(token1) as api:
        api.Report(
            reporting_pb2.ReportReq(
                reason="spam",
                description="This is spam",
                content_ref="comment/456",
                author_user=user2.username,
                user_agent="TestAgent/1.0",
                page="https://couchers.org/profile/123",
            )
        )

    with session_scope() as session:
        events = _get_events(session, "content.reported")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["author_user_id"] == user2.id
        assert e.properties["reason"] == "spam"
        assert e.properties["content_ref"] == "comment/456"
        assert e.properties["page"] == "https://couchers.org/profile/123"


# ===== Integration tests: search events =====


def test_search_creates_event(db):
    """User search creates search.performed event with search parameters."""
    user, token = generate_user()

    with search_session(token) as api:
        api.UserSearch(search_pb2.UserSearchReq())

    with session_scope() as session:
        events = _get_events(session, "search.performed")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user.id
        assert e.properties["has_query"] is False
        assert e.properties["has_filters"] is False
        assert "total_items" in e.properties
        assert e.properties["search_in"] is None


# ===== Integration tests: reference events =====


def test_friend_reference_event(db):
    """Writing a friend reference creates reference.friend_written event."""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    make_friends(user1, user2)

    with references_session(token1) as api:
        api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id,
                text="Great person!",
                private_text="",
                rating=0.9,
                was_appropriate=True,
            )
        )

    with session_scope() as session:
        events = _get_events(session, "reference.friend_written")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user1.id
        assert e.properties["to_user_id"] == user2.id
        assert e.properties["rating"] == pytest.approx(0.9)
        assert e.properties["was_appropriate"] is True


# ===== Integration tests: event (calendar) events =====


def test_event_created_event(db):
    """Creating an event logs event.created with community info and online status."""
    user, token = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [user], [], None)

    start_time = now() + timedelta(days=1)
    end_time = start_time + timedelta(hours=2)

    with events_session(token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Test Meetup",
                content="Let's hang out",
                offline_information=events_pb2.OfflineEventInformation(
                    address="123 Main St",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )

    with session_scope() as session:
        events = _get_events(session, "event.created")
        assert len(events) == 1
        e = events[0]
        assert e.user_id == user.id
        assert e.properties["event_id"] is not None
        assert e.properties["occurrence_id"] is not None
        assert e.properties["parent_community_id"] is not None
        assert e.properties["parent_community_name"] is not None
        assert e.properties["online"] is False


# ===== Integration tests: password change =====


def test_password_change_event(db):
    """Changing password creates account.password_changed event."""
    user, token = generate_user(hashed_password=hash_password("oldpassword"))

    from couchers.proto import account_pb2
    from tests.fixtures.sessions import account_session

    with account_session(token) as api:
        api.ChangePasswordV2(
            account_pb2.ChangePasswordV2Req(
                old_password="oldpassword",
                new_password="a new very secure password",
            )
        )

    with session_scope() as session:
        events = _get_events(session, "account.password_changed")
        assert len(events) == 1
        assert events[0].user_id == user.id
        assert events[0].properties == {}


# ===== Test that events don't leak across tests =====


def test_no_stale_events(db):
    """Verify the database is clean - no events from previous tests."""
    with session_scope() as session:
        events = _get_events(session)
        assert len(events) == 0
