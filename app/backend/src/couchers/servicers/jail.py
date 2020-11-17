import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import User, UserSession
from pb import jail_pb2, jail_pb2_grpc

logger = logging.getLogger(__name__)


class Jail(jail_pb2_grpc.JailServicer):
    """
    The Jail servicer.

    API calls allowed for users who need to complete some tasks before being
    fully active
    """

    def __init__(self, Session):
        super().__init__()
        self._Session = Session

    def GetTOS(self, request, context):
        with session_scope(self._Session) as session:
            return jail_pb2.GetTOSRes(
                accepted_tos=(session.query(User).filter(User.id == context.user_id).one().accepted_tos == 1)
            )

    def AcceptTOS(self, request, context):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            user.accepted_tos = 1 if request.accept else 0
            session.commit()
            return jail_pb2.GetTOSRes(accepted_tos=user.accepted_tos)

    def JailInfo(self, request, context):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            reasons = []

            if user.is_jailed:
                reasons.append(jail_pb2.JailInfoRes.MISSING_TOS)

            return jail_pb2.JailInfoRes(reasons=reasons)
