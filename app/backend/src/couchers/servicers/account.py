from datetime import timedelta

import grpc
from google.protobuf import empty_pb2

from couchers import errors
from couchers.crypto import hash_password, verify_password
from couchers.db import session_scope, set_email_change_token
from couchers.models import User
from couchers.phone import sms
from couchers.phone.check import is_e164_format, is_known_operator
from couchers.tasks import (
    send_email_changed_confirmation_email,
    send_email_changed_notification_email,
    send_password_changed_email,
)
from couchers.utils import is_valid_email, now
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


def _abort_if_terrible_password(password, context):
    """
    Internal utility function: given a password, aborts if password is unforgivably insecure
    """
    if len(password) < 8:
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PASSWORD_TOO_SHORT)

    if len(password) > 256:
        # Hey, what are you trying to do? Give us a DDOS attack?
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PASSWORD_TOO_LONG)

    # check for most common weak passwords (not meant to be an exhaustive check!)
    if password.lower() in ("password", "12345678", "couchers", "couchers1"):
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INSECURE_PASSWORD)


class Account(account_pb2_grpc.AccountServicer):
    def GetAccountInfo(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if not user.hashed_password:
                auth_info = dict(
                    login_method=account_pb2.GetAccountInfoRes.LoginMethod.MAGIC_LINK,
                    has_password=False,
                )
            else:
                auth_info = dict(
                    login_method=account_pb2.GetAccountInfoRes.LoginMethod.PASSWORD,
                    has_password=True,
                )
            return account_pb2.GetAccountInfoRes(email=user.email, phone=user.phone or "", **auth_info)

    def ChangePassword(self, request, context):
        """
        Changes the user's password. They have to confirm their old password just in case.

        If they didn't have an old password previously, then we don't check that.
        """
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if not request.HasField("old_password") and not request.HasField("new_password"):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_BOTH_PASSWORDS)

            _check_password(user, "old_password", request, context)

            # password correct or no password

            if not request.HasField("new_password"):
                # the user wants to unset their password
                user.hashed_password = None
            else:
                _abort_if_terrible_password(request.new_password.value, context)
                user.hashed_password = hash_password(request.new_password.value)

            session.commit()

            send_password_changed_email(user)

        return empty_pb2.Empty()

    def ChangeEmail(self, request, context):
        """
        Change the user's email address.

        A notification is sent to the old email, and a confirmation is sent to the new one.

        The user then has to click on the confirmation email which actually changes the emails
        """
        # check password first
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            _check_password(user, "password", request, context)

        # not a valid email
        if not is_valid_email(request.new_email):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

        # email already in use (possibly by this user)
        with session_scope() as session:
            if session.query(User).filter(User.email == request.new_email).one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            # otherwise we're good
            user.new_email = request.new_email
            token, expiry_text = set_email_change_token(session, user)

            send_email_changed_notification_email(user)
            send_email_changed_confirmation_email(user, token, expiry_text)
            # session autocommit
        return empty_pb2.Empty()

    def GetContributorFormInfo(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            return account_pb2.GetContributorFormInfoRes(
                filled_contributor_form=user.filled_contributor_form,
                username=user.username,
                name=user.name,
                email=user.email,
                age=user.age,
                gender=user.gender,
                location=user.city,
            )

    def MarkContributorFormFilled(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            user.filled_contributor_form = request.filled_contributor_form
        return empty_pb2.Empty()

    def ChangePhone(self, request, context):
        phone = request.phone
        # early quick validation
        if phone and not is_e164_format(phone):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_PHONE)

        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            if (
                user.phone_verification_verified
                and now() - user.phone_verification_verified < timedelta(days=356)
                and not request.remove_verification
            ):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.PHONE_ALREADY_VERIFIED)

            user.phone = phone or None
            user.phone_verification_verified = None

        return empty_pb2.Empty()

    def SendVerificationSMS(self, request, context):
        enum = account_pb2.SendVerificationSMSRes.SendVerificationSMSStatus
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            if user.phone is None:
                return account_pb2.SendVerificationSMSRes(status=enum.SMS_RESULT_NO_PHONE_NUMBER)

            if not is_known_operator(user.phone):
                return account_pb2.SendVerificationSMSRes(status=enum.SMS_RESULT_UNSUPPORTED_OPERATOR)

            if user.phone_verification_sent and now() - user.phone_verification_sent < timedelta(days=180):
                return account_pb2.SendVerificationSMSRes(status=enum.SMS_RESULT_RATELIMIT)

            token = "123456"
            result = sms.send_sms(user.phone, "hej" + token)

            if result == "success":
                user.phone_verification_sent = now()
                user.phone_verification_token = token
                user.phone_verification_attempts = 0
                return account_pb2.SendVerificationSMSRes(status=enum.SMS_RESULT_CODE_SENT)

        if result == "unsupported operator":
            return account_pb2.SendVerificationSMSRes(status=enum.SMS_RESULT_UNSUPPORTED_OPERATOR)
        return account_pb2.SendVerificationSMSRes(status=enum.SMS_RESULT_OPERATOR_ERROR, operator_error_message=result)

    def VerifyPhone(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()
            if user.phone_verification_token is None:
                return account_pb2.VerifyPhoneRes(
                    status=account_pb2.VerifyPhoneRes.VerifyPhoneStatus.VERIFY_PHONE_NO_SMS_SENT
                )

            if user.phone_verification_attempts > 3:
                return account_pb2.VerifyPhoneRes(
                    status=account_pb2.VerifyPhoneRes.VerifyPhoneStatus.VERIFY_PHONE_TOO_MANY_ATTEMPTS
                )

            if user.phone_verification_token != request.token:
                user.phone_verification_attempts += 1
                return account_pb2.VerifyPhoneRes(
                    status=account_pb2.VerifyPhoneRes.VerifyPhoneStatus.VERIFY_PHONE_WRONG_CODE
                )

            user.phone_verification_token = None
            user.phone_verification_sent = None
            user.phone_verification_verified = now()

        return account_pb2.VerifyPhoneRes(status=account_pb2.VerifyPhoneRes.VerifyPhoneStatus.VERIFY_PHONE_SUCCESS)
