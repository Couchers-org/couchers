import json
import logging

from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import Node, PageVersion, User
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
            query = session.query(User.username, User.id, User.geom).filter(User.geom != None)

            return _query_to_geojson_response(session, query)

    def GetCommunities(self, request, context):
        with session_scope() as session:
            query = session.query(Node).filter(Node.geom != None)

            return _query_to_geojson_response(session, query)

    def GetPages(self, request, context):
        with session_scope() as session:
            # TODO: this might get very slow, very quickly
            latest_pages = session.query(func.max(PageVersion.id)).group_by(PageVersion.page_id).subquery()

            query = (
                session.query(PageVersion.page_id.label("id"), PageVersion.geom)
                .filter(PageVersion.id.in_(latest_pages))
                .filter(PageVersion.geom != None)
            )

            return _query_to_geojson_response(session, query)
