from collections.abc import Generator
from concurrent import futures
from contextlib import contextmanager
from typing import Any, NoReturn
from zoneinfo import ZoneInfo

import grpc
from grpc._server import _validate_generic_rpc_handlers

from couchers.context import make_interactive_context
from couchers.db import session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.i18n import LocalizationContext
from couchers.i18n.locales import DEFAULT_LOCALE
from couchers.interceptors import (
    CouchersMiddlewareInterceptor,
    _try_get_and_update_user_details,
    check_permissions,
    find_auth_level,
)
from couchers.proto import (
    account_pb2_grpc,
    admin_pb2_grpc,
    api_pb2_grpc,
    auth_pb2_grpc,
    blocking_pb2_grpc,
    bugs_pb2_grpc,
    communities_pb2_grpc,
    conversations_pb2_grpc,
    discussions_pb2_grpc,
    donations_pb2_grpc,
    editor_pb2_grpc,
    events_pb2_grpc,
    galleries_pb2_grpc,
    gis_pb2_grpc,
    groups_pb2_grpc,
    iris_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    moderation_pb2_grpc,
    notifications_pb2_grpc,
    pages_pb2_grpc,
    postal_verification_pb2_grpc,
    public_pb2_grpc,
    references_pb2_grpc,
    reporting_pb2_grpc,
    requests_pb2_grpc,
    resources_pb2_grpc,
    search_pb2_grpc,
    stripe_pb2_grpc,
    threads_pb2_grpc,
)
from couchers.repositories import DB
from couchers.servicers.account import Account, Iris
from couchers.servicers.admin import Admin
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.blocking import Blocking
from couchers.servicers.bugs import Bugs
from couchers.servicers.communities import Communities
from couchers.servicers.conversations import Conversations
from couchers.servicers.discussions import Discussions
from couchers.servicers.donations import Donations, Stripe
from couchers.servicers.editor import Editor
from couchers.servicers.events import Events
from couchers.servicers.galleries import Galleries
from couchers.servicers.gis import GIS
from couchers.servicers.groups import Groups
from couchers.servicers.jail import Jail
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.moderation import Moderation
from couchers.servicers.notifications import Notifications
from couchers.servicers.pages import Pages
from couchers.servicers.postal_verification import PostalVerification
from couchers.servicers.public import Public
from couchers.servicers.references import References
from couchers.servicers.reporting import Reporting
from couchers.servicers.requests import Requests
from couchers.servicers.resources import Resources
from couchers.servicers.search import Search
from couchers.servicers.threads import Threads


class _MockCouchersContext:
    @property
    def headers(self):
        return {}


class CookieMetadataPlugin(grpc.AuthMetadataPlugin):
    """
    Injects the right `cookie: couchers-sesh=...` header into the metadata
    """

    def __init__(self, token: str):
        self.token = token

    def __call__(self, context, callback) -> None:
        callback((("cookie", f"couchers-sesh={self.token}"),), None)


class MetadataKeeperInterceptor(grpc.UnaryUnaryClientInterceptor):
    def __init__(self):
        self.latest_headers = {}

    def intercept_unary_unary(self, continuation, client_call_details, request):
        call = continuation(client_call_details, request)
        self.latest_headers = dict(call.initial_metadata())
        self.latest_header_raw = call.initial_metadata()
        return call


class FakeRpcError(grpc.RpcError):
    def __init__(self, code: grpc.StatusCode, details: str):
        self._code = code
        self._details = details

    def code(self) -> grpc.StatusCode:
        return self._code

    def details(self) -> str:
        return self._details


class MockGrpcContext:
    """
    Pure mock of grpc.ServicerContext for testing.
    """

    def __init__(self):
        self._initial_metadata = []
        self._invocation_metadata: list[tuple[str, str]] = []

    def abort(self, code: grpc.StatusCode, details: str) -> NoReturn:
        raise FakeRpcError(code, details)

    def invocation_metadata(self) -> list[tuple[str, str]]:
        return self._invocation_metadata

    def send_initial_metadata(self, metadata):
        self._initial_metadata.extend(metadata)


class FakeChannel:
    """
    Mock gRPC channel for testing that orchestrates context creation.

    This holds the test state (token) and creates proper CouchersContext
    instances when handlers are invoked.
    """

    def __init__(self, token: str | None = None):
        self.handlers: dict[str, Any] = {}
        self._token = token
        self._pool = get_descriptor_pool()

    def add_generic_rpc_handlers(self, generic_rpc_handlers: Any):
        _validate_generic_rpc_handlers(generic_rpc_handlers)
        self.handlers.update(generic_rpc_handlers[0]._method_handlers)

    def unary_unary(self, method, request_serializer, response_deserializer):
        handler = self.handlers[method]

        def fake_handler(request):
            auth_info = _try_get_and_update_user_details(
                self._token, is_api_key=False, ip_address="127.0.0.1", user_agent="Testing User-Agent"
            )
            auth_level = find_auth_level(self._pool, method)
            check_permissions(auth_info, auth_level)

            # Do a full serialization cycle on the request and the
            # response to catch accidental use of unserializable data.
            request = handler.request_deserializer(request_serializer(request))

            with session_scope() as session:
                db = DB(session)
                context = make_interactive_context(
                    grpc_context=MockGrpcContext(),
                    user_id=auth_info.user_id if auth_info else None,
                    is_api_key=False,
                    token=self._token if auth_info else None,
                    localization=LocalizationContext(
                        locale=(auth_info and auth_info.ui_language_preference) or DEFAULT_LOCALE,
                        timezone=ZoneInfo((auth_info and auth_info.timezone) or "Etc/UTC"),
                    ),
                )

                response = handler.unary_unary(request, context, db)

            return response_deserializer(handler.response_serializer(response))

        return fake_handler


