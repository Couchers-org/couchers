import logging

from pb import communities_pb2_grpc

logger = logging.getLogger(__name__)


class Communities(communities_pb2_grpc.RequestsServicer):
    pass
