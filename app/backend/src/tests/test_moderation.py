"""
Comprehensive tests for the Unified Moderation System (UMS)
"""

from datetime import datetime, timedelta

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy.sql import select

from couchers.config import config
from couchers.db import session_scope
from couchers.jobs.handlers import auto_approve_moderation_queue
from couchers.models import (
    GroupChat,
    HostRequest,
    ModerationAction,
    ModerationLog,
    ModerationObjectType,
    ModerationQueueItem,
    ModerationState,
    ModerationTrigger,
    ModerationVisibility,
)
from couchers.moderation.utils import create_moderation
from couchers.proto import conversations_pb2, moderation_pb2, notifications_pb2, requests_pb2
from couchers.utils import Timestamp_from_datetime, now, today
from tests.fixtures.db import generate_user, make_friends
from tests.fixtures.misc import PushCollector, mock_notification_email, process_jobs
from tests.fixtures.sessions import (
    conversations_session,
    notifications_session,
    real_moderation_session,
    requests_session,
)
from tests.test_requests import valid_request_text


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def create_test_host_request_with_moderation(surfer_token, recipient_user_id):
    """Helper to create a host request and return its moderation state ID"""
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=recipient_user_id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    with session_scope() as session:
        hr = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr_id)).scalar_one()
        return hr.moderation_state_id


# ============================================================================
# Tests for moderation helper functions
# ============================================================================


def test_create_moderation(db):
    """Test creating a moderation state with associated log entry"""
    user, _ = generate_user()

    with session_scope() as session:
        # Create a moderation state
        moderation_state = create_moderation(
            session=session,
            object_type=ModerationObjectType.HOST_REQUEST,
            object_id=123,
            creator_user_id=user.id,
        )

        assert moderation_state.object_type == ModerationObjectType.HOST_REQUEST
        assert moderation_state.object_id == 123
        assert moderation_state.visibility == ModerationVisibility.SHADOWED

        # Check that log entry was created
        log_entries = (
            session.execute(select(ModerationLog).where(ModerationLog.moderation_state_id == moderation_state.id))
            .scalars()
            .all()
        )

        assert len(log_entries) == 1
        assert log_entries[0].action == ModerationAction.CREATE
        assert log_entries[0].reason == "Object created."
        assert log_entries[0].moderator_user_id == user.id


def test_add_to_moderation_queue(db):
    """Test adding content to moderation queue via API"""
    super_user, super_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, _ = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a real host request (which automatically creates moderation state and adds to queue)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Get the moderation state ID
    state_id = None
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    # Add another item to moderation queue via API (the first one was created automatically)
    with real_moderation_session(super_token) as api:
        res = api.FlagContentForReview(
            moderation_pb2.FlagContentForReviewReq(
                moderation_state_id=state_id,
                trigger=moderation_pb2.MODERATION_TRIGGER_USER_FLAG,
                reason="Admin manually flagged for additional review",
            )
        )

        assert res.queue_item.moderation_state_id == state_id
        assert res.queue_item.trigger == moderation_pb2.MODERATION_TRIGGER_USER_FLAG
        assert res.queue_item.reason == "Admin manually flagged for additional review"
        assert res.queue_item.moderation_state.author_user_id == user1.id
        assert res.queue_item.is_resolved == False


def test_moderate_content(db):
    """Test moderating content via API"""
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    host, _ = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a real host request
    state_id = None
    with requests_session(token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    with session_scope() as session:
        hr = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr_id)).scalar_one()
        state_id = hr.moderation_state_id

    # Moderate the content via API
    with real_moderation_session(super_token) as api:
        res = api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Content looks good",
            )
        )

        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_VISIBLE

    # Check that state was updated in database
    with session_scope() as session:
        updated_state = session.get_one(ModerationState, state_id)
        assert updated_state.visibility == ModerationVisibility.VISIBLE

        # Check that log entry was created
        log_entries = (
            session.execute(
                select(ModerationLog)
                .where(ModerationLog.moderation_state_id == state_id)
                .order_by(ModerationLog.time.desc(), ModerationLog.id.desc())
            )
            .scalars()
            .all()
        )

        assert len(log_entries) == 2  # CREATE + APPROVE
        assert log_entries[0].action == ModerationAction.APPROVE
        assert log_entries[0].moderator_user_id == super_user.id
        assert log_entries[0].reason == "Content looks good"


def test_resolve_queue_item(db):
    """Test resolving a moderation queue item via ModerateContent API"""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    moderator, moderator_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request using the API (which automatically creates moderation state)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    state_id = None
    with session_scope() as session:
        # Get the host request and its moderation state
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

        # The moderation state should already exist and be in the queue
        queue_item = session.execute(
            select(ModerationQueueItem)
            .where(ModerationQueueItem.moderation_state_id == host_request.moderation_state_id)
            .where(ModerationQueueItem.resolved_by_log_id.is_(None))
        ).scalar_one()

        assert queue_item.resolved_by_log_id is None

    # Approve content via API (which should resolve the queue item)
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Approved after review",
            )
        )

    # Check that queue item was resolved
    with session_scope() as session:
        queue_item = session.execute(
            select(ModerationQueueItem)
            .where(ModerationQueueItem.moderation_state_id == state_id)
            .where(ModerationQueueItem.resolved_by_log_id.is_not(None))
        ).scalar_one()
        assert queue_item.resolved_by_log_id is not None


def test_approve_content_via_api(db):
    """Test approving content via ModerateContent API"""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    moderator, moderator_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request using the API (which automatically creates moderation state)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    state_id = None
    with session_scope() as session:
        # Get the host request and its moderation state
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    # Approve via API
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Quick approval",
            )
        )

    # Check that state was updated to VISIBLE
    with session_scope() as session:
        updated_state = session.get_one(ModerationState, state_id)
        assert updated_state.visibility == ModerationVisibility.VISIBLE

        # Check log entry
        log_entry = session.execute(
            select(ModerationLog)
            .where(ModerationLog.moderation_state_id == state_id)
            .where(ModerationLog.action == ModerationAction.APPROVE)
        ).scalar_one()

        assert log_entry.moderator_user_id == moderator.id
        assert log_entry.reason == "Quick approval"


# ============================================================================
# Tests for host request moderation integration
# ============================================================================


