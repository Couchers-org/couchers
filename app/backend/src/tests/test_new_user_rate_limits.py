"""
Tests for new user rate limits (users less than 24 hours old).
These tests verify that new users have stricter rate limits than established users.
"""

from datetime import timedelta

import grpc
import pytest

from couchers.models import RateLimitAction, User
from couchers.proto import api_pb2, conversations_pb2, requests_pb2
from couchers.rate_limits.definitions import RATE_LIMIT_DEFINITIONS, RATE_LIMIT_HOURS
from couchers.sql import couchers_select as select
from couchers.utils import now, today
from tests.test_fixtures import (  # noqa
    api_session,
    conversations_session,
    db,
    generate_user,
    mock_notification_email,
    requests_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_new_user_host_request_rate_limit(db):
    """Test that new users (< 24 hours old) have a hard limit of 5 host requests."""
    new_user, token = generate_user()

    # Verify user is brand new
    assert (now() - new_user.joined).total_seconds() < 60  # Less than a minute old

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_host_request]

    with requests_session(token) as api:
        # Should be able to send up to the hard limit
        for i in range(new_user_limit.hard_limit):
            host_user, _ = generate_user()
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=f"Test request {i}",
                )
            )

        # The next one should fail
        host_user, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text="Excessive request",
                )
            )
        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
        assert (
            exc_info.value.details()
            == "You have sent a lot of host requests in the past 24 hours. To avoid spam, you can't send any more for now. If you just signed up, please wait 24 hours for rate limits to be relaxed."
        )


def test_established_user_host_request_rate_limit(db):
    """Test that established users (> 24 hours old) have the normal higher limits."""
    # Create a user and make them 25 hours old
    old_user, token = generate_user()

    # Manually set the user's joined date to 25 hours ago
    from couchers.db import session_scope

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == old_user.id)).scalar_one()
        user.joined = now() - timedelta(hours=25)
        session.commit()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Get the limits for both new and established users
    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_host_request]
    established_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.host_request]

    with requests_session(token) as api:
        # Should be able to send more than the new user limit
        for i in range(new_user_limit.hard_limit + 5):
            host_user, _ = generate_user()
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=f"Test request {i}",
                )
            )

        # Verify we can still send more (not hitting established limit yet)
        assert (new_user_limit.hard_limit + 5) < established_limit.hard_limit


def test_new_user_friend_request_rate_limit(db):
    """Test that new users (< 24 hours old) have a hard limit of 5 friend requests."""
    new_user, token = generate_user()

    # Verify user is brand new
    assert (now() - new_user.joined).total_seconds() < 60

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_friend_request]

    with api_session(token) as api:
        # Should be able to send up to the hard limit
        for i in range(new_user_limit.hard_limit):
            friend, _ = generate_user()
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend.id))

        # The next one should fail
        friend, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend.id))

        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
        assert (
            exc_info.value.details()
            == "You have sent a lot of friend requests in the past 24 hours. To avoid spam, you can't send any more for now. If you just signed up, please wait 24 hours for rate limits to be relaxed."
        )


def test_established_user_friend_request_rate_limit(db):
    """Test that established users (> 24 hours old) have the normal higher limits."""
    old_user, token = generate_user()

    # Make user 25 hours old
    from couchers.db import session_scope

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == old_user.id)).scalar_one()
        user.joined = now() - timedelta(hours=25)
        session.commit()

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_friend_request]
    established_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.friend_request]

    with api_session(token) as api:
        # Should be able to send more than the new user limit
        for i in range(new_user_limit.hard_limit + 5):
            friend, _ = generate_user()
            api.SendFriendRequest(api_pb2.SendFriendRequestReq(user_id=friend.id))

        # Verify we can still send more
        assert (new_user_limit.hard_limit + 5) < established_limit.hard_limit


