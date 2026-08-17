from datetime import timedelta

import pytest
from google.protobuf import empty_pb2, wrappers_pb2
from sqlalchemy import select

from couchers.crypto import UNSUBSCRIBE_KEY_NAME, generate_hash_signature, get_secret
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import send_activeness_probes
from couchers.models import (
    ActivenessProbe,
    HostingMeetupStatusHistory,
    HostingMeetupStatusSource,
    HostingStatus,
    MeetupStatus,
    User,
)
from couchers.proto import api_pb2, auth_pb2, jail_pb2, notifications_pb2
from couchers.proto.internal import unsubscribe_pb2
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import PushCollector, process_jobs
from tests.fixtures.sessions import (
    api_session,
    auth_api_session,
    notifications_session,
    real_jail_session,
)
from tests.test_auth import _quick_signup


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def get_history(user_id: int) -> list[tuple[HostingMeetupStatusSource, HostingStatus, MeetupStatus]]:
    with session_scope() as session:
        return [
            (row.source, row.hosting_status, row.meetup_status)
            for row in session.execute(
                select(HostingMeetupStatusHistory)
                .where(HostingMeetupStatusHistory.user_id == user_id)
                .order_by(HostingMeetupStatusHistory.id)
            ).scalars()
        ]


def test_history_recorded_on_signup(db):
    user_id = _quick_signup()

    assert get_history(user_id) == [
        (HostingMeetupStatusSource.signup, HostingStatus.can_host, MeetupStatus.open_to_meetup)
    ]


def test_history_recorded_on_profile_edit(db):
    user, token = generate_user(hosting_status=HostingStatus.cant_host, meetup_status=MeetupStatus.open_to_meetup)

    with api_session(token) as api:
        api.UpdateProfile(api_pb2.UpdateProfileReq(hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST))
        api.UpdateProfile(api_pb2.UpdateProfileReq(meetup_status=api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP))

    assert get_history(user.id) == [
        (HostingMeetupStatusSource.profile_edit, HostingStatus.can_host, MeetupStatus.open_to_meetup),
        (HostingMeetupStatusSource.profile_edit, HostingStatus.can_host, MeetupStatus.wants_to_meetup),
    ]


def test_history_not_recorded_when_unchanged(db):
    user, token = generate_user(hosting_status=HostingStatus.can_host, meetup_status=MeetupStatus.wants_to_meetup)

    with api_session(token) as api:
        # neither status is touched
        api.UpdateProfile(api_pb2.UpdateProfileReq(name=wrappers_pb2.StringValue(value="Frodo Baggins")))
        assert get_history(user.id) == []

        # both statuses set to what they already are, but nothing has ever been recorded for this user, so this
        # becomes their first row
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                meetup_status=api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP,
            )
        )
        assert get_history(user.id) == [
            (HostingMeetupStatusSource.profile_edit, HostingStatus.can_host, MeetupStatus.wants_to_meetup)
        ]

        # now that it's been recorded, a no-op edit doesn't add another
        api.UpdateProfile(
            api_pb2.UpdateProfileReq(
                hosting_status=api_pb2.HOSTING_STATUS_CAN_HOST,
                meetup_status=api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP,
            )
        )
        assert len(get_history(user.id)) == 1


def test_history_recorded_on_do_not_email(db):
    user, token = generate_user(hosting_status=HostingStatus.can_host, meetup_status=MeetupStatus.wants_to_meetup)

    with notifications_session(token) as notifications:
        notifications.SetNotificationSettings(notifications_pb2.SetNotificationSettingsReq(enable_do_not_email=True))

    assert get_history(user.id) == [
        (HostingMeetupStatusSource.do_not_email, HostingStatus.cant_host, MeetupStatus.does_not_want_to_meetup)
    ]


def test_history_recorded_on_unsubscribe_link(db):
    user, token = generate_user(hosting_status=HostingStatus.can_host, meetup_status=MeetupStatus.wants_to_meetup)

    payload = unsubscribe_pb2.UnsubscribePayload(
        user_id=user.id, do_not_email=unsubscribe_pb2.DoNotEmail()
    ).SerializeToString()
    sig = generate_hash_signature(message=payload, key=get_secret(UNSUBSCRIBE_KEY_NAME))

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.Unsubscribe(auth_pb2.UnsubscribeReq(payload=payload, sig=sig))

    assert get_history(user.id) == [
        (HostingMeetupStatusSource.unsubscribe_link, HostingStatus.cant_host, MeetupStatus.does_not_want_to_meetup)
    ]


def test_history_recorded_on_activeness_probe_response(db, push_collector: PushCollector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with real_jail_session(token) as jail:
        jail.RespondToActivenessProbe(
            jail_pb2.RespondToActivenessProbeReq(response=jail_pb2.ACTIVENESS_PROBE_RESPONSE_NO_LONGER_ACTIVE)
        )

    assert get_history(user.id) == [
        (HostingMeetupStatusSource.activeness_probe_response, HostingStatus.cant_host, MeetupStatus.wants_to_meetup)
    ]


def test_history_recorded_on_activeness_probe_expiry(db, push_collector: PushCollector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with session_scope() as session:
        probe = session.execute(select(ActivenessProbe)).scalar_one()
        probe.probe_initiated = now() - timedelta(days=15)
        probe.notifications_sent = 2

        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with session_scope() as session:
        db_user = session.execute(select(User).where(User.id == user.id)).scalar_one()
        assert db_user.hosting_status == HostingStatus.maybe
        assert db_user.meetup_status == MeetupStatus.open_to_meetup

    assert get_history(user.id) == [
        (HostingMeetupStatusSource.activeness_probe_expired, HostingStatus.maybe, MeetupStatus.open_to_meetup)
    ]
