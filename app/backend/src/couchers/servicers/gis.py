import json
import logging

import grpc

from couchers.db import session_scope
from pb import gis_pb2_grpc
from pb.google.api import httpbody_pb2

logger = logging.getLogger(__name__)


class GIS(gis_pb2_grpc.GISServicer):
    def GetUsers(self, request, context):
        with session_scope() as session:
            out = session.execute(
                """
            select json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(ST_AsGeoJSON(t.*, 'geom', 6)::json)
                )
            from (select username, id, geom from users where geom is not null) as t;
            """
            )

            return httpbody_pb2.HttpBody(
                content_type="application/json",
                # json.dumps escapes non-ascii characters
                data=json.dumps(out.scalar()).encode("ascii"),
            )

    def GetCommunities(self, request, context):
        with session_scope() as session:
            out = session.execute(
                """
            select json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(ST_AsGeoJSON(t.*, 'geom', 6)::json)
                )
            from (select * from nodes where geom is not null) as t;
            """
            )

            data = json.dumps(out.scalar()).encode("ascii")

            return httpbody_pb2.HttpBody(
                content_type="application/json",
                data=data,
            )

    def GetPages(self, request, context):
        with session_scope() as session:
            # TODO: this might get very slow, very quickly
            out = session.execute(
                """
            select json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(ST_AsGeoJSON(t.*, 'geom', 6)::json)
                )
            from (
                select page_id as id, geom from page_versions where id in (select max(id) from page_versions group by page_id) and geom is not null
            ) as t;
            """
            )

            data = json.dumps(out.scalar()).encode("ascii")

            return httpbody_pb2.HttpBody(
                content_type="application/json",
                data=data,
            )