def test_create_host_request_creates_moderation_state(db):
    """Test that creating a host request automatically creates a moderation state"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    with session_scope() as session:
        # Check that host request has a moderation state
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()

        # Check moderation state properties
        moderation_state = session.execute(
            select(ModerationState).where(ModerationState.id == host_request.moderation_state_id)
        ).scalar_one()

        assert moderation_state.object_type == ModerationObjectType.HOST_REQUEST
        assert moderation_state.object_id == host_request_id
        assert moderation_state.visibility == ModerationVisibility.SHADOWED

        # Check that it was added to moderation queue
        queue_items = (
            session.execute(
                select(ModerationQueueItem)
                .where(ModerationQueueItem.moderation_state_id == moderation_state.id)
                .where(ModerationQueueItem.resolved_by_log_id == None)
            )
            .scalars()
            .all()
        )

        assert len(queue_items) == 1
        assert queue_items[0].trigger == ModerationTrigger.INITIAL_REVIEW
        # item_author_user_id is no longer stored in the model, it's dynamically retrieved


def test_host_request_no_notification_before_approval(db, push_collector: PushCollector):
    """Test that host requests don't send notifications until approved"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Process all jobs (including the notification job)
    process_jobs()

    # No push notification should be sent yet (host requests are shadowed initially)
    assert push_collector.count_for_user(user2.id) == 0


def test_shadowed_notification_not_in_list_notifications(db):
    """Test that notifications for shadowed content don't appear in ListNotifications API"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request (which creates a shadowed notification for the host)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Host (recipient) should NOT see the notification in ListNotifications - it's for shadowed content
    with notifications_session(token2) as api:
        res = api.ListNotifications(notifications_pb2.ListNotificationsReq())
        # Should be empty - the host request is still shadowed
        assert len(res.notifications) == 0


def test_notification_visible_after_approval(db):
    """Test that notifications appear in ListNotifications after content is approved"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    mod, mod_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request (which creates a shadowed notification for the host)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Host (recipient) should NOT see the notification initially
    with notifications_session(token2) as api:
        res = api.ListNotifications(notifications_pb2.ListNotificationsReq())
        assert len(res.notifications) == 0

    # Get the moderation state ID and approve
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    with real_moderation_session(mod_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Looks good",
            )
        )

    # Now host SHOULD see the notification
    with notifications_session(token2) as api:
        res = api.ListNotifications(notifications_pb2.ListNotificationsReq())
        assert len(res.notifications) == 1
        assert res.notifications[0].topic == "host_request"
        assert res.notifications[0].action == "create"


def test_shadowed_host_request_visible_to_author_only(db):
    """Test that SHADOWED host requests are visible only to the author (surfer), not the recipient (host)"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Surfer (author) can see it with GetHostRequest
    with requests_session(token1) as api:
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.host_request_id == host_request_id
        assert res.latest_message.text.text == valid_request_text()

    # Host (recipient) CANNOT see it with GetHostRequest - it's shadowed
    with requests_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_unlisted_host_request_not_in_lists(db):
    """Test that SHADOWED host requests are visible to author but not to recipient"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Surfer (author) should see it in their sent list even though it's SHADOWED
    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 1

    # Host should NOT see it in their received list (still SHADOWED from them)
    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 0


def test_approved_host_request_in_lists_and_notifications(db, push_collector: PushCollector):
    """Test that approved host requests appear in lists and send notifications"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    mod, mod_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Process the initial notification job - should be deferred (no notification sent)
    process_jobs()
    assert push_collector.count_for_user(user2.id) == 0

    # Get the moderation state ID
    state_id = None
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    # Approve the host request via API
    with real_moderation_session(mod_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Looks good",
            )
        )

    # Process the re-queued notification job - should now send notification
    process_jobs()

    # Now surfer SHOULD see it in their sent list
    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].host_request_id == host_request_id

    # Host SHOULD see it in their received list
    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].host_request_id == host_request_id

    # After approval, the host should have received a push notification
    assert push_collector.pop_for_user(user2.id, last=True).topic_action == "host_request:create"


def test_hidden_host_request_invisible_to_all(db):
    """Test that HIDDEN host requests are invisible to everyone except moderators"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    user3, token3 = generate_user()  # Third party
    moderator, moderator_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Get the moderation state ID
    state_id = None
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    # Hide the host request via API (e.g., spam/abuse)
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="Spam content",
            )
        )

    # Surfer can't see it with GetHostRequest
    with requests_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # Host can't see it with GetHostRequest
    with requests_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # Third party definitely can't see it
    with requests_session(token3) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # Not in any lists
    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 0

    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 0