@contextmanager
def run_server(grpc_channel_options=(), token: str | None = None):
    with futures.ThreadPoolExecutor(1) as executor:
        if token:
            call_creds = grpc.metadata_call_credentials(CookieMetadataPlugin(token))
            creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)
        else:
            creds = grpc.local_channel_credentials()

        srv = grpc.server(executor, interceptors=[CouchersMiddlewareInterceptor()])
        port = srv.add_secure_port("localhost:0", grpc.local_server_credentials())
        srv.start()

        try:
            with grpc.secure_channel(f"localhost:{port}", creds, options=grpc_channel_options) as channel:
                metadata_interceptor = MetadataKeeperInterceptor()
                channel = grpc.intercept_channel(channel, metadata_interceptor)
                yield srv, channel, metadata_interceptor
        finally:
            srv.stop(None).wait()


# Sessions that start a real GRPC server.
@contextmanager
def auth_api_session(
    grpc_channel_options=(),
) -> Generator[tuple[auth_pb2_grpc.AuthStub, MetadataKeeperInterceptor]]:
    """
    Create an Auth API for testing

    This needs to use the real server since it plays around with headers
    """
    with run_server(grpc_channel_options) as (server, channel, metadata_interceptor):
        auth_pb2_grpc.add_AuthServicer_to_server(Auth(), server)
        yield auth_pb2_grpc.AuthStub(channel), metadata_interceptor


@contextmanager
def real_api_session(token: str):
    """
    Create an API for testing, using TCP sockets, uses the token for auth
    """
    with run_server(token=token) as (server, channel, metadata_interceptor):
        api_pb2_grpc.add_APIServicer_to_server(API(), server)
        yield api_pb2_grpc.APIStub(channel)


@contextmanager
def real_admin_session(token: str):
    """
    Create an Admin service for testing, using TCP sockets, uses the token for auth
    """
    with run_server(token=token) as (server, channel, metadata_interceptor):
        admin_pb2_grpc.add_AdminServicer_to_server(Admin(), server)
        yield admin_pb2_grpc.AdminStub(channel)


@contextmanager
def real_editor_session(token: str):
    """
    Create an Editor service for testing, using TCP sockets, uses the token for auth
    """
    with run_server(token=token) as (server, channel, metadata_interceptor):
        editor_pb2_grpc.add_EditorServicer_to_server(Editor(), server)
        yield editor_pb2_grpc.EditorStub(channel)


@contextmanager
def real_moderation_session(token: str):
    """
    Create a Moderation service for testing, using TCP sockets, uses the token for auth
    """
    with run_server(token=token) as (server, channel, metadata_interceptor):
        moderation_pb2_grpc.add_ModerationServicer_to_server(Moderation(), server)
        yield moderation_pb2_grpc.ModerationStub(channel)


@contextmanager
def real_account_session(token: str):
    """
    Create an Account service for testing, using TCP sockets, uses the token for auth
    """
    with run_server(token=token) as (server, channel, metadata_interceptor):
        account_pb2_grpc.add_AccountServicer_to_server(Account(), server)
        yield account_pb2_grpc.AccountStub(channel)


@contextmanager
def real_jail_session(token: str):
    """
    Create a Jail service for testing, using TCP sockets, uses the token for auth
    """
    with run_server(token=token) as (server, channel, metadata_interceptor):
        jail_pb2_grpc.add_JailServicer_to_server(Jail(), server)
        yield jail_pb2_grpc.JailStub(channel)


@contextmanager
def real_stripe_session():
    """
    Create a Stripe service for testing, using TCP sockets
    """
    with run_server() as (server, channel, metadata_interceptor):
        stripe_pb2_grpc.add_StripeServicer_to_server(Stripe(), server)
        yield stripe_pb2_grpc.StripeStub(channel)


@contextmanager
def real_iris_session():
    with run_server() as (server, channel, metadata_interceptor):
        iris_pb2_grpc.add_IrisServicer_to_server(Iris(), server)
        yield iris_pb2_grpc.IrisStub(channel)


@contextmanager
def media_session(bearer_token: str):
    """
    Create a fresh Media API for testing, uses the bearer token for media auth
    """
    media_auth_interceptor = get_media_auth_interceptor(bearer_token)

    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[media_auth_interceptor])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())
        media_pb2_grpc.add_MediaServicer_to_server(Media(), server)
        server.start()

        call_creds = grpc.access_token_call_credentials(bearer_token)
        comp_creds = grpc.composite_channel_credentials(grpc.local_channel_credentials(), call_creds)

        try:
            with grpc.secure_channel(f"localhost:{port}", comp_creds) as channel:
                yield media_pb2_grpc.MediaStub(channel)
        finally:
            server.stop(None).wait()


