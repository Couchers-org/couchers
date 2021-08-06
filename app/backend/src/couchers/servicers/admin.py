import json
import logging
from datetime import timedelta

import grpc
from shapely.geometry import shape

from couchers import errors
from couchers.db import session_scope
from couchers.helpers.clusters import create_cluster, create_node
from couchers.models import User
from couchers.servicers.auth import create_session
from couchers.servicers.communities import community_to_pb
from couchers.sql import couchers_select as select
from couchers.tasks import send_api_key_email
from couchers.utils import date_to_api, parse_date
from proto import admin_pb2, admin_pb2_grpc

logger = logging.getLogger(__name__)


def _user_to_details(user):
    return admin_pb2.UserDetails(
        user_id=user.id,
        username=user.username,
        email=user.email,
        gender=user.gender,
        birthdate=date_to_api(user.birthdate),
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

            notify(
                content=easy_notification_formatter(
                    "Gender changed", f"Your gender was changed to {user.gender} by an admin."
                ),
                user_id=user.id,
                topic="gender",
                action="change",
            )

            return _user_to_details(user)

    def ChangeUserBirthdate(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            user.birthdate = parse_date(request.birthdate)

            notify(
                content=easy_notification_formatter(
                    "Birthdate changed", f"Your birthdate was changed to {user.birthdate} by an admin."
                ),
                user_id=user.id,
                topic="birthdate",
                action="change",
            )

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

    def CreateApiKey(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where_username_or_email_or_id(request.user)).scalar_one_or_none()
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)
            token, expiry = create_session(
                context, session, user, long_lived=True, is_api_key=True, duration=timedelta(days=365)
            )
            send_api_key_email(session, user, token, expiry)

            notify(
                content=easy_notification_formatter("API key created", f"An API key was created for you by an admin."),
                user_id=user.id,
                topic="api_key",
                action="create",
            )

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
