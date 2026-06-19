"""
When adding a new foreign key to uploads.key, also update the reverse lookup in
couchers/helpers/upload_uses.py.
"""

import logging

import grpc
from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.crypto import secure_compare
from couchers.interceptors import MediaInterceptor
from couchers.models import InitiatedUpload, Upload
from couchers.proto import media_pb2, media_pb2_grpc

logger = logging.getLogger(__name__)


def get_media_auth_interceptor(secret_token: str) -> MediaInterceptor:
    def is_authorized(token: str) -> bool:
        return secure_compare(token.encode("ascii"), secret_token.encode("ascii"))

    return MediaInterceptor(is_authorized)


class Media(media_pb2_grpc.MediaServicer):
    def UploadConfirmation(
        self, request: media_pb2.UploadConfirmationReq, context: CouchersContext, session: Session
    ) -> empty_pb2.Empty:
        initiated_upload = session.execute(
            select(InitiatedUpload).where(InitiatedUpload.key == request.key).where(InitiatedUpload.is_valid)
        ).scalar_one_or_none()

        if not initiated_upload:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "upload_not_found")

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
