import json
import logging

from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import Node, Page, PageType, PageVersion, User
from pb import gis_pb2_grpc
from pb.google.api import httpbody_pb2

logger = logging.getLogger(__name__)


def _build_geojson_query(query):
    """
    See usages below.
    """
    # this is basically a translation of the postgis ST_AsGeoJSON example into sqlalchemy/geoalchemy2
    return func.json_build_object(
        "type",
        "FeatureCollection",
        "features",
        func.json_agg(func.ST_AsGeoJSON(query.subquery(), maxdecimaldigits=5).cast(JSON)),
    )


def _query_to_geojson_response(session, query):
    json_dict = session.query(_build_geojson_query(query)).scalar()
    return httpbody_pb2.HttpBody(
        content_type="application/json",
        # json.dumps escapes non-ascii characters
        data=json.dumps(json_dict).encode("ascii"),
    )


class GIS(gis_pb2_grpc.GISServicer):
    def GetUsers(self, request, context):
        with session_scope() as session:
            query = session.query(User.username, User.id, User.geom).filter_users(context).filter(User.geom != None)

            return _query_to_geojson_response(session, query)

    def GetCommunities(self, request, context):
        with session_scope() as session:
            query = session.query(Node).filter(Node.geom != None)

            return _query_to_geojson_response(session, query)

    def GetPlaces(self, request, context):
        with session_scope() as session:
            # need to do a subquery here so we get pages without a geom, not just versions without geom
            latest_pages = (
                session.query(func.max(PageVersion.id).label("id"))
                .join(Page, Page.id == PageVersion.page_id)
                .filter(Page.type == PageType.place)
                .group_by(PageVersion.page_id)
                .subquery()
            )

            query = (
                session.query(PageVersion.page_id.label("id"), PageVersion.slug.label("slug"), PageVersion.geom)
                .join(latest_pages, latest_pages.c.id == PageVersion.id)
                .filter(PageVersion.geom != None)
            )

            return _query_to_geojson_response(session, query)

    def GetGuides(self, request, context):
        with session_scope() as session:
            latest_pages = (
                session.query(func.max(PageVersion.id).label("id"))
                .join(Page, Page.id == PageVersion.page_id)
                .filter(Page.type == PageType.guide)
                .group_by(PageVersion.page_id)
                .subquery()
            )

            query = (
                session.query(PageVersion.page_id.label("id"), PageVersion.slug.label("slug"), PageVersion.geom)
                .join(latest_pages, latest_pages.c.id == PageVersion.id)
                .filter(PageVersion.geom != None)
            )

            return _query_to_geojson_response(session, query)