def test_multiple_host_requests_listing_visibility(db):
    """Test that ListHostRequests correctly filters based on moderation state"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    moderator, moderator_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create 3 host requests
    host_request_ids = []
    state_ids = []
    with requests_session(token1) as api:
        for i in range(3):
            hr_id = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    recipient_user_id=user2.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=valid_request_text(f"Test request {i + 1}"),
                )
            ).host_request_id
            host_request_ids.append(hr_id)

    # Get state IDs
    with session_scope() as session:
        for hr_id in host_request_ids:
            host_request = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr_id)).scalar_one()
            state_ids.append(host_request.moderation_state_id)

    # Approve the first one via API
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_ids[0],
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Approved",
            )
        )

    # Hide the third one via API
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_ids[2],
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="Spam",
            )
        )

    # Surfer should see the approved one and the shadowed one (author can see their SHADOWED content)
    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 2
        visible_ids = {hr.host_request_id for hr in res.host_requests}
        assert visible_ids == {host_request_ids[0], host_request_ids[1]}

    # Host should see only the approved one in received list
    with requests_session(token2) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].host_request_id == host_request_ids[0]


def test_moderation_log_tracking(db):
    """Test that moderation actions are properly logged via API"""
    user, user_token = generate_user()
    host, _ = generate_user()
    moderator1, moderator1_token = generate_user(is_superuser=True)
    moderator2, moderator2_token = generate_user(is_superuser=True)

    # Create a real host request
    state_id = create_test_host_request_with_moderation(user_token, host.id)

    # Perform several moderation actions via API
    with real_moderation_session(moderator1_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Looks good initially",
            )
        )

    with real_moderation_session(moderator2_token) as api:
        api.FlagContentForReview(
            moderation_pb2.FlagContentForReviewReq(
                moderation_state_id=state_id,
                trigger=moderation_pb2.MODERATION_TRIGGER_MODERATOR_REVIEW,
                reason="Wait, this needs another look",
            )
        )
        # Shadow it back
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_SHADOWED,
                reason="Wait, this needs another look",
            )
        )

    with real_moderation_session(moderator1_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="Actually it's spam",
            )
        )

    # Check all log entries
    with session_scope() as session:
        log_entries = (
            session.execute(
                select(ModerationLog)
                .where(ModerationLog.moderation_state_id == state_id)
                .order_by(ModerationLog.time.asc())
            )
            .scalars()
            .all()
        )

        # CREATE + APPROVE + HIDE + HIDE (shadowing back counts as HIDE action)
        assert len(log_entries) >= 3

        assert log_entries[0].action == ModerationAction.CREATE
        assert log_entries[0].moderator_user_id == user.id
        assert log_entries[0].reason == "Object created."

        assert log_entries[1].action == ModerationAction.APPROVE
        assert log_entries[1].moderator_user_id == moderator1.id
        assert log_entries[1].reason == "Looks good initially"

        # The last action should be hiding
        assert log_entries[-1].action == ModerationAction.HIDE
        assert log_entries[-1].moderator_user_id == moderator1.id
        assert log_entries[-1].reason == "Actually it's spam"


def test_moderation_queue_workflow(db):
    """Test the full moderation queue workflow via API"""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    moderator, moderator_token = generate_user(is_superuser=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request using the API (which automatically creates moderation state and adds to queue)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    state_id = None
    queue_item_id = None
    with session_scope() as session:
        # Get the host request and its moderation state
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

        # The queue item should already exist (created automatically)
        queue_item = session.execute(
            select(ModerationQueueItem)
            .where(ModerationQueueItem.moderation_state_id == host_request.moderation_state_id)
            .where(ModerationQueueItem.resolved_by_log_id.is_(None))
        ).scalar_one()
        queue_item_id = queue_item.id

        # Verify it's in the queue
        unresolved_items = (
            session.execute(select(ModerationQueueItem).where(ModerationQueueItem.resolved_by_log_id == None))
            .scalars()
            .all()
        )

        assert len(unresolved_items) >= 1
        assert queue_item.id in [item.id for item in unresolved_items]

    # Moderator reviews and approves via API (which also resolves the queue item)
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Content approved",
            )
        )

    # Verify queue item was resolved
    with session_scope() as session:
        # Verify it's no longer in unresolved queue
        unresolved_items = (
            session.execute(select(ModerationQueueItem).where(ModerationQueueItem.resolved_by_log_id == None))
            .scalars()
            .all()
        )

        assert queue_item_id not in [item.id for item in unresolved_items]

        # Verify the queue item was linked to a log entry
        queue_item = session.get_one(ModerationQueueItem, queue_item_id)
        assert queue_item.resolved_by_log_id is not None


# ============================================================================
# Moderation API Tests (testing the gRPC servicer)
# ============================================================================


def test_GetModerationQueue_empty(db):
    """Test getting an empty moderation queue"""
    super_user, super_token = generate_user(is_superuser=True)

    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq())
        assert len(res.queue_items) == 0
        assert res.next_page_token == ""


def test_GetModerationQueue_with_items(db):
    """Test getting moderation queue with items via API"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create some host requests (which automatically adds them to moderation queue)
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)

    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq())
        assert len(res.queue_items) == 2
        assert res.queue_items[0].is_resolved == False
        assert res.queue_items[1].is_resolved == False


def test_GetModerationQueue_filter_by_trigger(db):
    """Test filtering moderation queue by trigger type via API"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create host requests (which automatically adds them to moderation queue with INITIAL_REVIEW)
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)

    # Add USER_FLAG trigger to second item via API
    with real_moderation_session(super_token) as api:
        api.FlagContentForReview(
            moderation_pb2.FlagContentForReviewReq(
                moderation_state_id=state2_id,
                trigger=moderation_pb2.MODERATION_TRIGGER_USER_FLAG,
                reason="Reported by user",
            )
        )

    # Filter by INITIAL_REVIEW (should get first item and maybe both depending on how queue works)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(triggers=[moderation_pb2.MODERATION_TRIGGER_INITIAL_REVIEW])
        )
        assert len(res.queue_items) == 2  # Both have INITIAL_REVIEW triggers
        assert all(item.trigger == moderation_pb2.MODERATION_TRIGGER_INITIAL_REVIEW for item in res.queue_items)

    # Filter by USER_FLAG (should get second item only)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(triggers=[moderation_pb2.MODERATION_TRIGGER_USER_FLAG])
        )
        assert len(res.queue_items) == 1
        assert res.queue_items[0].trigger == moderation_pb2.MODERATION_TRIGGER_USER_FLAG


def test_GetModerationQueue_filter_created_before(db):
    """Test filtering moderation queue by created_before timestamp"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create host requests
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)

    # Backdate the first queue item
    with session_scope() as session:
        queue_item1 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state1_id)
        ).scalar_one()
        # Set it to 2 hours ago
        queue_item1.time_created = now() - timedelta(hours=2)

    # The second item remains at current time

    # Filter to items created before 1 hour ago (should only get the first item)
    cutoff_time = now() - timedelta(hours=1)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(created_before=Timestamp_from_datetime(cutoff_time))
        )
        assert len(res.queue_items) == 1
        assert res.queue_items[0].moderation_state_id == state1_id

    # Filter to items created before now (should get both)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(created_before=Timestamp_from_datetime(now() + timedelta(seconds=10)))
        )
        assert len(res.queue_items) == 2

    # Filter to items created before 3 hours ago (should get none)
    old_cutoff = now() - timedelta(hours=3)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(created_before=Timestamp_from_datetime(old_cutoff))
        )
        assert len(res.queue_items) == 0


def test_GetModerationQueue_filter_created_after(db):
    """Test filtering moderation queue by created_after timestamp"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create host requests
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)

    # Backdate the first queue item to 2 hours ago
    with session_scope() as session:
        queue_item1 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state1_id)
        ).scalar_one()
        queue_item1.time_created = now() - timedelta(hours=2)

    # The second item remains at current time

    # Filter to items created after 1 hour ago (should only get the second item)
    cutoff_time = now() - timedelta(hours=1)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(created_after=Timestamp_from_datetime(cutoff_time))
        )
        assert len(res.queue_items) == 1
        assert res.queue_items[0].moderation_state_id == state2_id

    # Filter to items created after 3 hours ago (should get both)
    old_cutoff = now() - timedelta(hours=3)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(created_after=Timestamp_from_datetime(old_cutoff))
        )
        assert len(res.queue_items) == 2

    # Filter to items created after now (should get none)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(created_after=Timestamp_from_datetime(now() + timedelta(seconds=10)))
        )
        assert len(res.queue_items) == 0


def test_GetModerationQueue_filter_created_before_and_after(db):
    """Test filtering moderation queue by both created_before and created_after timestamps"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create 3 host requests
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)
    state3_id = create_test_host_request_with_moderation(user_token, host.id)

    # Set different times: state1 = 3 hours ago, state2 = 1.5 hours ago, state3 = now
    with session_scope() as session:
        queue_item1 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state1_id)
        ).scalar_one()
        queue_item1.time_created = now() - timedelta(hours=3)

        queue_item2 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state2_id)
        ).scalar_one()
        queue_item2.time_created = now() - timedelta(hours=1, minutes=30)

    # Filter to items between 2 hours ago and 1 hour ago (should only get state2)
    after_cutoff = now() - timedelta(hours=2)
    before_cutoff = now() - timedelta(hours=1)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(
                created_after=Timestamp_from_datetime(after_cutoff),
                created_before=Timestamp_from_datetime(before_cutoff),
            )
        )
        assert len(res.queue_items) == 1
        assert res.queue_items[0].moderation_state_id == state2_id

    # Filter to items between 4 hours ago and 2.5 hours ago (should only get state1)
    after_cutoff = now() - timedelta(hours=4)
    before_cutoff = now() - timedelta(hours=2, minutes=30)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(
                created_after=Timestamp_from_datetime(after_cutoff),
                created_before=Timestamp_from_datetime(before_cutoff),
            )
        )
        assert len(res.queue_items) == 1
        assert res.queue_items[0].moderation_state_id == state1_id


