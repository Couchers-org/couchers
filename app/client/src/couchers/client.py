import http.cookies

import grpc

from couchers.proto import auth_pb2, auth_pb2_grpc
from couchers.services import get_all_stubs

DEFAULT_SERVER_ADDRESS = "api.couchers.org:8443"


class _CookieCreds:
    def __init__(self, cookie_name, cookie_value):
        self.cookie_name = cookie_name
        self.cookie_value = cookie_value

    def __call__(self, context, callback):
        callback((("cookie", f"{self.cookie_name}={self.cookie_value}"),), None)


class _MetadataKeeperInterceptor(grpc.UnaryUnaryClientInterceptor):
    def __init__(self):
        self.latest_headers = {}

    def intercept_unary_unary(self, continuation, client_call_details, request):
        call = continuation(client_call_details, request)
        self.latest_headers = dict(call.initial_metadata())
        return call


def get_api_key(username, password, server_address, disable_tls):
    with create_channel(None, server_address, disable_tls) as channel:
        metadata_interceptor = _MetadataKeeperInterceptor()
        channel = grpc.intercept_channel(channel, metadata_interceptor)
        auth = auth_pb2_grpc.AuthStub(channel)
        auth.Authenticate(auth_pb2.AuthReq(user=username, password=password))
        return http.cookies.SimpleCookie(metadata_interceptor.latest_headers["set-cookie"])["couchers-sesh"].value


def create_channel(api_key, server_address, disable_tls):
    if disable_tls:
        creds = grpc.local_channel_credentials()
    else:
        creds = grpc.ssl_channel_credentials()

    if api_key:
        cookie_creds = grpc.metadata_call_credentials(_CookieCreds("couchers-sesh", api_key))
        creds = grpc.composite_channel_credentials(creds, cookie_creds)

    return grpc.secure_channel(server_address, creds)


def get_client(username, password, server_address=DEFAULT_SERVER_ADDRESS, disable_tls=False):
    """
    Given username and password (the user must have a password set), returns a client object.

    `disable_tls` connects to the server insecurely. This only works on localhost.

    Returns a new class with attributes corresponding to each stub, with attributes such as `account`, corresponding to
    an account gRPC stub.
    """
    api_key = get_api_key(username, password, server_address, disable_tls)
    channel = create_channel(api_key, server_address, disable_tls)
    stubs = get_all_stubs(channel)
    return type("__Client", (), stubs)
