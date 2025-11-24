import logging

import grpc
from cachetools import TTLCache, cached
from google.protobuf import empty_pb2
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, union_all

from couchers import urls
from couchers.context import CouchersContext
from couchers.materialized_views import LiteUser
from couchers.models import Cluster, Node, ProfilePublicVisibility, Reference, User, Volunteer
from couchers.proto import api_pb2, public_pb2, public_pb2_grpc
from couchers.proto.google.api import httpbody_pb2
from couchers.resources import get_static_badge_dict
from couchers.servicers.account import _format_volunteer_link
from couchers.servicers.api import fluency2api, hostingstatus2api, meetupstatus2api, user_model_to_pb
from couchers.servicers.gis import _statement_to_geojson_response
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime, make_logged_out_context

logger = logging.getLogger(__name__)


@cached(cache=TTLCache(maxsize=1, ttl=600), key=lambda _: None)
def _get_public_users(session):
    with_geom = (
        select(User.username, User.geom)
        .where(User.is_visible)
        .where(User.public_visibility != ProfilePublicVisibility.nothing)
        .where(User.public_visibility != ProfilePublicVisibility.map_only)
    )

    without_geom = (
        select(None, User.randomized_geom)
        .where(User.is_visible)
        .where(User.randomized_geom != None)
        .where(User.public_visibility == ProfilePublicVisibility.map_only)
    )
    return _statement_to_geojson_response(session, union_all(with_geom, without_geom))


@cached(cache=TTLCache(maxsize=1, ttl=60), key=lambda _: None)
def _get_signup_page_info(session):
    # last user who signed up
    last_signup, geom = session.execute(
        select(User.joined, User.geom).where(User.is_visible).order_by(User.id.desc()).limit(1)
    ).one_or_none()

    communities = (
        session.execute(
            select(Cluster.name)
            .join(Node, Node.id == Cluster.parent_node_id)
            .where(Cluster.is_official_cluster)
            .where(func.ST_Contains(Node.geom, geom))
            .order_by(Cluster.id.asc())
        )
        .scalars()
        .all()
    )

    if len(communities) <= 1:
        # either no community or just global community
        last_location = "The World"
    elif len(communities) == 3:
        # probably global, continent, region, so let's just return the region
        last_location = communities[-1]
    else:
        # probably global, continent, region, city
        last_location = f"{communities[-1]}, {communities[-2]}"

    user_count = session.execute(select(func.count()).select_from(User).where(User.is_visible)).scalar_one()

    return public_pb2.GetSignupPageInfoRes(
        last_signup=Timestamp_from_datetime(last_signup.replace(second=0, microsecond=0)),
        last_location=last_location,
        user_count=user_count,
    )


@cached(cache=TTLCache(maxsize=1, ttl=60), key=lambda _: None)
def _get_volunteers(session):
    volunteers = session.execute(
        select(Volunteer, LiteUser)
        .join(LiteUser, LiteUser.id == Volunteer.user_id)
        .where(LiteUser.is_visible)
        .where(Volunteer.show_on_team_page)
        .order_by(
            Volunteer.sort_key.asc().nulls_last(),
            Volunteer.stopped_volunteering.desc().nulls_first(),
            Volunteer.started_volunteering.asc(),
        )
    ).all()

    board_members = set(get_static_badge_dict()["board_member"])

    def format_volunteer(volunteer, lite_user):
        if volunteer.link_type:
            link_type = volunteer.link_type
            link_text = volunteer.link_text
            link_url = volunteer.link_url
        else:
            link_type = "couchers"
            link_text = f"@{lite_user.username}"
            link_url = urls.user_link(username=lite_user.username)

        return public_pb2.Volunteer(
            name=volunteer.display_name or lite_user.name,
            username=lite_user.username,
            is_board_member=lite_user.id in board_members,
            role=volunteer.role,
            location=volunteer.display_location or lite_user.city,
            img=urls.media_url(filename=lite_user.avatar_filename, size="thumbnail")
            if lite_user.avatar_filename
            else None,
            **_format_volunteer_link(volunteer, lite_user.username),
        )

    return public_pb2.GetVolunteersRes(
        current_volunteers=[
            format_volunteer(volunteer, lite_user)
            for volunteer, lite_user in volunteers
            if volunteer.stopped_volunteering is None
        ],
        past_volunteers=[
            format_volunteer(volunteer, lite_user)
            for volunteer, lite_user in volunteers
            if volunteer.stopped_volunteering is not None
        ],
    )


class Public(public_pb2_grpc.PublicServicer):
    """
    Public (logged-out) APIs for getting public info
    """

    def GetPublicUsers(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        return _get_public_users(session)

    def GetPublicUser(
        self, request: public_pb2.GetPublicUserReq, context: CouchersContext, session: Session
    ) -> public_pb2.GetPublicUserRes:
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
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "user_not_found")

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

    def GetSignupPageInfo(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> public_pb2.GetSignupPageInfoRes:
        return _get_signup_page_info(session)

    def GetVolunteers(
        self, request: empty_pb2.Empty, context: CouchersContext, session: Session
    ) -> public_pb2.GetVolunteersRes:
        return _get_volunteers(session)