def test_GetModerationQueue_filter_unresolved(db):
    """Test filtering moderation queue for unresolved items only via API"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create 2 host requests
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)

    # Resolve the first one via API (ModerateContent automatically resolves queue items)
    with real_moderation_session(super_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state1_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Approved",
            )
        )

    # Get all items
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq())
        assert len(res.queue_items) == 2

    # Get only unresolved items
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(unresolved_only=True))
        assert len(res.queue_items) == 1
        assert res.queue_items[0].is_resolved == False


def test_GetModerationQueue_filter_by_author(db):
    """Test filtering moderation queue by item_author_user_id"""
    super_user, super_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    host_user, _ = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create 2 host requests by user1
    with requests_session(token1) as api:
        hr1_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host_user.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

        hr2_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host_user.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Create 1 host request by user2
    with requests_session(token2) as api:
        hr3_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host_user.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Get moderation state IDs
    state1_id, state2_id, state3_id = None, None, None
    with session_scope() as session:
        hr1 = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr1_id)).scalar_one()
        hr2 = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr2_id)).scalar_one()
        hr3 = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr3_id)).scalar_one()
        state1_id = hr1.moderation_state_id
        state2_id = hr2.moderation_state_id
        state3_id = hr3.moderation_state_id

    # Get all items (should be 3)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq())
        assert len(res.queue_items) == 3

    # Filter by user1 (should get 2)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(item_author_user_id=user1.id))
        assert len(res.queue_items) == 2
        assert all(item.moderation_state.author_user_id == user1.id for item in res.queue_items)

    # Filter by user2 (should get 1)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(item_author_user_id=user2.id))
        assert len(res.queue_items) == 1
        assert res.queue_items[0].moderation_state.author_user_id == user2.id
        assert res.queue_items[0].moderation_state_id == state3_id

    # Filter by non-existent user (should get 0)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(item_author_user_id=999999))
        assert len(res.queue_items) == 0


def test_GetModerationQueue_ordering(db):
    """Test ordering moderation queue by oldest/newest first"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create 3 host requests
    state1_id = create_test_host_request_with_moderation(user_token, host.id)
    state2_id = create_test_host_request_with_moderation(user_token, host.id)
    state3_id = create_test_host_request_with_moderation(user_token, host.id)

    # Set different times: state1 = 3 hours ago, state2 = 2 hours ago, state3 = 1 hour ago
    with session_scope() as session:
        queue_item1 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state1_id)
        ).scalar_one()
        queue_item1.time_created = now() - timedelta(hours=3)

        queue_item2 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state2_id)
        ).scalar_one()
        queue_item2.time_created = now() - timedelta(hours=2)

        queue_item3 = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state3_id)
        ).scalar_one()
        queue_item3.time_created = now() - timedelta(hours=1)

    # Default order (oldest first)
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq())
        assert len(res.queue_items) == 3
        assert res.queue_items[0].moderation_state_id == state1_id  # oldest
        assert res.queue_items[1].moderation_state_id == state2_id
        assert res.queue_items[2].moderation_state_id == state3_id  # newest

    # Explicit oldest first
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(newest_first=False))
        assert len(res.queue_items) == 3
        assert res.queue_items[0].moderation_state_id == state1_id  # oldest
        assert res.queue_items[2].moderation_state_id == state3_id  # newest

    # Newest first
    with real_moderation_session(super_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(newest_first=True))
        assert len(res.queue_items) == 3
        assert res.queue_items[0].moderation_state_id == state3_id  # newest
        assert res.queue_items[1].moderation_state_id == state2_id
        assert res.queue_items[2].moderation_state_id == state1_id  # oldest


