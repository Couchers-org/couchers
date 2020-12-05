import logging

import grpc

from pb import gis_pb2, gis_pb2_grpc
from pb.google.api import httpbody_pb2

logger = logging.getLogger(__name__)


class GIS(gis_pb2_grpc.GISServicer):
    def __init__(self, Session):
        self._Session = Session

    def GetUsers(self, request, context):
        return httpbody_pb2.HttpBody(
            content_type="text/plain",
            data=b"Hello there!\n",
        )
