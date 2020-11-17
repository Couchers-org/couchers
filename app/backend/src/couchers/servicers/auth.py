import logging
from datetime import datetime
from typing import Union

import grpc
from sqlalchemy import func

from couchers import errors
from couchers.crypto import hash_password, urlsafe_secure_token, verify_password
from couchers.db import (
    get_user_by_field,
    is_valid_email,
    is_valid_name,
    is_valid_username,
    new_login_token,
    new_signup_token,
    session_scope,
)
from couchers.interceptors import AuthValidatorInterceptor
from couchers.models import LoginToken, SignupToken, User, UserSession
from couchers.servicers.api import hostingstatus2sql
from couchers.tasks import send_login_email, send_signup_email
from pb import auth_pb2, auth_pb2_grpc

logger = logging.getLogger(__name__)


class Auth(auth_pb2_grpc.AuthServicer):
    """
    The Auth servicer.

    This class services the Auth service/API.
    """

    def __init__(self, Session):
        super().__init__()
        self._Session = Session

    def get_auth_interceptor(self, allow_jailed):
        """
        Returns an auth interceptor.

        By adding this interceptor to a service, all requests to that service will require an bearer authorization with a valid session from the Auth service.

        The user_id will be available in the RPC context through context.user_id.
        """
        return AuthValidatorInterceptor(self.get_session_for_token, allow_jailed)

    def get_session_for_token(self, token):
        """
        Returns None if the session token is not valid, and (user_id, jailed) corresponding to the session token otherwise.

        TODO(aapeli): session expiry
        """
        with session_scope(self._Session) as session:
            result = (
                session.query(User, UserSession)
                .join(User, User.id == UserSession.user_id)
                .filter(UserSession.token == token)
                .one_or_none()
            )

            if not result:
                # can't expunge if it's None
                return None
            else:
                return result.User.id, result.User.is_jailed

    def _create_session(self, context, session, user):
        """
        Creates a session for the given user and returns the bearer token.

        You need to give an active DB session as nested sessions don't
        really work here due to the active User object.

        Will abort the API calling context if the user is banned from logging in.
        """
        if user.is_banned:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.ACCOUNT_SUSPENDED)

        token = urlsafe_secure_token()

        user_session = UserSession(user=user, token=token)

        session.add(user_session)
        session.commit()

        logger.debug(f"Handing out {token=} to {user=}")
        return token

    def _delete_session(self, token):
        """
        Deletes the given session (practically logging the user out)

        Returns True if the session was found, False otherwise.
        """
        with session_scope(self._Session) as session:
            user_session = session.query(UserSession).filter(UserSession.token == token).one_or_none()
            if user_session:
                session.delete(user_session)
                session.commit()
                return True
            else:
                return False

    def Signup(self, request, context):
        """
        First step of Signup flow.

        If the email is not a valid email (by regexp), returns INVALID_EMAIL

        If the email already exists, returns EMAIL_EXISTS.

        Otherwise, creates a signup token and sends an email, then returns SENT_SIGNUP_EMAIL.
        """
        logger.debug(f"Signup with {request.email=}")
        if not is_valid_email(request.email):
            return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.INVALID_EMAIL)
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.email == request.email).one_or_none()
            if not user:
                token, expiry_text = new_signup_token(session, request.email)
                session.add(send_signup_email(request.email, token, expiry_text))
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.SENT_SIGNUP_EMAIL)
            else:
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.EMAIL_EXISTS)

    def _username_available(self, username):
        """
        Checks if the given username adheres to our rules and isn't taken already.
        """
        logger.debug(f"Checking if {username=} is valid")
        if not is_valid_username(username):
            return False
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == username).one_or_none()
            # return False if user exists, True otherwise
            return user is None

    def UsernameValid(self, request, context):
        """
        Runs a username availability and validity check.
        """
        return auth_pb2.UsernameValidRes(valid=self._username_available(request.username))

    def SignupTokenInfo(self, request, context):
        """
        Returns the email for a given SignupToken (which will be shown on the UI on the singup form).
        """
        logger.debug(f"Signup token info for {request.signup_token=}")
        with session_scope(self._Session) as session:
            signup_token = (
                session.query(SignupToken)
                .filter(SignupToken.token == request.signup_token)
                .filter(SignupToken.created <= func.now())
                .filter(SignupToken.expiry >= func.now())
                .one_or_none()
            )
            if not signup_token:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)
            else:
                return auth_pb2.SignupTokenInfoRes(email=signup_token.email)

    def CompleteSignup(self, request, context):
        """
        Completes user sign up by creating the user in question, then logs them in.

        TODO: nice error handling for dupe username/email?
        """
        with session_scope(self._Session) as session:
            signup_token = (
                session.query(SignupToken)
                .filter(SignupToken.token == request.signup_token)
                .filter(SignupToken.created <= func.now())
                .filter(SignupToken.expiry >= func.now())
                .one_or_none()
            )
            if not signup_token:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.INVALID_TOKEN)

            # should be in YYYY-MM-DD format
            try:
                birthdate = datetime.fromisoformat(request.birthdate)
            except ValueError:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_BIRTHDATE)

            # check email again
            if not is_valid_email(signup_token.email):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_EMAIL)

            # check username validity
            if not is_valid_username(request.username):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_USERNAME)

            # check name validity
            if not is_valid_name(request.name):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_NAME)

            if not request.hosting_status:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.HOSTING_STATUS_REQUIRED)

            user = User(
                email=signup_token.email,
                username=request.username,
                name=request.name,
                city=request.city,
                gender=request.gender,
                birthdate=birthdate,
                hosting_status=hostingstatus2sql[request.hosting_status],
            )

            # happens in same transaction
            session.delete(signup_token)

            # enforces email/username uniqueness
            session.add(user)
            session.commit()

            token = self._create_session(context, session, user)

            return auth_pb2.AuthRes(token=token, jailed=user.is_jailed)

    def Login(self, request, context):
        """
        Does the first step of the Login flow.

        The user is searched for using their id, username, or email.

        If the user does not exist, returns a LOGIN_NO_SUCH_USER.

        If the user has a password, returns NEED_PASSWORD.

        If the user exists but does not have a password, generates a login token, send it in the email and returns SENT_LOGIN_EMAIL.
        """
        logger.debug(f"Attempting login for {request.user=}")
        with session_scope(self._Session) as session:
            # Gets user by one of id/username/email or None if not found
            user = get_user_by_field(session, request.user)
            if user:
                if user.hashed_password is not None:
                    logger.debug(f"Found user with password")
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.NEED_PASSWORD)
                else:
                    logger.debug(f"Found user without password, sending login email")
                    login_token, expiry_text = new_login_token(session, user)
                    session.add(send_login_email(user, login_token, expiry_text))
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL)
            else:  # user not found
                logger.debug(f"Didn't find user")
                return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.INVALID_USER)

    def CompleteTokenLogin(self, request, context):
        """
        Second step of email-based login.

        Validates the given LoginToken (sent in email), creates a new session and returns bearer token.

        Or fails with grpc.UNAUTHENTICATED if LoginToken is invalid.
        """
        with session_scope(self._Session) as session:
            login_token = (
                session.query(LoginToken)
                .filter(LoginToken.token == request.login_token)
                .filter(LoginToken.created <= func.now())
                .filter(LoginToken.expiry >= func.now())
                .one_or_none()
            )
            if login_token:
                # this is the bearer token
                token = self._create_session(context, session, user=login_token.user)
                # delete the login token so it can't be reused
                session.delete(login_token)
                session.commit()
                return auth_pb2.AuthRes(token=token, jailed=login_token.user.is_jailed)
            else:
                context.abort(grpc.StatusCode.UNAUTHENTICATED, errors.INVALID_TOKEN)

    def Authenticate(self, request, context):
        """
        Authenticates a classic password based login request.

        request.user can be any of id/username/email
        """
        logger.debug(f"Logging in with {request.user=}, password=*******")
        with session_scope(self._Session) as session:
            user = get_user_by_field(session, request.user)
            if user:
                logger.debug(f"Found user")
                if not user.hashed_password:
                    logger.debug(f"User doesn't have a password!")
                    context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.NO_PASSWORD)
                if verify_password(user.hashed_password, request.password):
                    logger.debug(f"Right password")
                    # correct password
                    token = self._create_session(context, session, user)
                    return auth_pb2.AuthRes(token=token, jailed=user.is_jailed)
                else:
                    logger.debug(f"Wrong password")
                    # wrong password
                    context.abort(grpc.StatusCode.UNAUTHENTICATED, errors.INVALID_USERNAME_OR_PASSWORD)
            else:  # user not found
                logger.debug(f"Didn't find user")
                # do about as much work as if the user was found, reduces timing based username enumeration attacks
                hash_password(request.password)
                context.abort(grpc.StatusCode.UNAUTHENTICATED, errors.INVALID_USERNAME_OR_PASSWORD)

    def Deauthenticate(self, request, context):
        """
        Removes an active session.
        """
        logger.info(f"Deauthenticate(token={request.token})")
        if self._delete_session(token=request.token):
            return auth_pb2.DeAuthRes()
        else:
            # probably caused by token not existing
            context.abort(grpc.StatusCode.UNKNOWN, errors.LOGOUT_FAILED)
