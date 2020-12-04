import logging
from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import func

from couchers import errors, urls
from couchers.crypto import hash_password, verify_password
from couchers.db import is_valid_email, set_email_change_token, with_session_and_user
from couchers.models import User
from couchers.tasks import (
    send_email_changed_confirmation_email,
    send_email_changed_notification_email,
    send_password_changed_email,
)
from couchers.utils import now
from pb import account_pb2, account_pb2_grpc


def _check_password(user, field_name, request, context):
    """
    Internal utility function: given a request with a StringValue `field_name` field, checks the password is correct or that the user does not have a password
    """
    if user.hashed_password:
        # the user has a password
        if not request.HasField(field_name):
            # no password supplied
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PASSWORD)

        if not verify_password(user.hashed_password, getattr(request, field_name).value):
            # wrong password
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_USERNAME_OR_PASSWORD)

    if request.HasField(field_name) and not user.hashed_password:
        # the user doesn't have a password but one was supplied
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_PASSWORD)


class Account(account_pb2_grpc.AccountServicer):
    @with_session_and_user
    def ChangePassword(self, request, context, session, user):
        """
        Changes the user's password. They have to confirm their old password just in case.

        If they didn't have an old password previously, then we don't check that.
        """
        if not request.HasField("old_password") and not request.HasField("new_password"):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_BOTH_PASSWORDS)

        _check_password(user, "old_password", request, context)

        # password correct or no password

        if not request.HasField("new_password"):
            # the user wants to unset their password
            user.hashed_password = None
        else:
            user.hashed_password = hash_password(request.new_password.value)

        session.commit()

        send_password_changed_email(user)

        return empty_pb2.Empty()

    @with_session_and_user
    def ChangeEmail(self, request, context, session, user):
        """
        Change the user's email address.

        A notification is sent to the old email, and a confirmation is sent to the new one.

        The user then has to click on the confirmation email which actually changes the emails
        """
        # check password first
        _check_password(user, "password", request, context)

        # not a valid email
        if not is_valid_email(request.new_email):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

        # email already in use (possibly by this user)
        if session.query(User).filter(User.email == request.new_email).one_or_none():
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

        # otherwise we're good
        user.new_email = request.new_email
        token, expiry_text = set_email_change_token(session, user)

        session.add(send_email_changed_notification_email(user))
        session.add(send_email_changed_confirmation_email(user, token, expiry_text))

        session.commit()

        return empty_pb2.Empty()
