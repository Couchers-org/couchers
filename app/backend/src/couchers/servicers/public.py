import logging

import grpc

from couchers import errors
from couchers.constants import GUIDELINES_VERSION, TOS_VERSION
from couchers.db import session_scope
from couchers.models import User, ProfilePublicitySetting
from couchers.sql import couchers_select as select
from couchers.utils import create_coordinate
from proto import public_pb2, public_pb2_grpc
from couchers.servicers.gis import _statement_to_geojson_response

logger = logging.getLogger(__name__)


class Public(public_pb2_grpc.PublicServicer):
    """
    Public (logged out) APIs for getting public info
    """

    def GetPublicUsers(self, request, context):
        with session_scope() as session:
            statement = select(User.username, User.geom).where(User.is_visible).where(User.geom != None).where(User.profile_publicity != ProfilePublicitySetting.nothing)
            return _statement_to_geojson_response(session, statement)
