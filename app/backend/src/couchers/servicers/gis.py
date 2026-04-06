import json
import logging
from typing import Any

from google.protobuf import empty_pb2
from sqlalchemy import Function, select
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy.sql.selectable import GenerativeSelect

from couchers.context import CouchersContext
from couchers.materialized_views import ClusteredUser, LiteUser
from couchers.models import Node, Page, PageType, PageVersion
from couchers.proto import gis_pb2_grpc
from couchers.proto.google.api import httpbody_pb2
from couchers.repositories import DB
from couchers.sql import users_visible

logger = logging.getLogger(__name__)


def _build_geojson_select(statement: GenerativeSelect) -> Function[Any]:
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


def _statement_to_geojson_response(session: Session, statement: GenerativeSelect) -> httpbody_pb2.HttpBody:
    json_dict = session.execute(select(_build_geojson_select(statement))).scalar_one_or_none()
    return httpbody_pb2.HttpBody(
        content_type="application/json",
        # json.dumps escapes non-ascii characters
        data=json.dumps(json_dict).encode("ascii"),
    )


class GIS(gis_pb2_grpc.GISServicer):
    def GetUsers(self, request: empty_pb2.Empty, context: CouchersContext, db: DB) -> httpbody_pb2.HttpBody:
        # Build FeatureCollection from precomputed per-row GeoJSON in the materialized view,
        # assembling with string_agg in Postgres
        result = db.session.execute(
            select(
                func.concat(
                    '{"type":"FeatureCollection","features":[',
                    func.coalesce(func.string_agg(LiteUser.geojson, ","), ""),
                    "]}",
                )
            ).where(users_visible(context, table=LiteUser))
        ).scalar_one()
        return httpbody_pb2.HttpBody(
            content_type="application/json",
            data=result.encode("ascii"),
        )

    def GetClusteredUsers(self, request: empty_pb2.Empty, context: CouchersContext, db: DB) -> httpbody_pb2.HttpBody:
        return _statement_to_geojson_response(db.session, select(ClusteredUser.geom, ClusteredUser.count))

    def GetCommunities(self, request: empty_pb2.Empty, context: CouchersContext, db: DB) -> httpbody_pb2.HttpBody:
        return _statement_to_geojson_response(db.session, select(Node).where(Node.geom != None))

    def GetPlaces(self, request: empty_pb2.Empty, context: CouchersContext, db: DB) -> httpbody_pb2.HttpBody:
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

        return _statement_to_geojson_response(db.session, statement)

    def GetGuides(self, request: empty_pb2.Empty, context: CouchersContext, db: DB) -> httpbody_pb2.HttpBody:
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

        return _statement_to_geojson_response(db.session, statement)
