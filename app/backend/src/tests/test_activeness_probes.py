from datetime import timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import exists, select

from couchers.config import config
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.jobs.handlers import send_activeness_probes
from couchers.models import ActivenessProbe, ActivenessProbeStatus, HostingStatus, MeetupStatus
from couchers.proto import api_pb2, jail_pb2
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import PushCollector, process_jobs
from tests.fixtures.sessions import api_session, real_jail_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_activeness_probes_happy_path_inactive(db, push_collector: PushCollector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.has_pending_activeness_probe
        assert res.jailed

        res = jail.RespondToActivenessProbe(
            jail_pb2.RespondToActivenessProbeReq(response=jail_pb2.ACTIVENESS_PROBE_RESPONSE_NO_LONGER_ACTIVE)
        )
        assert not res.has_pending_activeness_probe
        assert not res.jailed

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert res.hosting_status == api_pb2.HOSTING_STATUS_CANT_HOST
        assert res.meetup_status == api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP

    push = push_collector.get_for_user(user.id)
    assert push.content.title == "Are you still open to hosting on Couchers.org?"
    assert push.content.body == "Please log in to confirm your hosting status."


def test_activeness_probes_happy_path_active(db, push_collector: PushCollector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.has_pending_activeness_probe
        assert res.jailed

        res = jail.RespondToActivenessProbe(
            jail_pb2.RespondToActivenessProbeReq(response=jail_pb2.ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE)
        )
        assert not res.has_pending_activeness_probe
        assert not res.jailed

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert res.hosting_status == api_pb2.HOSTING_STATUS_CAN_HOST
        assert res.meetup_status == api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP

    push = push_collector.get_for_user(user.id)
    assert push.content.title == "Are you still open to hosting on Couchers.org?"
    assert push.content.body == "Please log in to confirm your hosting status."


def test_activeness_probes_disabled(db, push_collector: PushCollector):
    new_config = config.copy()
    new_config["ACTIVENESS_PROBES_ENABLED"] = False

    with patch("couchers.jobs.handlers.config", new_config):
        user, token = generate_user(
            hosting_status=HostingStatus.can_host,
            meetup_status=MeetupStatus.wants_to_meetup,
            last_active=now() - timedelta(days=335),
        )

        with session_scope() as session:
            queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

        process_jobs()

        with real_jail_session(token) as jail:
            res = jail.JailInfo(empty_pb2.Empty())
            assert not res.has_pending_activeness_probe
            assert not res.jailed

        with session_scope() as session:
            assert not session.execute(select(exists(ActivenessProbe))).scalar_one()


def test_activeness_probes_expiry(db, push_collector: PushCollector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.has_pending_activeness_probe
        assert res.jailed

    with session_scope() as session:
        probe = session.execute(select(ActivenessProbe)).scalar_one()
        probe.probe_initiated = now() - timedelta(days=15)
        assert probe.notifications_sent == 1
        probe.notifications_sent = 2

        queue_job(session, job=send_activeness_probes, payload=empty_pb2.Empty())

    process_jobs()

    with session_scope() as session:
        response = session.execute(select(ActivenessProbe.response)).scalar_one()
        assert response == ActivenessProbeStatus.expired

    with real_jail_session(token) as jail:
        # no such probe
        with pytest.raises(grpc.RpcError) as e:
            jail.RespondToActivenessProbe(
                jail_pb2.RespondToActivenessProbeReq(response=jail_pb2.ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "You don't currently have an activeness probe."

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.has_pending_activeness_probe
        assert not res.jailed

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert res.hosting_status == api_pb2.HOSTING_STATUS_MAYBE
        assert res.meetup_status == api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP
