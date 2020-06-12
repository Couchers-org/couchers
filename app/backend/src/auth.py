import logging
from base64 import b64encode
from time import sleep
from typing import Union

import grpc
from crypto import hash_password, random_bytes, verify_password
from db import session_scope
from models import User, UserSession, get_user_by_field, new_login_token
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

    def auth(self, username, password):
        logging.debug(f"Logging in with {username=}, password=*******")
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == username).one_or_none()
            if user:
                logging.debug(f"Found user")
                if verify_password(user.hashed_password, password):
                    logging.debug(f"Right password")
                    # correct password
                    token = b64encode(random_bytes(32)).decode("utf8")

                    user_session = UserSession(
                        user=user,
                        token=token
                    )

                    session.add(user_session)
                    session.commit()

                    logging.debug(f"Handing out {token=} to {user=}")
                    return token
                else:
                    logging.debug(f"Wrong password")
                    # wrong password
                    return None
            else: # user not found
                logging.debug(f"Didn't find user")
                # do about as much work as if the user was found, reduces timing based username enumeration attacks
                hash_password(password)
                return None

    def deauth(self, token):
        with session_scope(self._Session) as session:
            user_session = session.query(UserSession).filter(UserSession.token == token).one_or_none()
            if user_session:
                session.delete(user_session)
                session.commit()
                return True
            else:
                return False

    def Login(self, request, response):
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
                    send_login_email(session, user)
                    return auth_pb2.LoginResponse(next_step=auth_pb2.LoginResponse.LoginStep.SENT_LOGIN_EMAIL)
            else: # user not found
                logging.debug(f"Didn't find user")
                return auth_pb2.LoginResponse(next_step=auth_pb2.LoginResponse.LoginStep.LOGIN_NO_SUCH_USER)

    def Signup(self, request, response):
        logging.debug(f"Signup with {request.email=}")
        sleep(1) # TODO(aapeli) debug
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.email_address == request.email).one_or_none()
            if not user:
                print("Send signup email")
                # TODO(aapeli): implement
                #send_signup_email()
                return auth_pb2.SignupResponse(next_step=auth_pb2.SignupResponse.SignupStep.SENT_SIGNUP_EMAIL)
            else:
                # user exists
                return auth_pb2.SignupResponse(next_step=auth_pb2.SignupResponse.SignupStep.EMAIL_EXISTS)

    def Authenticate(self, request, context):
        token = self.auth(username=request.username, password=request.password)
        if token:
            return auth_pb2.AuthResponse(token=token)
        else:
            return context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid username or password")

    def Deauthenticate(self, request, context):
        logging.info(f"Deauthenticate(token={request.token})")
        if self.deauth(token=request.token):
            return auth_pb2.DeauthResponse()
        else:
            raise Exception("Failed to deauth")
