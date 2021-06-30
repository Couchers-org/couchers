import json
import logging

import grpc
from google.protobuf import empty_pb2
from shapely.geometry import shape

from couchers import errors
from couchers.db import session_scope
from couchers.helpers.clusters import create_cluster, create_node
from couchers.models import User
from couchers.servicers.communities import community_to_pb
from proto import admin_pb2, admin_pb2_grpc

logger = logging.getLogger(__name__)


class Admin(admin_pb2_grpc.AdminServicer):
    def GetUserEmailById(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == request.user_id).one()
            return admin_pb2.GetUserEmailRes(user_id=user.id, email=user.email)

    def GetUserEmailByUsermame(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.username == request.username).one()
            return admin_pb2.GetUserEmailRes(user_id=user.id, email=user.email)

    def CreateCommunity(self, request, context):
        with session_scope() as session:
            geom = shape(json.loads(request.geojson))

            if geom.type != "MultiPolygon":
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_MULTIPOLYGON)

            parent_node_id = request.parent_node_id if request.parent_node_id != 0 else None
            node = create_node(session, geom, parent_node_id)
            create_cluster(
                session, node.id, request.name, request.description, context.user_id, request.admin_ids, True
            )

            return community_to_pb(node, context)

    def BanUser(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == request.user_id).one()
            user.is_banned = True
            return empty_pb2.Empty()

    def DeleteUser(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == request.user_id).one()
            user.is_deleted = True
            return empty_pb2.Empty()
