import json
import logging
from typing import Any

from sqlalchemy import Function, Select
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers.context import CouchersContext
from couchers.materialized_views import ClusteredUser, LiteUser
from couchers.models import Node, Page, PageType, PageVersion
from couchers.proto import gis_pb2_grpc
from couchers.proto.google.api import httpbody_pb2
from couchers.sql import couchers_select as select

logger = logging.getLogger(__name__)


def _build_geojson_select(statement: Select[Any]) -> Function[Any]:
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


def _statement_to_geojson_response(session: Session, statement: Select[Any]) -> httpbody_pb2.HttpBody:
    json_dict = session.execute(select(_build_geojson_select(statement))).scalar_one_or_none()
    return httpbody_pb2.HttpBody(
        content_type="application/json",
        # json.dumps escapes non-ascii characters
        data=json.dumps(json_dict).encode("ascii"),
    )


class GIS(gis_pb2_grpc.GISServicer):
    def GetUsers(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        statement = select(LiteUser.id, LiteUser.geom, LiteUser.has_completed_profile).where_users_visible(
            context, table=LiteUser
        )
        return _statement_to_geojson_response(session, statement)

    def GetClusteredUsers(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        return _statement_to_geojson_response(session, select(ClusteredUser.geom, ClusteredUser.count))

    def GetCommunities(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
        return _statement_to_geojson_response(session, select(Node).where(Node.geom != None))

    def GetPlaces(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
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

    def GetGuides(
        self, request: httpbody_pb2.HttpBody, context: CouchersContext, session: Session
    ) -> httpbody_pb2.HttpBody:
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
