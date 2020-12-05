import json
import logging

import grpc

from couchers.db import session_scope
from pb import gis_pb2, gis_pb2_grpc
from pb.google.api import httpbody_pb2

logger = logging.getLogger(__name__)


class GIS(gis_pb2_grpc.GISServicer):
    def __init__(self, Session):
        self._Session = Session

    def GetUsers(self, request, context):
        with session_scope(self._Session) as session:
            out = session.execute(
                """
            select json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(ST_AsGeoJSON(t.*)::json)
                )
            from (select username, id, geom from users where geom is not null) as t;
            """
            )

            return httpbody_pb2.HttpBody(
                content_type="application/json",
                data=json.dumps(out.scalar()).encode("utf8"),
            )
