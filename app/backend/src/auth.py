from typing import Union

import grpc
from crypto import random_bytes, verify_password
from db import session_scope
from models import User, UserSession
from pb import auth_pb2, auth_pb2_grpc


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

class _AuthServicer(auth_pb2_grpc.AuthServicer):
    """
    Does the actual serving of login/logout (auth/deauth) RPCs
    """
    def __init__(self, auth, deauth):
        self._auth = auth
        self._deauth = deauth

    def Authenticate(self, request, context):
        token = self._auth(username=request.username, password=request.password)
        if token:
            return AuthResponse(token=token)
        else:
            return context.abort(grpc.StatusCode.UNAUTHENTICATED, "Invalid username or password")

    def Deauthenticate(self, request, context):
        logging.info(f"Deauthenticate(token={request.token})")
        self._deauth(token=request.token)
        return DeauthResponse(ok=True)

AuthToken = str

class AuthAbstract:
    def __init__(self):
        self._auth_servicer = None

    def get_auth_servicer(self):
        if not self._auth_servicer:
            self._auth_servicer = _AuthServicer(self.auth, self.deauth)
        return self._auth_servicer

    def get_auth_interceptor(self):
        return _AuthValidatorInterceptor(self.has_access)

    def auth(self, username, password) -> Union[None, AuthToken]:
        raise NotImplementedError()

    def deauth(self, token: AuthToken) -> None:
        raise NotImplementedError()

    def has_access(self, token: AuthToken) -> bool:
        raise NotImplementedError()

class Auth(AuthAbstract):
    def __init__(self, Session):
        super().__init__()
        self._Session = Session

    def auth(self, username, password):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.username == username).one_or_none()
            if user:
                if verify_password(user.hashed_password, password):
                    # correct password
                    token = b64encode(random_bytes(32)).decode("utf8")

                    user_session = UserSession(
                        user=user,
                        token=token
                    )

                    session.add(user_session)
                    session.commit()

                    return token
                else:
                    # wrong password
                    return None
            else: # user not found
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
                return None

    def has_access(self, token):
        with session_scope(self._Session) as session:
            user_session = session.query(UserSession).filter(UserSession.token == token).one_or_none() # TODO(aapeli): error checking
            if user_session:
                session.delete(user_session)
                session.commit()
                return True
            else:
                return None
