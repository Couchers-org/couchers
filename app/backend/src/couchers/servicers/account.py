from datetime import timedelta

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.sql import update

from couchers import errors
from couchers.constants import PHONE_REVERIFICATION_INTERVAL, SMS_CODE_ATTEMPTS, SMS_CODE_LIFETIME
from couchers.crypto import hash_password, urlsafe_secure_token, verify_password, verify_token
from couchers.db import session_scope
from couchers.models import ContributeOption, ContributorForm, User
from couchers.phone import sms
from couchers.phone.check import is_e164_format, is_known_operator
from couchers.sql import couchers_select as select
from couchers.tasks import (
    maybe_send_contributor_form_email,
    send_email_changed_confirmation_to_new_email,
    send_email_changed_confirmation_to_old_email,
    send_email_changed_notification_email,
    send_password_changed_email,
)
from couchers.utils import is_valid_email, now
from proto import account_pb2, account_pb2_grpc, auth_pb2

contributeoption2sql = {
    auth_pb2.CONTRIBUTE_OPTION_UNSPECIFIED: None,
    auth_pb2.CONTRIBUTE_OPTION_YES: ContributeOption.yes,
    auth_pb2.CONTRIBUTE_OPTION_MAYBE: ContributeOption.maybe,
    auth_pb2.CONTRIBUTE_OPTION_NO: ContributeOption.no,
}

contributeoption2api = {
    None: auth_pb2.CONTRIBUTE_OPTION_UNSPECIFIED,
    ContributeOption.yes: auth_pb2.CONTRIBUTE_OPTION_YES,
    ContributeOption.maybe: auth_pb2.CONTRIBUTE_OPTION_MAYBE,
    ContributeOption.no: auth_pb2.CONTRIBUTE_OPTION_NO,
}


def _check_password(user, field_name, request, context):
    """
    Internal utility function: given a request with a StringValue `field_name` field, checks the password is correct or that the user does not have a password
    """
    if user.has_password:
        # the user has a password
        if not request.HasField(field_name):
            # no password supplied
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PASSWORD)

        if not verify_password(user.hashed_password, getattr(request, field_name).value):
            # wrong password
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_USERNAME_OR_PASSWORD)

    elif request.HasField(field_name):
        # the user doesn't have a password, but one was supplied
        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.NO_PASSWORD)


