import logging

import grpc
from google.protobuf import empty_pb2

from couchers.crypto import secure_compare
from couchers.db import session_scope
from couchers.interceptors import ManualAuthValidatorInterceptor
from couchers.models import InitiatedUpload, Upload
from pb import media_pb2_grpc

logger = logging.getLogger(__name__)


def get_media_auth_interceptor(secret_token):
    def is_authorized(token):
        return secure_compare(token.encode("ascii"), secret_token.encode("ascii"))

    return ManualAuthValidatorInterceptor(is_authorized)


class Media(media_pb2_grpc.MediaServicer):
    def UploadConfirmation(self, request, context):
        with session_scope() as session:
            initiated_upload = (
                session.query(InitiatedUpload)
                .filter(InitiatedUpload.key == request.key)
                .filter(InitiatedUpload.is_valid)
                .one_or_none()
            )

            if not initiated_upload:
                context.abort(grpc.StatusCode.NOT_FOUND, "Upload not found.")

            # move it to a completed upload
            upload = Upload(
                key=request.key,
                filename=request.filename,
                creator_user_id=initiated_upload.initiator_user_id,
            )
            session.add(upload)

            # delete the old upload
            session.delete(initiated_upload)

            return empty_pb2.Empty()
