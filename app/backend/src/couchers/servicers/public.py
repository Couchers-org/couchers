import logging

from couchers.db import session_scope
from couchers.models import ProfilePublicitySetting, User
from couchers.servicers.gis import _statement_to_geojson_response
from couchers.sql import couchers_select as select
from proto import public_pb2_grpc

logger = logging.getLogger(__name__)


class Public(public_pb2_grpc.PublicServicer):
    """
    Public (logged out) APIs for getting public info
    """

    def GetPublicUsers(self, request, context):
        with session_scope() as session:
            statement = (
                select(User.username, User.geom)
                .where(User.is_visible)
                .where(User.geom != None)
                .where(User.profile_publicity != ProfilePublicitySetting.nothing)
            )
            return _statement_to_geojson_response(session, statement)
