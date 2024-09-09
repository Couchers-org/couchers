import logging

import grpc

from couchers import errors
from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.db import session_scope
from couchers.models import ModNote, User
from couchers.servicers.account import mod_note_to_pb
from couchers.sql import couchers_select as select
from couchers.utils import create_coordinate, now
from proto import jail_pb2, jail_pb2_grpc

logger = logging.getLogger(__name__)


def _get_jail_info(session, user):
    pending_notes = (
        session.execute(select(ModNote).where(ModNote.user_id == user.id).where(ModNote.is_pending)).scalars().all()
    )
    res = jail_pb2.JailInfoRes(
        has_not_accepted_tos=user.accepted_tos < TOS_VERSION,
        has_not_added_location=user.is_missing_location,
        has_not_accepted_community_guidelines=user.accepted_community_guidelines < GUIDELINES_VERSION,
        has_pending_mod_notes=len(pending_notes) > 0,
        pending_mod_notes=[mod_note_to_pb(note) for note in pending_notes],
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

    def JailInfo(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            return _get_jail_info(session, user)

    def AcceptTOS(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            if not request.accept:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNACCEPT_TOS)

            user.accepted_tos = TOS_VERSION
            session.commit()

            return _get_jail_info(session, user)

    def SetLocation(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            if request.lat == 0 and request.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)

            user.city = request.city
            user.geom = create_coordinate(request.lat, request.lng)
            user.geom_radius = request.radius

            session.commit()

            return _get_jail_info(session, user)

    def AcceptCommunityGuidelines(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            if not request.accept:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES)

            user.accepted_community_guidelines = GUIDELINES_VERSION
            session.commit()

            return _get_jail_info(session, user)

    def AcknowledgePendingModNote(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            note = session.execute(
                select(ModNote)
                .where(ModNote.user_id == user.id)
                .where(ModNote.is_pending)
                .where(ModNote.id == request.note_id)
            ).scalar_one_or_none()

            if not note:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.MOD_NOTE_NOT_FOUND)

            if not request.acknowledge:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.MOD_NOTE_NEED_TO_ACKNOWELDGE)

            note.acknowledged = now()
            session.flush()

            return _get_jail_info(session, user)
