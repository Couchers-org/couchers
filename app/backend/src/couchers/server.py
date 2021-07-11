from concurrent import futures

import grpc

from couchers import config
from couchers.interceptors import AuthValidatorInterceptor, ErrorSanitizationInterceptor, TracingInterceptor
from couchers.servicers.account import Account
from couchers.servicers.admin import Admin
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.blocking import Blocking
from couchers.servicers.bugs import Bugs
from couchers.servicers.communities import Communities
from couchers.servicers.conversations import Conversations
from couchers.servicers.discussions import Discussions
from couchers.servicers.donations import Donations, Stripe
from couchers.servicers.events import Events
from couchers.servicers.gis import GIS
from couchers.servicers.groups import Groups
from couchers.servicers.jail import Jail
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.pages import Pages
from couchers.servicers.references import References
from couchers.servicers.requests import Requests
from couchers.servicers.resources import Resources
from couchers.servicers.search import Search
from couchers.servicers.threads import Threads
from proto import (
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
    events_pb2_grpc,
    gis_pb2_grpc,
    groups_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    pages_pb2_grpc,
    references_pb2_grpc,
    requests_pb2_grpc,
    resources_pb2_grpc,
    search_pb2_grpc,
    stripe_pb2_grpc,
    threads_pb2_grpc,
)


def create_main_server(port, threads=64):
    server = grpc.server(
        futures.ThreadPoolExecutor(threads),
        interceptors=[
            ErrorSanitizationInterceptor(),
            TracingInterceptor(),
            AuthValidatorInterceptor(),
        ],
    )
    server.add_insecure_port(f"[::]:{port}")

    account_pb2_grpc.add_AccountServicer_to_server(Account(), server)
    admin_pb2_grpc.add_AdminServicer_to_server(Admin(), server)
    api_pb2_grpc.add_APIServicer_to_server(API(), server)
    auth_pb2_grpc.add_AuthServicer_to_server(Auth(), server)
    blocking_pb2_grpc.add_BlockingServicer_to_server(Blocking(), server)
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), server)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), server)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), server)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), server)
    donations_pb2_grpc.add_DonationsServicer_to_server(Donations(), server)
    events_pb2_grpc.add_EventsServicer_to_server(Events(), server)
    gis_pb2_grpc.add_GISServicer_to_server(GIS(), server)
    groups_pb2_grpc.add_GroupsServicer_to_server(Groups(), server)
    jail_pb2_grpc.add_JailServicer_to_server(Jail(), server)
    pages_pb2_grpc.add_PagesServicer_to_server(Pages(), server)
    references_pb2_grpc.add_ReferencesServicer_to_server(References(), server)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), server)
    resources_pb2_grpc.add_ResourcesServicer_to_server(Resources(), server)
    search_pb2_grpc.add_SearchServicer_to_server(Search(), server)
    stripe_pb2_grpc.add_StripeServicer_to_server(Stripe(), server)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), server)
    return server


def create_media_server(port, threads=8):
    media_server = grpc.server(
        futures.ThreadPoolExecutor(threads),
        interceptors=[TracingInterceptor(), get_media_auth_interceptor(config.config["MEDIA_SERVER_BEARER_TOKEN"])],
    )
    media_server.add_insecure_port(f"[::]:{port}")
    media_pb2_grpc.add_MediaServicer_to_server(Media(), media_server)
    return media_server
