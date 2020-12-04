import logging

import grpc

from couchers import errors
from couchers.db import with_session_and_user
from couchers.models import User
from pb import jail_pb2, jail_pb2_grpc

logger = logging.getLogger(__name__)


class Jail(jail_pb2_grpc.JailServicer):
    """
    The Jail servicer.

    API calls allowed for users who need to complete some tasks before being
    fully active
    """

    def _get_jail_info(self, user):
        res = jail_pb2.JailInfoRes(
            has_not_accepted_tos=user.accepted_tos != 1,
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

    @with_session_and_user
    def JailInfo(self, request, context, session, user):
        return self._get_jail_info(user)

    @with_session_and_user
    def AcceptTOS(self, request, context, session, user):
        if user.accepted_tos == 1 and not request.accept:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNACCEPT_TOS)

        user.accepted_tos = 1 if request.accept else 0
        session.commit()

        return self._get_jail_info(user)