# Sessions that don't need to start a real GRPC server.
# Note: these don't need to be context managers, but they are so that
# we can switch to a real implementation if needed.
@contextmanager
def api_session(token: str):
    """
    Create an API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    api_pb2_grpc.add_APIServicer_to_server(API(), channel)
    yield api_pb2_grpc.APIStub(channel)


@contextmanager
def gis_session(token: str):
    channel = FakeChannel(token)
    gis_pb2_grpc.add_GISServicer_to_server(GIS(), channel)
    yield gis_pb2_grpc.GISStub(channel)


@contextmanager
def public_session():
    channel = FakeChannel()
    public_pb2_grpc.add_PublicServicer_to_server(Public(), channel)
    yield public_pb2_grpc.PublicStub(channel)


@contextmanager
def conversations_session(token: str):
    """
    Create a Conversations API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), channel)
    yield conversations_pb2_grpc.ConversationsStub(channel)


@contextmanager
def requests_session(token: str):
    """
    Create a Requests API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), channel)
    yield requests_pb2_grpc.RequestsStub(channel)


@contextmanager
def threads_session(token: str):
    channel = FakeChannel(token)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), channel)
    yield threads_pb2_grpc.ThreadsStub(channel)


@contextmanager
def discussions_session(token: str):
    channel = FakeChannel(token)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), channel)
    yield discussions_pb2_grpc.DiscussionsStub(channel)


@contextmanager
def donations_session(token: str):
    channel = FakeChannel(token)
    donations_pb2_grpc.add_DonationsServicer_to_server(Donations(), channel)
    yield donations_pb2_grpc.DonationsStub(channel)


@contextmanager
def pages_session(token: str):
    channel = FakeChannel(token)
    pages_pb2_grpc.add_PagesServicer_to_server(Pages(), channel)
    yield pages_pb2_grpc.PagesStub(channel)


@contextmanager
def communities_session(token: str):
    channel = FakeChannel(token)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), channel)
    yield communities_pb2_grpc.CommunitiesStub(channel)


@contextmanager
def groups_session(token: str):
    channel = FakeChannel(token)
    groups_pb2_grpc.add_GroupsServicer_to_server(Groups(), channel)
    yield groups_pb2_grpc.GroupsStub(channel)


@contextmanager
def blocking_session(token: str):
    channel = FakeChannel(token)
    blocking_pb2_grpc.add_BlockingServicer_to_server(Blocking(), channel)
    yield blocking_pb2_grpc.BlockingStub(channel)


@contextmanager
def notifications_session(token: str):
    channel = FakeChannel(token)
    notifications_pb2_grpc.add_NotificationsServicer_to_server(Notifications(), channel)
    yield notifications_pb2_grpc.NotificationsStub(channel)


@contextmanager
def account_session(token: str):
    """
    Create a Account API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    account_pb2_grpc.add_AccountServicer_to_server(Account(), channel)
    yield account_pb2_grpc.AccountStub(channel)


@contextmanager
def search_session(token: str):
    """
    Create a Search API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    search_pb2_grpc.add_SearchServicer_to_server(Search(), channel)
    yield search_pb2_grpc.SearchStub(channel)


@contextmanager
def references_session(token: str):
    """
    Create a References API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    references_pb2_grpc.add_ReferencesServicer_to_server(References(), channel)
    yield references_pb2_grpc.ReferencesStub(channel)


@contextmanager
def galleries_session(token: str):
    """
    Create a Galleries API for testing, uses the token for auth
    """
    channel = FakeChannel(token)
    galleries_pb2_grpc.add_GalleriesServicer_to_server(Galleries(), channel)
    yield galleries_pb2_grpc.GalleriesStub(channel)


@contextmanager
def reporting_session(token: str):
    channel = FakeChannel(token)
    reporting_pb2_grpc.add_ReportingServicer_to_server(Reporting(), channel)
    yield reporting_pb2_grpc.ReportingStub(channel)


@contextmanager
def events_session(token: str):
    channel = FakeChannel(token)
    events_pb2_grpc.add_EventsServicer_to_server(Events(), channel)
    yield events_pb2_grpc.EventsStub(channel)


@contextmanager
def postal_verification_session(token: str):
    channel = FakeChannel(token)
    postal_verification_pb2_grpc.add_PostalVerificationServicer_to_server(PostalVerification(), channel)
    yield postal_verification_pb2_grpc.PostalVerificationStub(channel)


@contextmanager
def bugs_session(token: str | None = None):
    channel = FakeChannel(token)
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), channel)
    yield bugs_pb2_grpc.BugsStub(channel)


@contextmanager
def resources_session():
    channel = FakeChannel()
    resources_pb2_grpc.add_ResourcesServicer_to_server(Resources(), channel)
    yield resources_pb2_grpc.ResourcesStub(channel)
