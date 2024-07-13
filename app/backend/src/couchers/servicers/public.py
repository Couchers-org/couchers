import logging

import grpc
from sqlalchemy.sql import func, union_all

from couchers import errors
from couchers.db import session_scope
from couchers.models import ProfilePublicVisibility, Reference, User
from couchers.servicers.api import fluency2api, hostingstatus2api, meetupstatus2api, user_model_to_pb
from couchers.servicers.gis import _statement_to_geojson_response
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime, make_logged_out_context
from proto import api_pb2, public_pb2, public_pb2_grpc

logger = logging.getLogger(__name__)


class Public(public_pb2_grpc.PublicServicer):
    """
    Public (logged out) APIs for getting public info
    """

    def GetPublicUsers(self, request, context):
        with session_scope() as session:
            with_geom = (
                select(User.username, User.geom)
                .where(User.is_visible)
                .where(User.geom != None)
                .where(User.public_visibility != ProfilePublicVisibility.nothing)
                .where(User.public_visibility != ProfilePublicVisibility.map_only)
            )
            without_geom = (
                select(None, User.geom)
                .where(User.is_visible)
                .where(User.geom != None)
                .where(User.public_visibility == ProfilePublicVisibility.map_only)
            )
            statement = union_all(with_geom, without_geom)
            return _statement_to_geojson_response(session, statement)

    def GetPublicUser(self, request, context):
        with session_scope() as session:
            user = session.execute(
                select(User)
                .where(User.is_visible)
                .where(User.username == request.user)
                .where(
                    User.public_visibility.in_(
                        [ProfilePublicVisibility.limited, ProfilePublicVisibility.most, ProfilePublicVisibility.full]
                    )
                )
            ).scalar_one_or_none()

            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if user.public_visibility == ProfilePublicVisibility.full:
                return public_pb2.GetPublicUserRes(full_user=user_model_to_pb(user, session, make_logged_out_context()))

            num_references = session.execute(
                select(func.count())
                .select_from(Reference)
                .join(User, User.id == Reference.from_user_id)
                .where(User.is_visible)
                .where(Reference.to_user_id == user.id)
            ).scalar_one()

            if user.public_visibility == ProfilePublicVisibility.limited:
                return public_pb2.GetPublicUserRes(
                    limited_user=public_pb2.LimitedUser(
                        username=user.username,
                        name=user.name,
                        city=user.city,
                        hometown=user.hometown,
                        num_references=num_references,
                        joined=Timestamp_from_datetime(user.display_joined),
                        hosting_status=hostingstatus2api[user.hosting_status],
                        meetup_status=meetupstatus2api[user.meetup_status],
                        badges=[badge.badge_id for badge in user.badges],
                    )
                )

            if user.public_visibility == ProfilePublicVisibility.most:
                return public_pb2.GetPublicUserRes(
                    most_user=public_pb2.MostUser(
                        username=user.username,
                        name=user.name,
                        city=user.city,
                        hometown=user.hometown,
                        timezone=user.timezone,
                        num_references=num_references,
                        gender=user.gender,
                        pronouns=user.pronouns,
                        age=user.age,
                        joined=Timestamp_from_datetime(user.display_joined),
                        last_active=Timestamp_from_datetime(user.display_last_active),
                        hosting_status=hostingstatus2api[user.hosting_status],
                        meetup_status=meetupstatus2api[user.meetup_status],
                        occupation=user.occupation,
                        education=user.education,
                        about_me=user.about_me,
                        things_i_like=user.things_i_like,
                        language_abilities=[
                            api_pb2.LanguageAbility(code=ability.language_code, fluency=fluency2api[ability.fluency])
                            for ability in user.language_abilities
                        ],
                        regions_visited=[region.code for region in user.regions_visited],
                        regions_lived=[region.code for region in user.regions_lived],
                        avatar_url=user.avatar.full_url if user.avatar else None,
                        avatar_thumbnail_url=user.avatar.thumbnail_url if user.avatar else None,
                        badges=[badge.badge_id for badge in user.badges],
                    )
                )