def abort_on_invalid_password(password, context):
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
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            if not user.has_password:
                auth_info = dict(
                    login_method=account_pb2.GetAccountInfoRes.LoginMethod.MAGIC_LINK,
                    has_password=False,
                )
            else:
                auth_info = dict(
                    login_method=account_pb2.GetAccountInfoRes.LoginMethod.PASSWORD,
                    has_password=True,
                )
            return account_pb2.GetAccountInfoRes(
                username=user.username,
                email=user.email,
                phone=user.phone if user.phone_is_verified() else "",
                profile_complete=user.has_completed_profile,
                timezone=user.timezone,
                **auth_info,
            )

    def ChangePassword(self, request, context):
        """
        Changes the user's password. They have to confirm their old password just in case.

        If they didn't have an old password previously, then we don't check that.
        """
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            if not request.HasField("old_password") and not request.HasField("new_password"):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_BOTH_PASSWORDS)

            _check_password(user, "old_password", request, context)

            # password correct or no password

            if not request.HasField("new_password"):
                # the user wants to unset their password
                user.hashed_password = None
            else:
                abort_on_invalid_password(request.new_password.value, context)
                user.hashed_password = hash_password(request.new_password.value)

            session.commit()

            send_password_changed_email(user)

            # TODO: notify

        return empty_pb2.Empty()

    def ChangeEmail(self, request, context):
        """
        Change the user's email address.

        If the user has a password, a notification is sent to the old email, and a confirmation is sent to the new one.

        Otherwise they need to confirm twice, via an email sent to each of their old and new emails.

        In all confirmation emails, the user must click on the confirmation link.
        """
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            # check password first
            _check_password(user, "password", request, context)

            # not a valid email
            if not is_valid_email(request.new_email):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

            # email already in use (possibly by this user)
            if session.execute(select(User).where(User.email == request.new_email)).scalar_one_or_none():
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

            user.new_email = request.new_email
            user.new_email_token = urlsafe_secure_token()
            user.new_email_token_created = now()
            user.new_email_token_expiry = now() + timedelta(hours=2)
            user.need_to_confirm_via_new_email = True

            if user.has_password:
                user.old_email_token = None
                user.old_email_token_created = None
                user.old_email_token_expiry = None
                user.need_to_confirm_via_old_email = False
                send_email_changed_notification_email(user)
                send_email_changed_confirmation_to_new_email(user)

                # TODO: notify
            else:
                user.old_email_token = urlsafe_secure_token()
                user.old_email_token_created = now()
                user.old_email_token_expiry = now() + timedelta(hours=2)
                user.need_to_confirm_via_old_email = True
                send_email_changed_confirmation_to_old_email(user)
                send_email_changed_confirmation_to_new_email(user)

        # session autocommit
        return empty_pb2.Empty()

    def FillContributorForm(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            form = request.contributor_form

            form = ContributorForm(
                user=user,
                ideas=form.ideas or None,
                features=form.features or None,
                experience=form.experience or None,
                contribute=contributeoption2sql[form.contribute],
                contribute_ways=form.contribute_ways,
                expertise=form.expertise or None,
            )

            session.add(form)
            session.flush()
            maybe_send_contributor_form_email(form)

            user.filled_contributor_form = True

        return empty_pb2.Empty()

    def GetContributorFormInfo(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

            return account_pb2.GetContributorFormInfoRes(
                filled_contributor_form=user.filled_contributor_form,
            )

    def ChangePhone(self, request, context):
        phone = request.phone
        # early quick validation
        if phone and not is_e164_format(phone):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_PHONE)

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            if not phone:
                user.phone = None
                user.phone_verification_verified = None
                user.phone_verification_token = None
                user.phone_verification_attempts = 0
                return empty_pb2.Empty()

            if not is_known_operator(phone):
                context.abort(grpc.StatusCode.UNIMPLEMENTED, errors.UNRECOGNIZED_PHONE_NUMBER)

            if now() - user.phone_verification_sent < PHONE_REVERIFICATION_INTERVAL:
                context.abort(grpc.StatusCode.RESOURCE_EXHAUSTED, errors.REVERIFICATION_TOO_EARLY)

            token = sms.generate_random_code()
            result = sms.send_sms(phone, sms.format_message(token))

            if result == "success":
                user.phone = phone
                user.phone_verification_verified = None
                user.phone_verification_token = token
                user.phone_verification_sent = now()
                user.phone_verification_attempts = 0
                # TODO: notify
                return empty_pb2.Empty()

        context.abort(grpc.StatusCode.UNIMPLEMENTED, result)

    def VerifyPhone(self, request, context):
        if not sms.looks_like_a_code(request.token):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.WRONG_SMS_CODE)

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            if user.phone_verification_token is None:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PENDING_VERIFICATION)

            if now() - user.phone_verification_sent > SMS_CODE_LIFETIME:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PENDING_VERIFICATION)

            if user.phone_verification_attempts > SMS_CODE_ATTEMPTS:
                context.abort(grpc.StatusCode.RESOURCE_EXHAUSTED, errors.TOO_MANY_SMS_CODE_ATTEMPTS)

            if not verify_token(request.token, user.phone_verification_token):
                user.phone_verification_attempts += 1
                session.commit()
                context.abort(grpc.StatusCode.NOT_FOUND, errors.WRONG_SMS_CODE)

            # Delete verifications from everyone else that has this number
            session.execute(
                update(User)
                .where(User.phone == user.phone)
                .where(User.id != context.user_id)
                .values(
                    {
                        "phone_verification_verified": None,
                        "phone_verification_attempts": 0,
                        "phone_verification_token": None,
                        "phone": None,
                    }
                )
                .execution_options(synchronize_session=False)
            )

            user.phone_verification_token = None
            user.phone_verification_verified = now()
            user.phone_verification_attempts = 0

            # TODO: notify

        return empty_pb2.Empty()
