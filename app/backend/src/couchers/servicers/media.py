import logging

import grpc
from google.protobuf import empty_pb2
from pb import media_pb2, media_pb2_grpc

logger = logging.getLogger(__name__)

class Media(media_pb2_grpc.MediaServicer):
    def UploadConfirmation(self, request, context):
        key = request.key
        # TODO(aapeli): do something with the key
        return empty_pb2.Empty()
