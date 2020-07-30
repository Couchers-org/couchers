import logging

import grpc
from couchers.crypto import secure_compare
from couchers.db import session_scope
from couchers.interceptors import ManualAuthValidatorInterceptor
from couchers.models import User
from google.protobuf import empty_pb2
from pb import media_pb2, media_pb2_grpc

logger = logging.getLogger(__name__)

def get_media_auth_interceptor(secret_token):
    def is_authorized(token):
        return secure_compare(token.encode("ascii"), secret_token.encode("ascii"))
    return ManualAuthValidatorInterceptor(is_authorized)

class Media(media_pb2_grpc.MediaServicer):
    def __init__(self, Session):
        self._Session = Session

    def UploadConfirmation(self, request, context):
        with session_scope(self._Session) as session:
            user = (session.query(User)
                .filter(User.id == 2)
                .one())

            user.avatar_key = request.key
            # key = request.key
            # filename = request.filename

            # TODO(aapeli): do something with the key + filename
            return empty_pb2.Empty()