def test_new_user_chat_initiation_rate_limit(db):
    """Test that new users (< 24 hours old) have a hard limit of 3 chat initiations."""
    new_user, token = generate_user()

    # Verify user is brand new
    assert (now() - new_user.joined).total_seconds() < 60

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_chat_initiation]

    with conversations_session(token) as api:
        # Should be able to initiate up to the hard limit
        for i in range(new_user_limit.hard_limit):
            recipient, _ = generate_user()
            api.CreateGroupChat(
                conversations_pb2.CreateGroupChatReq(
                    recipient_user_ids=[recipient.id],
                )
            )

        # The next one should fail
        recipient, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            api.CreateGroupChat(
                conversations_pb2.CreateGroupChatReq(
                    recipient_user_ids=[recipient.id],
                )
            )

        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED
        assert (
            exc_info.value.details()
            == "You have messaged a lot of users in the past 24 hours. To avoid spam, you can't contact any more users for now. If you just signed up, please wait 24 hours for rate limits to be relaxed."
        )


def test_established_user_chat_initiation_rate_limit(db):
    """Test that established users (> 24 hours old) have the normal higher limits."""
    old_user, token = generate_user()

    # Make user 25 hours old
    from couchers.db import session_scope

    with session_scope() as session:
        user = session.execute(select(User).where(User.id == old_user.id)).scalar_one()
        user.joined = now() - timedelta(hours=25)
        session.commit()

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_chat_initiation]
    established_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.chat_initiation]

    with conversations_session(token) as api:
        # Should be able to initiate more than the new user limit
        for i in range(new_user_limit.hard_limit + 5):
            recipient, _ = generate_user()
            api.CreateGroupChat(
                conversations_pb2.CreateGroupChatReq(
                    recipient_user_ids=[recipient.id],
                )
            )

        # Verify we can still send more
        assert (new_user_limit.hard_limit + 5) < established_limit.hard_limit


def test_new_user_transitions_to_established(db):
    """Test that users transition from new to established limits after 24 hours."""
    user, token = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_host_request]

    # Send requests as a new user up to the limit
    with requests_session(token) as api:
        for i in range(new_user_limit.hard_limit):
            host_user, _ = generate_user()
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=f"Test request {i}",
                )
            )

        # Next request should fail (new user limit reached)
        host_user, _ = generate_user()
        with pytest.raises(grpc.RpcError) as exc_info:
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text="Should fail",
                )
            )
        assert exc_info.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED

    # Age the user to 25 hours and age their requests to 25 hours ago
    from couchers.db import session_scope

    with session_scope() as session:
        user_obj = session.execute(select(User).where(User.id == user.id)).scalar_one()
        user_obj.joined = now() - timedelta(hours=25)

        # Age all their host requests
        from couchers.models import Conversation, HostRequest

        host_requests = (
            session.execute(select(HostRequest).where(HostRequest.surfer_user_id == user.id)).scalars().all()
        )

        for hr in host_requests:
            conversation = session.execute(
                select(Conversation).where(Conversation.id == hr.conversation_id)
            ).scalar_one()
            conversation.created = now() - timedelta(hours=25)

        session.commit()

    # Now as an established user, should be able to send more requests
    with requests_session(token) as api:
        for i in range(5):  # Send 5 more
            host_user, _ = generate_user()
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=f"Established user request {i}",
                )
            )


def test_new_user_warning_email(db):
    """Test that warning emails are sent when new users reach the warning limit."""
    new_user, token = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    new_user_limit = RATE_LIMIT_DEFINITIONS[RateLimitAction.new_user_host_request]

    with requests_session(token) as api:
        # Send up to warning limit - no email yet
        with mock_notification_email() as mock_email:
            for i in range(new_user_limit.warning_limit):
                host_user, _ = generate_user()
                api.CreateHostRequest(
                    requests_pb2.CreateHostRequestReq(
                        host_user_id=host_user.id,
                        from_date=today_plus_2,
                        to_date=today_plus_3,
                        text=f"Test request {i}",
                    )
                )
            assert mock_email.call_count == 0

        # Next request should trigger warning email
        with mock_notification_email() as mock_email:
            host_user, _ = generate_user()
            api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    host_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text="Warning trigger",
                )
            )
            assert mock_email.call_count == 1
            email = mock_email.mock_calls[0].kwargs["plain"]
            assert new_user.username in email
            assert str(new_user_limit.warning_limit + 1) in email
            assert str(RATE_LIMIT_HOURS) in email