def test_GetModerationQueue_pagination_newest_first(db):
    """Test pagination with newest_first=True returns different items on each page"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()
    host_user, _ = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create 5 host requests
    hr_ids = []
    with requests_session(normal_token) as api:
        for i in range(5):
            hr_id = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    recipient_user_id=host_user.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=valid_request_text(),
                )
            ).host_request_id
            hr_ids.append(hr_id)

    # Get moderation state IDs
    state_ids = []
    with session_scope() as session:
        for hr_id in hr_ids:
            hr = session.execute(select(HostRequest).where(HostRequest.conversation_id == hr_id)).scalar_one()
            state_ids.append(hr.moderation_state_id)

    # Set different times so ordering is deterministic
    with session_scope() as session:
        for i, state_id in enumerate(state_ids):
            queue_item = session.execute(
                select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state_id)
            ).scalar_one()
            queue_item.time_created = now() - timedelta(hours=5 - i)  # oldest first in list

    # Get first page (2 items) with newest_first=True, filtered to our user's items
    with real_moderation_session(super_token) as api:
        res1 = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(page_size=2, newest_first=True, item_author_user_id=normal_user.id)
        )
        assert len(res1.queue_items) == 2
        # Should get newest items: state_ids[4], state_ids[3]
        assert res1.queue_items[0].moderation_state_id == state_ids[4]
        assert res1.queue_items[1].moderation_state_id == state_ids[3]
        assert res1.next_page_token  # should have more pages

        # Get second page using the token
        res2 = api.GetModerationQueue(
            moderation_pb2.GetModerationQueueReq(
                page_size=2, newest_first=True, page_token=res1.next_page_token, item_author_user_id=normal_user.id
            )
        )
        assert len(res2.queue_items) == 2
        # Should get next newest items: state_ids[2], state_ids[1]
        assert res2.queue_items[0].moderation_state_id == state_ids[2]
        assert res2.queue_items[1].moderation_state_id == state_ids[1]

        # Pages should not overlap
        page1_ids = {item.moderation_state_id for item in res1.queue_items}
        page2_ids = {item.moderation_state_id for item in res2.queue_items}
        assert page1_ids.isdisjoint(page2_ids), "Pages should not have overlapping items"


def test_GetModerationLog(db):
    """Test getting moderation log for a state via API"""
    super_user, super_token = generate_user(is_superuser=True)
    moderator, moderator_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create a real host request
    state_id = create_test_host_request_with_moderation(user_token, host.id)

    # Perform a moderation action via API
    with real_moderation_session(moderator_token) as api:
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Looks good",
            )
        )

    with real_moderation_session(super_token) as api:
        res = api.GetModerationLog(moderation_pb2.GetModerationLogReq(moderation_state_id=state_id))
        assert len(res.log_entries) == 2  # CREATE + APPROVE
        assert res.moderation_state.moderation_state_id == state_id
        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_VISIBLE
        # Log entries are in reverse chronological order
        assert res.log_entries[0].action == moderation_pb2.MODERATION_ACTION_APPROVE
        assert res.log_entries[0].moderator_user_id == moderator.id
        assert res.log_entries[0].reason == "Looks good"
        assert res.log_entries[1].action == moderation_pb2.MODERATION_ACTION_CREATE
        assert res.log_entries[1].moderator_user_id == normal_user.id


def test_GetModerationLog_not_found(db):
    """Test getting moderation log for non-existent state"""
    super_user, super_token = generate_user(is_superuser=True)

    with real_moderation_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetModerationLog(moderation_pb2.GetModerationLogReq(moderation_state_id=999999))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Moderation state not found."


def test_GetModerationState(db):
    """Test getting moderation state by object type and ID"""
    super_user, super_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, _ = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    with real_moderation_session(super_token) as api:
        res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        assert res.moderation_state.object_type == moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST
        assert res.moderation_state.object_id == host_request_id
        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_SHADOWED
        assert res.moderation_state.moderation_state_id > 0


def test_GetModerationState_not_found(db):
    """Test getting moderation state for non-existent object"""
    super_user, super_token = generate_user(is_superuser=True)

    with real_moderation_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                    object_id=999999,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Moderation state not found."


def test_GetModerationState_unspecified_type(db):
    """Test getting moderation state with unspecified object type"""
    super_user, super_token = generate_user(is_superuser=True)

    with real_moderation_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetModerationState(
                moderation_pb2.GetModerationStateReq(
                    object_type=moderation_pb2.MODERATION_OBJECT_TYPE_UNSPECIFIED,
                    object_id=123,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Object type must be specified."


def test_ModerateContent_approve(db):
    """Test approving content via unified moderation API"""
    super_user, super_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, _ = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request using the API (which automatically creates moderation state)
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Get the moderation state ID
    state_id = None
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    with real_moderation_session(super_token) as api:
        res = api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Approved by admin",
            )
        )
        assert res.moderation_state.moderation_state_id == state_id
        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_VISIBLE

    # Verify state was updated in database
    with session_scope() as session:
        state = session.get_one(ModerationState, state_id)
        assert state.visibility == ModerationVisibility.VISIBLE


def test_ModerateContent_not_found(db):
    """Test moderating non-existent content"""
    super_user, super_token = generate_user(is_superuser=True)

    with real_moderation_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.ModerateContent(
                moderation_pb2.ModerateContentReq(
                    moderation_state_id=999999,
                    action=moderation_pb2.MODERATION_ACTION_APPROVE,
                    visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                    reason="Test",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Moderation state not found."


def test_ModerateContent_hide(db):
    """Test hiding content via unified moderation API"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create a real host request
    state_id = create_test_host_request_with_moderation(user_token, host.id)

    with real_moderation_session(super_token) as api:
        res = api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="Spam content",
            )
        )
        assert res.moderation_state.moderation_state_id == state_id
        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_HIDDEN

    # Verify state was updated in database
    with session_scope() as session:
        state = session.get_one(ModerationState, state_id)
        assert state.visibility == ModerationVisibility.HIDDEN


def test_ModerateContent_shadow(db):
    """Test shadowing content via unified moderation API"""
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, user_token = generate_user()
    host, _ = generate_user()

    # Create a real host request
    state_id = create_test_host_request_with_moderation(user_token, host.id)

    with real_moderation_session(super_token) as api:
        res = api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_SHADOWED,
                reason="Needs further review",
            )
        )
        assert res.moderation_state.moderation_state_id == state_id
        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_SHADOWED

    # Verify state was updated in database
    with session_scope() as session:
        state = session.get_one(ModerationState, state_id)
        assert state.visibility == ModerationVisibility.SHADOWED


def test_FlagContentForReview(db):
    """Test flagging content for review via admin API"""
    super_user, super_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, _ = generate_user()

    # Create a host request
    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Get the moderation state ID
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        state_id = host_request.moderation_state_id

    with real_moderation_session(super_token) as api:
        res = api.FlagContentForReview(
            moderation_pb2.FlagContentForReviewReq(
                moderation_state_id=state_id,
                trigger=moderation_pb2.MODERATION_TRIGGER_MODERATOR_REVIEW,
                reason="Admin flagged for additional review",
            )
        )
        assert res.queue_item.moderation_state_id == state_id
        assert res.queue_item.trigger == moderation_pb2.MODERATION_TRIGGER_MODERATOR_REVIEW
        assert res.queue_item.is_resolved == False

    # Verify queue item was created in database
    with session_scope() as session:
        # Get the most recent queue item (the one we just created)
        queue_item = (
            session.execute(
                select(ModerationQueueItem)
                .where(ModerationQueueItem.moderation_state_id == state_id)
                .order_by(ModerationQueueItem.time_created.desc())
            )
            .scalars()
            .first()
        )
        assert queue_item
        assert queue_item.trigger == ModerationTrigger.MODERATOR_REVIEW
        assert queue_item.resolved_by_log_id is None


# ============================================================================
# Tests for group chat moderation
# ============================================================================


def test_group_chat_created_with_moderation_state(db):
    """Test that group chats are created with moderation state"""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    make_friends(user1, user2)

    with conversations_session(token1) as api:
        res = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id

    # Verify moderation state was created
    with session_scope() as session:
        group_chat = session.execute(select(GroupChat).where(GroupChat.conversation_id == group_chat_id)).scalar_one()

        assert group_chat.moderation_state.object_type == ModerationObjectType.GROUP_CHAT
        assert group_chat.moderation_state.object_id == group_chat_id
        # Group chats start as SHADOWED
        assert group_chat.moderation_state.visibility == ModerationVisibility.SHADOWED

        # A moderation queue item should have been created
        queue_item = (
            session.execute(
                select(ModerationQueueItem).where(
                    ModerationQueueItem.moderation_state_id == group_chat.moderation_state_id
                )
            )
            .scalars()
            .first()
        )
        assert queue_item is not None
        assert queue_item.trigger == ModerationTrigger.INITIAL_REVIEW


