import json
import logging

import grpc
from shapely.geometry import shape

from couchers import errors
from couchers.db import session_scope
from couchers.helpers.clusters import create_cluster, create_node
from couchers.models import AccountDeletionToken, User
from couchers.servicers.communities import community_to_pb
from couchers.sql import couchers_select as select
from proto import admin_pb2, admin_pb2_grpc

logger = logging.getLogger(__name__)


def _user_to_details(user):
    return admin_pb2.UserDetails(
        user_id=user.id,
        username=user.username,
        email=user.email,
        gender=user.gender,
        banned=user.is_banned,
        deleted=user.is_deleted,
    )


class Admin(admin_pb2_grpc.AdminServicer):
    def GetUserDetails(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            return _user_to_details(user)

    def ChangeUserGender(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.gender = request.gender
            return _user_to_details(user)

    def BanUser(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.is_banned = True
            return _user_to_details(user)

    def DeleteUser(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.is_deleted = True
            return _user_to_details(user)

    def RecoverDeletedUser(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()

            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if not user.is_deleted:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.USER_NOT_DELETED)

            account_deletion_token = session.execute(
                select(AccountDeletionToken)
                .where(AccountDeletionToken.user_id == user.id)
                .where(AccountDeletionToken.is_valid)
            ).scalar_one_or_none()
            if not account_deletion_token:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

            user.is_deleted = False
            return _user_to_details(user)

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
