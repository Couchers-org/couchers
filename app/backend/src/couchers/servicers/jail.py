import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.context import CouchersContext
from couchers.helpers.hosting_meetup_status import record_hosting_meetup_status
from couchers.models import (
    ActivenessProbe,
    ActivenessProbeStatus,
    HostingMeetupStatusSource,
    HostingStatus,
    ModNote,
    User,
)
from couchers.proto import jail_pb2, jail_pb2_grpc
from couchers.servicers.account import mod_note_to_pb
from couchers.utils import create_coordinate, now

logger = logging.getLogger(__name__)


def _get_jail_info(user: User) -> jail_pb2.JailInfoRes:
    res = jail_pb2.JailInfoRes(
        has_not_accepted_tos=user.jailed_missing_tos,
        needs_to_update_location=user.is_missing_location,
        has_not_accepted_community_guidelines=user.jailed_missing_community_guidelines,
        has_pending_mod_notes=user.jailed_pending_mod_notes,
        pending_mod_notes=[mod_note_to_pb(note) for note in user.mod_notes.where(ModNote.is_pending)],
        has_pending_activeness_probe=user.jailed_pending_activeness_probe,
    )

    # if any of the bools in res are true, we're jailed
    jailed = False
    for field in res.DESCRIPTOR.fields:
        if getattr(res, field.name):
            jailed = True
    res.jailed = jailed

    # double check
    assert user.is_jailed == jailed

    return res


class Jail(jail_pb2_grpc.JailServicer):
    """
    The Jail servicer.

    API calls allowed for users who need to complete some tasks before being
    fully active
    """

    def JailInfo(self, request: empty_pb2.Empty, context: CouchersContext, session: Session) -> jail_pb2.JailInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        return _get_jail_info(user)

    def AcceptTOS(
        self, request: jail_pb2.AcceptTOSReq, context: CouchersContext, session: Session
    ) -> jail_pb2.JailInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if not request.accept:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_unaccept_tos")

        user.accepted_tos = TOS_VERSION

        return _get_jail_info(user)

    def SetLocation(
        self, request: jail_pb2.SetLocationReq, context: CouchersContext, session: Session
    ) -> jail_pb2.JailInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if request.lat == 0 and request.lng == 0:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")

        user.city = request.city
        user.geom = create_coordinate(request.lat, request.lng)
        user.randomized_geom = None
        user.geom_radius = request.radius
        user.needs_to_update_location = False

        return _get_jail_info(user)

    def AcceptCommunityGuidelines(
        self, request: jail_pb2.AcceptCommunityGuidelinesReq, context: CouchersContext, session: Session
    ) -> jail_pb2.JailInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if not request.accept:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "cant_unaccept_community_guidelines")

        user.accepted_community_guidelines = GUIDELINES_VERSION

        return _get_jail_info(user)

    def AcknowledgePendingModNote(
        self, request: jail_pb2.AcknowledgePendingModNoteReq, context: CouchersContext, session: Session
    ) -> jail_pb2.JailInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        note = session.execute(
            select(ModNote)
            .where(ModNote.user_id == user.id)
            .where(ModNote.is_pending)
            .where(ModNote.id == request.note_id)
        ).scalar_one_or_none()

        if not note:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "moderator_note_not_found")

        if not request.acknowledge:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "moderator_note_need_to_acknowledge")

        note.acknowledged = now()

        return _get_jail_info(user)

    def RespondToActivenessProbe(
        self, request: jail_pb2.RespondToActivenessProbeReq, context: CouchersContext, session: Session
    ) -> jail_pb2.JailInfoRes:
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        probe = session.execute(
            select(ActivenessProbe).where(ActivenessProbe.user_id == user.id).where(ActivenessProbe.is_pending)
        ).scalar_one_or_none()

        if not probe:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "probe_not_found")

        if request.response == jail_pb2.ACTIVENESS_PROBE_RESPONSE_STILL_ACTIVE:
            probe.response = ActivenessProbeStatus.still_active
        elif request.response == jail_pb2.ACTIVENESS_PROBE_RESPONSE_NO_LONGER_ACTIVE:
            probe.response = ActivenessProbeStatus.no_longer_active
            # disable hosting
            user.hosting_status = HostingStatus.cant_host
        else:
            context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "probe_response_invalid")

        probe.responded = now()

        # after `responded` is set, otherwise the autoflush inside would trip the probe's check constraint
        record_hosting_meetup_status(session, user, HostingMeetupStatusSource.activeness_probe_response)

        return _get_jail_info(user)