def test_group_chat_GetModerationState(db):
    """Test GetModerationState API for group chats"""
    user1, token1 = generate_user()
    user2, _ = generate_user()
    moderator, mod_token = generate_user(is_superuser=True)
    make_friends(user1, user2)

    with conversations_session(token1) as api:
        res = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id

    # Moderator can look up the moderation state
    with real_moderation_session(mod_token) as api:
        res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
                object_id=group_chat_id,
            )
        )
        assert res.moderation_state.object_type == moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT
        assert res.moderation_state.object_id == group_chat_id
        # Starts as SHADOWED
        assert res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_SHADOWED


def test_group_chat_moderation_hide(db):
    """Test that a moderator can hide a group chat and participants can no longer see it"""
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    moderator, mod_token = generate_user(is_superuser=True)
    make_friends(user1, user2)

    with conversations_session(token1) as api:
        res = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Hello!"))

    # First approve the group chat so both users can see it
    with real_moderation_session(mod_token) as api:
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
                object_id=group_chat_id,
            )
        )
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_res.moderation_state.moderation_state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Approved",
            )
        )

    # Both users can see the chat now
    with conversations_session(token1) as api:
        res = api.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1

    with conversations_session(token2) as api:
        res = api.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1

    # Moderator hides the group chat
    with real_moderation_session(mod_token) as api:
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
                object_id=group_chat_id,
            )
        )
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_res.moderation_state.moderation_state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_HIDDEN,
                reason="Inappropriate content",
            )
        )

    # Neither user can see the chat now
    with conversations_session(token1) as api:
        res = api.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

    with conversations_session(token2) as api:
        res = api.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

    # Trying to get messages returns empty (chat is hidden so no messages visible)
    with conversations_session(token1) as api:
        res = api.GetGroupChatMessages(conversations_pb2.GetGroupChatMessagesReq(group_chat_id=group_chat_id))
        assert len(res.messages) == 0


def test_group_chat_moderation_shadow(db):
    """Test that shadowing a group chat hides it from non-creator participants"""
    user1, token1 = generate_user()  # Creator
    user2, token2 = generate_user()  # Participant
    moderator, mod_token = generate_user(is_superuser=True)
    make_friends(user1, user2)

    with conversations_session(token1) as api:
        res = api.CreateGroupChat(conversations_pb2.CreateGroupChatReq(recipient_user_ids=[user2.id]))
        group_chat_id = res.group_chat_id
        api.SendMessage(conversations_pb2.SendMessageReq(group_chat_id=group_chat_id, text="Hello!"))

    # Moderator shadows the group chat
    with real_moderation_session(mod_token) as api:
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_GROUP_CHAT,
                object_id=group_chat_id,
            )
        )
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_res.moderation_state.moderation_state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_SHADOWED,
                reason="Needs review",
            )
        )

    # Creator can see SHADOWED content in list operations
    with conversations_session(token1) as api:
        res = api.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 1
        assert res.group_chats[0].group_chat_id == group_chat_id

    # But non-creator participant cannot see it in lists
    with conversations_session(token2) as api:
        res = api.ListGroupChats(conversations_pb2.ListGroupChatsReq())
        assert len(res.group_chats) == 0

    # Creator can also access it directly via GetGroupChat
    with conversations_session(token1) as api:
        res = api.GetGroupChat(conversations_pb2.GetGroupChatReq(group_chat_id=group_chat_id))
        assert res.group_chat_id == group_chat_id


# ============================================================================
# Tests for auto-approval background job
# ============================================================================


def test_auto_approve_moderation_queue_disabled_when_zero(db):
    """Test that auto-approval is disabled when deadline is 0"""
    moderator, mod_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request
    with requests_session(token1) as api:
        with mock_notification_email() as mock:
            host_request_id = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    recipient_user_id=user2.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=valid_request_text(),
                )
            ).host_request_id

        # No email should have been sent (request is shadowed)
        mock.assert_not_called()

        # Ensure deadline is 0 (disabled)
        config["MODERATION_AUTO_APPROVE_DEADLINE_SECONDS"] = 0

        # Run the job
        auto_approve_moderation_queue(empty_pb2.Empty())

        # Surfer (author) can see the request via API
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.host_request_id == host_request_id

        # Author can see their SHADOWED request in their sent list
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].host_request_id == host_request_id

    # Host cannot see the request (it's shadowed from them)
    with requests_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # Host doesn't see it in their received list either
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 0

    # Moderator can still see the item in the moderation queue
    with real_moderation_session(mod_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(unresolved_only=True))
        assert len(res.queue_items) == 1
        assert res.queue_items[0].trigger == moderation_pb2.MODERATION_TRIGGER_INITIAL_REVIEW

        # Moderator can check the state is still SHADOWED
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        assert state_res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_SHADOWED


def test_auto_approve_moderation_queue_approves_old_items(db, push_collector: PushCollector):
    """Test that auto-approval approves items older than the deadline"""
    moderator, mod_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request
    with requests_session(token1) as api:
        with mock_notification_email() as mock:
            host_request_id = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    recipient_user_id=user2.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=valid_request_text("Test request for auto-approval"),
                )
            ).host_request_id

        # No email sent initially (shadowed)
        mock.assert_not_called()

    # Host cannot see the request yet
    with requests_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

    # Make the queue item appear old by backdating its time_created
    with session_scope() as session:
        host_request = session.execute(
            select(HostRequest).where(HostRequest.conversation_id == host_request_id)
        ).scalar_one()
        queue_item = session.execute(
            select(ModerationQueueItem)
            .where(ModerationQueueItem.moderation_state_id == host_request.moderation_state_id)
            .where(ModerationQueueItem.resolved_by_log_id.is_(None))
        ).scalar_one()
        # Backdate the queue item by 2 minutes
        queue_item.time_created = datetime.now(queue_item.time_created.tzinfo) - timedelta(minutes=2)

    # Set deadline to 60 seconds (items older than 60 seconds will be auto-approved)
    config["MODERATION_AUTO_APPROVE_DEADLINE_SECONDS"] = 60
    config["MODERATION_BOT_USER_ID"] = moderator.id

    # Run the job
    auto_approve_moderation_queue(empty_pb2.Empty())

    # Now host can see the request via API
    with requests_session(token2) as api:
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.host_request_id == host_request_id
        assert res.latest_message.text.text == valid_request_text("Test request for auto-approval")

        # Host sees it in their received list
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].host_request_id == host_request_id

    # Surfer sees it in their sent list
    with requests_session(token1) as api:
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_sent=True))
        assert len(res.host_requests) == 1
        assert res.host_requests[0].host_request_id == host_request_id

    # Moderator sees the queue item is now resolved
    with real_moderation_session(mod_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(unresolved_only=True))
        assert len(res.queue_items) == 0

        # State is now VISIBLE
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        assert state_res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_VISIBLE

        # Check the log shows auto-approval by the bot user
        log_res = api.GetModerationLog(
            moderation_pb2.GetModerationLogReq(moderation_state_id=state_res.moderation_state.moderation_state_id)
        )
        # Find the APPROVE action
        approve_entries = [e for e in log_res.log_entries if e.action == moderation_pb2.MODERATION_ACTION_APPROVE]
        assert len(approve_entries) == 1
        assert "Auto-approved" in approve_entries[0].reason
        assert "60 seconds" in approve_entries[0].reason
        assert approve_entries[0].moderator_user_id == moderator.id


