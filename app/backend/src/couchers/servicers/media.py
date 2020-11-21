import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers.crypto import secure_compare
from couchers.db import session_scope
from couchers.interceptors import ManualAuthValidatorInterceptor
from couchers.models import InitiatedUpload
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
            upload = (
                session.query(InitiatedUpload)
                .filter(InitiatedUpload.key == request.key)
                .filter(InitiatedUpload.created <= func.now())
                .filter(InitiatedUpload.expiry >= func.now())
                .one_or_none()
            )

            if not upload:
                context.abort(grpc.StatusCode.NOT_FOUND, "Upload not found.")

            upload.user.avatar_filename = request.filename

            return empty_pb2.Empty()
