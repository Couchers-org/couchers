from datetime import timedelta
from unittest.mock import patch

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.config import config
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import ActivenessProbe, ActivenessProbeStatus, HostingStatus, MeetupStatus
from couchers.sql import couchers_select as select
from couchers.utils import now
from proto import api_pb2, jail_pb2
from tests.test_fixtures import (  # noqa  # noqa
    api_session,
    db,
    email_fields,
    generate_user,
    process_jobs,
    push_collector,
    real_jail_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_activeness_probes_happy_path_inactive(db, push_collector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, "send_activeness_probes", empty_pb2.Empty())

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

    push_collector.assert_user_has_single_matching(
        user.id,
        title="Are you still open to hosting on Couchers.org?",
        body="Please log in to confirm your hosting status.",
    )


def test_activeness_probes_happy_path_active(db, push_collector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, "send_activeness_probes", empty_pb2.Empty())

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

    push_collector.assert_user_has_single_matching(
        user.id,
        title="Are you still open to hosting on Couchers.org?",
        body="Please log in to confirm your hosting status.",
    )


def test_activeness_probes_disabled(db, push_collector):
    new_config = config.copy()
    new_config["ACTIVENESS_PROBES_ENABLED"] = False

    with patch("couchers.jobs.handlers.config", new_config):
        user, token = generate_user(
            hosting_status=HostingStatus.can_host,
            meetup_status=MeetupStatus.wants_to_meetup,
            last_active=now() - timedelta(days=335),
        )

        with session_scope() as session:
            queue_job(session, "send_activeness_probes", empty_pb2.Empty())

        process_jobs()

        with real_jail_session(token) as jail:
            res = jail.JailInfo(empty_pb2.Empty())
            assert not res.has_pending_activeness_probe
            assert not res.jailed

        with session_scope() as session:
            assert not session.execute(select(ActivenessProbe)).scalar_one_or_none()


def test_activeness_probes_expiry(db, push_collector):
    user, token = generate_user(
        hosting_status=HostingStatus.can_host,
        meetup_status=MeetupStatus.wants_to_meetup,
        last_active=now() - timedelta(days=335),
    )

    with session_scope() as session:
        queue_job(session, "send_activeness_probes", empty_pb2.Empty())

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

        queue_job(session, "send_activeness_probes", empty_pb2.Empty())

    process_jobs()

    with session_scope() as session:
        probe = session.execute(select(ActivenessProbe)).scalar_one()
        assert probe.response == ActivenessProbeStatus.expired

    with real_jail_session(token) as jail:
        # no such probe
        with pytest.raises(grpc.RpcError) as e:
            jail.RespondToActivenessProbe(
                jail_pb2.RespondToActivenessProbeReq(response=jail_pb2.ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE)
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.PROBE_NOT_FOUND

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.has_pending_activeness_probe
        assert not res.jailed

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert res.hosting_status == api_pb2.HOSTING_STATUS_CANT_HOST
        assert res.meetup_status == api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP
