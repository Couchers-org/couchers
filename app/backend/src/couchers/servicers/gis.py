import json
import logging

from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import Node, Page, PageType, PageVersion, User
from couchers.sql import couchers_select as select
from proto import gis_pb2_grpc, search_pb2
from couchers.servicers.search import get_user_search
from proto.google.api import httpbody_pb2
from base64 import urlsafe_b64encode, urlsafe_b64decode

from couchers.crypto import aead_generate_key, aead_decrypt, aead_encrypt

logger = logging.getLogger(__name__)


def _build_geojson_select(statement):
    """
    See usages below.
    """
    # this is basically a translation of the postgis ST_AsGeoJSON example into sqlalchemy/geoalchemy2
    return func.json_build_object(
        "type",
        "FeatureCollection",
        "features",
        func.json_agg(func.ST_AsGeoJSON(statement.subquery(), maxdecimaldigits=5).cast(JSON)),
    )


def _statement_to_geojson_response(session, statement):
    json_dict = session.execute(select(_build_geojson_select(statement))).scalar_one_or_none()
    return httpbody_pb2.HttpBody(
        content_type="application/json",
        # json.dumps escapes non-ascii characters
        data=json.dumps(json_dict).encode("ascii"),
    )


class GIS(gis_pb2_grpc.GISServicer):
    def GetUsers(self, request, context):
        with session_scope() as session:
            statement = select(User.username, User.id, User.geom).where_users_visible(context).where(User.geom != None)

            return _statement_to_geojson_response(session, statement)

    def GetUsersMVT(self, request, context):
        user_ids = get_user_search(context.user_id, urlsafe_b64decode(request.query), urlsafe_b64decode(request.nonce), urlsafe_b64decode(request.sig))
        sig = urlsafe_b64decode(request.sig)
        verified_data = aead_decrypt(mvt_key, sig, urlsafe_b64decode(request.query))
        query = search_pb2.UserSearchReq.FromString(verified_data)
        assert query.user_id == context.user_id
        with session_scope() as session:
            statement = select(User.username, User.id, User.geom).where(User.id.in_(user_ids)).where(User.geom != None)

            return _statement_to_geojson_response(session, statement)

    def GetCommunities(self, request, context):
        with session_scope() as session:
            statement = select(Node).where(Node.geom != None)

            return _statement_to_geojson_response(session, statement)

    def GetPlaces(self, request, context):
        with session_scope() as session:
            # need to do a subquery here so we get pages without a geom, not just versions without geom
            latest_pages = (
                select(func.max(PageVersion.id).label("id"))
                .join(Page, Page.id == PageVersion.page_id)
                .where(Page.type == PageType.place)
                .group_by(PageVersion.page_id)
                .subquery()
            )

            statement = (
                select(PageVersion.page_id.label("id"), PageVersion.slug.label("slug"), PageVersion.geom)
                .join(latest_pages, latest_pages.c.id == PageVersion.id)
                .where(PageVersion.geom != None)
            )

            return _statement_to_geojson_response(session, statement)

    def GetGuides(self, request, context):
        with session_scope() as session:
            latest_pages = (
                select(func.max(PageVersion.id).label("id"))
                .join(Page, Page.id == PageVersion.page_id)
                .where(Page.type == PageType.guide)
                .group_by(PageVersion.page_id)
                .subquery()
            )

            statement = (
                select(PageVersion.page_id.label("id"), PageVersion.slug.label("slug"), PageVersion.geom)
                .join(latest_pages, latest_pages.c.id == PageVersion.id)
                .where(PageVersion.geom != None)
            )

            return _statement_to_geojson_response(session, statement)
