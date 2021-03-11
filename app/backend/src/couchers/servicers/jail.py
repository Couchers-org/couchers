import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import User
from couchers.utils import create_coordinate
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
            has_not_added_location=user.is_missing_location,
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

    def JailInfo(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            return self._get_jail_info(user)

    def AcceptTOS(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if user.accepted_tos == 1 and not request.accept:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_UNACCEPT_TOS)

            user.accepted_tos = 1 if request.accept else 0
            session.commit()

            return self._get_jail_info(user)

    def SetLocation(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if request.lat == 0 and request.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)

            user.city = request.city
            user.geom = create_coordinate(request.lat, request.lng)
            user.geom_radius = request.radius

            session.commit()

            return self._get_jail_info(user)