def test_auto_approve_does_not_approve_recent_items(db):
    """Test that auto-approval does not approve items that are newer than the deadline"""
    moderator, mod_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request
    with requests_session(token1) as api:
        with mock_notification_email() as mock:
            host_request_id = api.CreateHostRequest(
                requests_pb2.CreateHostRequestReq(
                    recipient_user_id=user2.id,
                    from_date=today_plus_2,
                    to_date=today_plus_3,
                    text=valid_request_text(),
                )
            ).host_request_id

        # No email sent (shadowed)
        mock.assert_not_called()

    # Set deadline to 1 hour (items older than 1 hour will be auto-approved)
    config["MODERATION_AUTO_APPROVE_DEADLINE_SECONDS"] = 3600
    config["MODERATION_BOT_USER_ID"] = moderator.id

    # Run the job - the item was just created, so it shouldn't be approved
    with mock_notification_email() as mock:
        auto_approve_moderation_queue(empty_pb2.Empty())

        # Still no email sent
        mock.assert_not_called()

    # Host still cannot see the request
    with requests_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND

        # Not in host's received list
        res = api.ListHostRequests(requests_pb2.ListHostRequestsReq(only_received=True))
        assert len(res.host_requests) == 0

    # Moderator sees it still in queue unresolved
    with real_moderation_session(mod_token) as api:
        res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(unresolved_only=True))
        assert len(res.queue_items) == 1

        # State is still SHADOWED
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        assert state_res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_SHADOWED


def test_auto_approve_does_not_approve_already_approved(db):
    """Test that auto-approval does not re-approve already visible content"""
    moderator, mod_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Moderator approves it manually
    with real_moderation_session(mod_token) as api:
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        state_id = state_res.moderation_state.moderation_state_id

        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_APPROVE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_VISIBLE,
                reason="Approved by moderator",
            )
        )

    # Host can now see it
    with requests_session(token2) as api:
        res = api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert res.host_request_id == host_request_id

    # Get log count before auto-approval
    with real_moderation_session(mod_token) as api:
        log_res_before = api.GetModerationLog(moderation_pb2.GetModerationLogReq(moderation_state_id=state_id))
        log_count_before = len(log_res_before.log_entries)

    # Set deadline to 1 second
    config["MODERATION_AUTO_APPROVE_DEADLINE_SECONDS"] = 1
    config["MODERATION_BOT_USER_ID"] = moderator.id

    # Run the job
    auto_approve_moderation_queue(empty_pb2.Empty())

    # No new log entries should be created (already approved, queue item resolved)
    with real_moderation_session(mod_token) as api:
        log_res_after = api.GetModerationLog(moderation_pb2.GetModerationLogReq(moderation_state_id=state_id))
        assert len(log_res_after.log_entries) == log_count_before

        # Queue should be empty (item was resolved when moderator approved)
        queue_res = api.GetModerationQueue(moderation_pb2.GetModerationQueueReq(unresolved_only=True))
        assert len(queue_res.queue_items) == 0


def test_auto_approve_does_not_approve_moderator_shadowed_items(db):
    """Test that auto-approval does not approve items that were explicitly shadowed by a moderator"""
    moderator, mod_token = generate_user(is_superuser=True)
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create a host request
    with requests_session(token1) as api:
        host_request_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=user2.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # Moderator explicitly shadows the content (keeping it shadowed but resolving the queue item)
    with real_moderation_session(mod_token) as api:
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        state_id = state_res.moderation_state.moderation_state_id

        # Set to SHADOWED explicitly - this resolves the INITIAL_REVIEW queue item
        api.ModerateContent(
            moderation_pb2.ModerateContentReq(
                moderation_state_id=state_id,
                action=moderation_pb2.MODERATION_ACTION_HIDE,
                visibility=moderation_pb2.MODERATION_VISIBILITY_SHADOWED,
                reason="Keeping shadowed for review",
            )
        )

    # Backdate to ensure it would be old enough for auto-approval
    with session_scope() as session:
        queue_item = session.execute(
            select(ModerationQueueItem).where(ModerationQueueItem.moderation_state_id == state_id)
        ).scalar_one()
        queue_item.time_created = datetime.now(queue_item.time_created.tzinfo) - timedelta(minutes=10)

    # Set deadline to 1 second
    config["MODERATION_AUTO_APPROVE_DEADLINE_SECONDS"] = 1
    config["MODERATION_BOT_USER_ID"] = moderator.id

    # Get log count before
    with real_moderation_session(mod_token) as api:
        log_res_before = api.GetModerationLog(moderation_pb2.GetModerationLogReq(moderation_state_id=state_id))
        log_count_before = len(log_res_before.log_entries)

    # Run the job
    auto_approve_moderation_queue(empty_pb2.Empty())

    # No new log entries - the queue item was resolved when moderator shadowed it
    with real_moderation_session(mod_token) as api:
        log_res_after = api.GetModerationLog(moderation_pb2.GetModerationLogReq(moderation_state_id=state_id))
        assert len(log_res_after.log_entries) == log_count_before

        # State should still be SHADOWED (not auto-approved to VISIBLE)
        state_res = api.GetModerationState(
            moderation_pb2.GetModerationStateReq(
                object_type=moderation_pb2.MODERATION_OBJECT_TYPE_HOST_REQUEST,
                object_id=host_request_id,
            )
        )
        assert state_res.moderation_state.visibility == moderation_pb2.MODERATION_VISIBILITY_SHADOWED

    # Host still cannot see the request
    with requests_session(token2) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetHostRequest(requests_pb2.GetHostRequestReq(host_request_id=host_request_id))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


