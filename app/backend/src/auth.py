import grpc
from pb import auth_pb2, auth_pb2_grpc


class SessionStore:
    """
    Session store.

    TODO(aapeli): use DB instead
    """
    def __init__(self):
        self._sessions = {}

    def get_session(self, token):
        return self._sessions[token] or None

    def set_session(self, token, data):
        self._sessions[token] = data

class _AuthValidatorInterceptor(grpc.ServerInterceptor):
    """
    gRPC interceptor that calls `has_access` with the bearer token to check whether this request is authorised
    """
    def __init__(self, has_access):
        def abort(ignored_request, context):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Unauthorised")

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

class Auth:
    def __init__(self, session_store):
        self._session_store = session_store
        self._auth_servicer = None

    def auth(self, username, password):
        # TODO(aapeli): DB checks, password hashing, etc
        if username == "aapeli" and password == "itsi":
            token = b64encode(randbits(256).to_bytes(32, byteorder="little")).decode("utf8")
            self._session_store.set_session(token, "auth'd")
            return token
        return None

    def deauth(self, token):
        token = self._session_store.get_session(token)
        if not token:
            raise Exception("Unknown session")
        del self._session_store[token]

    def has_access(self, token, realm):
        logging.debug(f"Checking access for token {token}")
        realm = self.get_realm(token)
        if realm == "all":
            return True
        return False

    def get_auth_servicer(self):
        if not self._auth_servicer:
            self._auth_servicer = _AuthServicer(self.auth, self.deauth)
        return self._auth_servicer

    def get_auth_interceptor(self):
        return _AuthValidatorInterceptor(self.has_access)
