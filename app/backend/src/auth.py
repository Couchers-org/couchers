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
        with session_scope(self._Session) as session:
            user_session = session.query(UserSession).filter(UserSession.token == token).one_or_none()
            if user_session:
                session.delete(user_session)
                session.commit()
                return True
            else:
                return False

    def auth(self, session, user):
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
        with session_scope(self._Session) as session:
            user_session = session.query(UserSession).filter(UserSession.token == token).one_or_none()
            if user_session:
                session.delete(user_session)
                session.commit()
                return True
            else:
                return False

    def Login(self, request, context):
        logging.debug(f"Logging in with {request.username=}")
        sleep(1) # TODO(aapeli) debug
        with session_scope(self._Session) as session:
            # Gets either by id/username/email
            user = get_user_by_field(session, request.username)
            if user:
                if user.hashed_password is not None:
                    logging.debug(f"Found user with password")
                    return auth_pb2.LoginResponse(next_step=auth_pb2.LoginResponse.LoginStep.NEED_PASSWORD)
                else:
                    logging.debug(f"Found user without password, sending login email")
                    token, expiry_text = new_login_token(session, user)
                    send_login_email(user, token, expiry_text)
                    return auth_pb2.LoginResponse(next_step=auth_pb2.LoginResponse.LoginStep.SENT_LOGIN_EMAIL)
            else: # user not found
                logging.debug(f"Didn't find user")
                return auth_pb2.LoginResponse(next_step=auth_pb2.LoginResponse.LoginStep.LOGIN_NO_SUCH_USER)

    def Signup(self, request, context):
        logging.debug(f"Signup with {request.email=}")
        sleep(1) # TODO(aapeli) debug
        if not is_valid_email(request.email):
            return auth_pb2.SignupResponse(next_step=auth_pb2.SignupResponse.SignupStep.INVALID_EMAIL)
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.email == request.email).one_or_none()
            if not user:
                print("Send signup email")
                token, expiry_text = new_signup_token(session, request.email)
                send_signup_email(request.email, token, expiry_text)
                return auth_pb2.SignupResponse(next_step=auth_pb2.SignupResponse.SignupStep.SENT_SIGNUP_EMAIL)
            else:
                # user exists
                return auth_pb2.SignupResponse(next_step=auth_pb2.SignupResponse.SignupStep.EMAIL_EXISTS)

    def CompleteTokenLogin(self, request, context):
        with session_scope(self._Session) as session:
            login_token = session.query(LoginToken).filter(LoginToken.token == request.token).one_or_none()
            if login_token:
                token = self.auth(session, user=login_token.user)
                return auth_pb2.AuthResponse(token=token)
            else:
                return context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid username or password")

    def SignupTokenInfo(self, request, context):
        logging.debug(f"Signup token info for {request.token=}")
        with session_scope(self._Session) as session:
            signup_token = session.query(SignupToken).filter(SignupToken.token == request.token).one_or_none()
            if not signup_token:
                context.abort(grpc.StatusCode.NOT_FOUND, "Token doesn't exist")
            else:
                return auth_pb2.SignupTokenInfoRes(email=signup_token.email)

    def username_available(self, username):
        logging.debug(f"Checking if {username=} is valid")
        if not is_valid_username(username):
            return False
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == username).one_or_none()
            return user is None

    def UsernameValid(self, request, context):
        return auth_pb2.UsernameValidRes(valid=self.username_available(request.username))

    def Authenticate(self, request, context):
        logging.debug(f"Logging in with {request.username=}, password=*******")
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == request.username).one_or_none()
            if user:
                logging.debug(f"Found user")
                if verify_password(user.hashed_password, request.password):
                    logging.debug(f"Right password")
                    # correct password
                    token = self.auth(session, user)
                    return auth_pb2.AuthResponse(token=token)
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
        logging.info(f"Deauthenticate(token={request.token})")
        if self.deauth(token=request.token):
            return auth_pb2.DeauthResponse()
        else:
            raise Exception("Failed to deauth")
