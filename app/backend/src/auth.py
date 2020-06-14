import logging
from time import sleep
from typing import Union

import grpc
from crypto import hash_password, urlsafe_secure_token, verify_password
from db import session_scope
from models import (LoginToken, SignupToken, User, UserSession,
                    get_user_by_field, is_valid_email, is_valid_username,
                    new_login_token, new_signup_token)
from pb import auth_pb2, auth_pb2_grpc
from sqlalchemy import func
from tasks import send_login_email, send_signup_email


class _AuthValidatorInterceptor(grpc.ServerInterceptor):
    """
    gRPC interceptor that calls `has_access` with the bearer token to check whether this request is authorised
    """
    def __init__(self, has_access):
        def abort(ignored_request, context):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        self._abort = grpc.unary_unary_rpc_method_handler(abort)
        self._has_access = has_access

    def intercept_service(self, continuation, handler_call_details):
        for (key, value) in handler_call_details.invocation_metadata:
            if key == "authorization":
                if value.startswith("Bearer "):
                    token = value[7:]
                    if self._has_access(token):
                        return continuation(handler_call_details)
                break
        return self._abort

class Auth(auth_pb2_grpc.AuthServicer):
    def __init__(self, Session):
        super().__init__()
        self._Session = Session
        self.auth_interceptor = _AuthValidatorInterceptor(self.has_access)

    def get_auth_interceptor(self):
        return self.auth_interceptor

    def has_access(self, token):
        """
        Returns a boolean representing whether the given `token` is authenticated.

        TODO(aapeli): return user id instead, or similar so it can be passed to auth context
        """
        with session_scope(self._Session) as session:
            return session.query(UserSession).filter(UserSession.token == token).one_or_none() is not None

    def auth(self, session, user):
        """
        Creates a session for the given user and returns the bearer token.

        You need to give an active DB session as nested sessions don't really work here due to the active User object.
        """
        token = urlsafe_secure_token()

        user_session = UserSession(
            user=user,
            token=token
        )

        session.add(user_session)
        session.commit()

        logging.debug(f"Handing out {token=} to {user=}")
        return token

    def deauth(self, token):
        """
        Deletes the given session
        """
        with session_scope(self._Session) as session:
            user_session = session.query(UserSession).filter(UserSession.token == token).one_or_none()
            if user_session:
                session.delete(user_session)
                session.commit()
                return True
            else:
                return False

    def Login(self, request, context):
        """
        Does the first step of the Login flow.

        The user is searched for using their id, username, or email.

        If the user does not exist, returns a LOGIN_NO_SUCH_USER.

        If the user has a password, sends a request to supply a password (NEED_PASSWORD).

        If the user has not password, sends a login email and returns SENT_LOGIN_EMAIL.
        """
        logging.debug(f"Logging in with {request.username=}")
        with session_scope(self._Session) as session:
            # Gets user by one of id/username/email or None if not found
            user = get_user_by_field(session, request.username)
            if user:
                if user.hashed_password is not None:
                    logging.debug(f"Found user with password")
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.NEED_PASSWORD)
                else:
                    logging.debug(f"Found user without password, sending login email")
                    token, expiry_text = new_login_token(session, user)
                    send_login_email(user, token, expiry_text)
                    return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.SENT_LOGIN_EMAIL)
            else: # user not found
                logging.debug(f"Didn't find user")
                return auth_pb2.LoginRes(next_step=auth_pb2.LoginRes.LoginStep.LOGIN_NO_SUCH_USER)

    def Signup(self, request, context):
        """
        First step of Signup flow.

        If the email does not exist, creates a signup token and sends an email, then returns with SENT_SIGNUP_EMAIL.

        If the email already exists, returns an EMAIL_EXISTS.
        """
        logging.debug(f"Signup with {request.email=}")
        if not is_valid_email(request.email):
            return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.INVALID_EMAIL)
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.email == request.email).one_or_none()
            if not user:
                token, expiry_text = new_signup_token(session, request.email)
                send_signup_email(request.email, token, expiry_text)
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.SENT_SIGNUP_EMAIL)
            else:
                # user exists
                return auth_pb2.SignupRes(next_step=auth_pb2.SignupRes.SignupStep.EMAIL_EXISTS)

    def CompleteTokenLogin(self, request, context):
        """
        Second step of email-based login.

        Validates the given LoginToken (sent in email), creates a new session and returns bearer token.

        Or fails with grpc.UNAUTHENTICATED if LoginToken is invalid.
        """
        with session_scope(self._Session) as session:
            login_token = session.query(LoginToken) \
                .filter(LoginToken.token == request.token) \
                .filter(LoginToken.created < func.now()) \
                .filter(LoginToken.expiry >= func.now()) \
                .one_or_none()
            if login_token:
                # this is the bearer token
                token = self.auth(session, user=login_token.user)
                return auth_pb2.AuthRes(token=token)
            else:
                return context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid token.")

    def SignupTokenInfo(self, request, context):
        """
        Returns the email for a given SignupToken (which will be shown on the UI on the singup form).
        """
        logging.debug(f"Signup token info for {request.token=}")
        with session_scope(self._Session) as session:
            signup_token = session.query(SignupToken) \
                .filter(SignupToken.token == request.token) \
                .filter(SignupToken.created < func.now()) \
                .filter(SignupToken.expiry >= func.now()) \
                .one_or_none()
            if not signup_token:
                context.abort(grpc.StatusCode.NOT_FOUND, "Invalid token.")
            else:
                return auth_pb2.SignupTokenInfoRes(email=signup_token.email)

    def username_available(self, username):
        """
        Checks if the given username adheres to our rules and isn't taken already.
        """
        logging.debug(f"Checking if {username=} is valid")
        if not is_valid_username(username):
            return False
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == username).one_or_none()
            # return False if user exists, True otherwise
            return user is None

    def UsernameValid(self, request, context):
        """
        Runs a username availability and validity check.

        TODO(aapeli): move into authenticated API.
        """
        return auth_pb2.UsernameValidRes(valid=self.username_available(request.username))

    def Authenticate(self, request, context):
        """
        Authenticates a classic username + password based login request.
        """
        logging.debug(f"Logging in with {request.username=}, password=*******")
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == request.username).one_or_none()
            if user:
                logging.debug(f"Found user")
                if verify_password(user.hashed_password, request.password):
                    logging.debug(f"Right password")
                    # correct password
                    token = self.auth(session, user)
                    return auth_pb2.AuthRes(token=token)
                else:
                    logging.debug(f"Wrong password")
                    # wrong password
                    return context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid username or password")
            else: # user not found
                logging.debug(f"Didn't find user")
                # do about as much work as if the user was found, reduces timing based username enumeration attacks
                hash_password(request.password)
                return context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid username or password")

    def Deauthenticate(self, request, context):
        """
        Removes an active session.
        """
        logging.info(f"Deauthenticate(token={request.token})")
        if self.deauth(token=request.token):
            return auth_pb2.DeAuthRes()
        else:
            raise Exception("Failed to deauth")
