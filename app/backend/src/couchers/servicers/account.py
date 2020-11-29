import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import errors, urls
from couchers.crypto import hash_password, verify_password
from couchers.db import session_scope
from couchers.models import User
from couchers.tasks import send_password_changed_email
from couchers.utils import now
from pb import account_pb2, account_pb2_grpc


class Account(account_pb2_grpc.AccountServicer):
    def __init__(self, Session):
        self._Session = Session

    def ChangePassword(self, request, context):
        """
        Changes the user's password. They have to confirm their old password just in case.

        If they didn't have an old password previously, then we don't check that.
        """
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if not request.HasField("old_password") and not request.HasField("new_password"):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_BOTH_PASSWORDS)

            if user.hashed_password:
                # the user has a password
                if not request.HasField("old_password"):
                    # no password supplied
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PASSWORD)

                if not verify_password(user.hashed_password, request.old_password.value):
                    # wrong password
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_USERNAME_OR_PASSWORD)

            if request.HasField("old_password") and not user.hashed_password:
                # the user doesn't have a password but one was supplied
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_PASSWORD)

            # password correct or no password

            if not request.HasField("new_password"):
                # the user wants to unset their password
                user.hashed_password = None
            else:
                user.hashed_password = hash_password(request.new_password.value)

            session.commit()

            send_password_changed_email(user)

        return empty_pb2.Empty()