# ============================================================================
# Notification Suppression Tests
# ============================================================================


def test_host_request_message_notifications_suppressed_before_approval(db, push_collector: PushCollector, moderator):
    """
    Test that notifications are NOT sent for messages in host requests
    that haven't been approved yet.
    """
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create host request (it starts in SHADOWED state)
    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text("Initial request message"),
            )
        ).host_request_id

    # No notifications should have been sent to the host (request is SHADOWED)
    assert push_collector.count_for_user(host.id) == 0

    # Send additional messages BEFORE approval - should NOT generate notifications
    with requests_session(surfer_token) as api:
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(
                host_request_id=hr_id,
                text="Follow-up message 1",
            )
        )
        api.SendHostRequestMessage(
            requests_pb2.SendHostRequestMessageReq(
                host_request_id=hr_id,
                text="Follow-up message 2",
            )
        )

    # Host should STILL have no notifications (messages sent while SHADOWED)
    assert push_collector.count_for_user(host.id) == 0

    # Now approve the request
    with mock_notification_email():
        moderator.approve_host_request(hr_id)

    # Host should now have 3 notifications (all deferred notifications are delivered on approval):
    # 1. host_request:create (the initial request)
    # 2. host_request:message (Follow-up message 1)
    # 3. host_request:message (Follow-up message 2)
    assert push_collector.count_for_user(host.id) == 3
    push = push_collector.pop_for_user(host.id, last=False)
    assert push.content.title == f"New host request from {surfer.name}"


def test_host_request_status_notifications_suppressed_before_approval(db, push_collector: PushCollector, moderator):
    """
    Test that status change notifications (accept/reject/etc.) are NOT sent
    for host requests that haven't been approved yet.

    Note: In practice, the host can't even SEE the request to accept/reject it
    when it's SHADOWED. But if they somehow did, we still shouldn't notify.
    """
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create host request
    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    # No notifications should have been sent to the host (request is SHADOWED)
    assert push_collector.count_for_user(host.id) == 0

    # The surfer can cancel their own request even when SHADOWED
    # But this should NOT notify the host since the request isn't approved
    with requests_session(surfer_token) as api:
        api.RespondHostRequest(
            requests_pb2.RespondHostRequestReq(
                host_request_id=hr_id,
                status=conversations_pb2.HOST_REQUEST_STATUS_CANCELLED,
                text="Actually, never mind",
            )
        )

    # Host should STILL have no notifications (cancel notification suppressed)
    assert push_collector.count_for_user(host.id) == 0


def test_host_request_notifications_sent_after_approval(db, push_collector: PushCollector, moderator):
    """
    Test that after a host request is approved, all notifications work normally.
    """
    host, host_token = generate_user(complete_profile=True)
    surfer, surfer_token = generate_user(complete_profile=True)

    today_plus_2 = (today() + timedelta(days=2)).isoformat()
    today_plus_3 = (today() + timedelta(days=3)).isoformat()

    # Create and approve host request
    with requests_session(surfer_token) as api:
        hr_id = api.CreateHostRequest(
            requests_pb2.CreateHostRequestReq(
                recipient_user_id=host.id,
                from_date=today_plus_2,
                to_date=today_plus_3,
                text=valid_request_text(),
            )
        ).host_request_id

    with mock_notification_email():
        moderator.approve_host_request(hr_id)

    # Host should have received 1 notification (the approval notification)
    push_collector.pop_for_user(host.id, last=True)

    # Host accepts the request - surfer should be notified
    with requests_session(host_token) as api:
        with mock_notification_email():
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=hr_id,
                    status=conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                    text="Sure, come on over!",
                )
            )

    # Surfer should have 1 notification (the accept notification)
    push = push_collector.pop_for_user(surfer.id, last=True)
    assert push.content.title == f"{host.name} accepted your host request"

    # Surfer confirms - host should be notified
    with requests_session(surfer_token) as api:
        with mock_notification_email():
            api.RespondHostRequest(
                requests_pb2.RespondHostRequestReq(
                    host_request_id=hr_id,
                    status=conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
                    text="See you then!",
                )
            )

    # Host should now have received the confirmation notifications
    push = push_collector.pop_for_user(host.id, last=True)
    assert push.content.title == f"{surfer.name} confirmed their host request"


def test_group_chat_message_notifications_suppressed_before_approval(db, push_collector: PushCollector, moderator):
    """
    Test that notifications are NOT sent for messages in group chats
    that haven't been approved yet.
    """
    from couchers.jobs.worker import process_job
    from couchers.models import GroupChat

    user1, token1 = generate_user(complete_profile=True)
    user2, token2 = generate_user(complete_profile=True)

    # Create a group chat (starts in SHADOWED state)
    with conversations_session(token1) as api:
        res = api.CreateGroupChat(
            conversations_pb2.CreateGroupChatReq(
                recipient_user_ids=[user2.id],
            )
        )
        gc_id = res.group_chat_id

    # Verify initial state
    with session_scope() as session:
        gc = session.execute(select(GroupChat).where(GroupChat.conversation_id == gc_id)).scalar_one()
        assert gc.moderation_state.visibility == ModerationVisibility.SHADOWED

    # No notifications should have been sent yet (chat is SHADOWED)
    assert push_collector.count_for_user(user2.id) == 0

    # Send messages BEFORE approval
    with conversations_session(token1) as api:
        api.SendMessage(
            conversations_pb2.SendMessageReq(
                group_chat_id=gc_id,
                text="Hello before approval",
            )
        )

    # Process the queued notification job
    while process_job():
        pass

    # User2 should STILL have no notifications (chat is SHADOWED)
    assert push_collector.count_for_user(user2.id) == 0

    # Now approve the group chat
    moderator.approve_group_chat(gc_id)

    # Process the queued notification jobs from approval
    while process_job():
        pass

    # Verify moderation state after approval
    with session_scope() as session:
        gc = session.execute(select(GroupChat).where(GroupChat.conversation_id == gc_id)).scalar_one()
        assert gc.moderation_state.visibility == ModerationVisibility.VISIBLE

    # User2 should have received 1 notification for the first message sent before approval
    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == user1.name
    assert push.content.body == "Hello before approval"

    # Send a message AFTER approval
    with conversations_session(token1) as api:
        api.SendMessage(
            conversations_pb2.SendMessageReq(
                group_chat_id=gc_id,
                text="Hello after approval",
            )
        )

    # Process the queued notification job
    while process_job():
        pass

    # User2 should have received another notification
    assert push_collector.count_for_user(user2.id) == 1
