import logging
import signal
import sys
from concurrent import futures

import grpc
from prometheus_client import start_http_server

from couchers import config
from couchers.db import apply_migrations, session_scope
from couchers.metrics import main_process_registry
from couchers.interceptors import ErrorSanitizationInterceptor, TracingInterceptor
from couchers.jobs.worker import start_jobs_scheduler, start_jobs_worker
from couchers.servicers.account import Account
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.blocking import Blocking
from couchers.servicers.bugs import Bugs
from couchers.servicers.communities import Communities
from couchers.servicers.conversations import Conversations
from couchers.servicers.discussions import Discussions
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
from dummy_data import add_dummy_data
from pb import (
    account_pb2_grpc,
    api_pb2_grpc,
    auth_pb2_grpc,
    blocking_pb2_grpc,
    bugs_pb2_grpc,
    communities_pb2_grpc,
    conversations_pb2_grpc,
    discussions_pb2_grpc,
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
    threads_pb2_grpc,
)

config.check_config()

logging.basicConfig(format="%(asctime)s: %(name)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

logging.getLogger("couchers.jobs.worker").setLevel(logging.INFO)

start_http_server(8000, main_process_registry)


def log_unhandled_exception(exc_type, exc_value, exc_traceback):
    """Make sure that any unhandled exceptions will write to the logs"""
    if issubclass(exc_type, KeyboardInterrupt):
        # call the default excepthook saved at __excepthook__
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_traceback))


sys.excepthook = log_unhandled_exception

logger.info(f"Checking DB connection")

with session_scope() as session:
    res = session.execute("SELECT 42;")
    if list(res) != [(42,)]:
        raise Exception("Failed to connect to DB")

logger.info(f"Running DB migrations")

apply_migrations()

if config.config["ADD_DUMMY_DATA"]:
    add_dummy_data()

logger.info(f"Starting")

if config.config["ROLE"] in ["api", "all"]:
    auth = Auth()
    open_server = grpc.server(
        futures.ThreadPoolExecutor(8), interceptors=[ErrorSanitizationInterceptor(), TracingInterceptor()]
    )
    open_server.add_insecure_port("[::]:1752")
    auth_pb2_grpc.add_AuthServicer_to_server(auth, open_server)
    bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), open_server)
    resources_pb2_grpc.add_ResourcesServicer_to_server(Resources(), open_server)
    open_server.start()

    jailed_server = grpc.server(
        futures.ThreadPoolExecutor(8),
        interceptors=[
            ErrorSanitizationInterceptor(),
            TracingInterceptor(),
            auth.get_auth_interceptor(allow_jailed=True),
        ],
    )
    jailed_server.add_insecure_port("[::]:1754")
    jail_pb2_grpc.add_JailServicer_to_server(Jail(), jailed_server)
    jailed_server.start()

    servicer = API()
    server = grpc.server(
        futures.ThreadPoolExecutor(64),
        interceptors=[
            ErrorSanitizationInterceptor(),
            TracingInterceptor(),
            auth.get_auth_interceptor(allow_jailed=False),
        ],
    )
    server.add_insecure_port("[::]:1751")

    account_pb2_grpc.add_AccountServicer_to_server(Account(), server)
    api_pb2_grpc.add_APIServicer_to_server(servicer, server)
    blocking_pb2_grpc.add_BlockingServicer_to_server(Blocking(), server)
    communities_pb2_grpc.add_CommunitiesServicer_to_server(Communities(), server)
    conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), server)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), server)
    events_pb2_grpc.add_EventsServicer_to_server(Events(), server)
    gis_pb2_grpc.add_GISServicer_to_server(GIS(), server)
    groups_pb2_grpc.add_GroupsServicer_to_server(Groups(), server)
    pages_pb2_grpc.add_PagesServicer_to_server(Pages(), server)
    references_pb2_grpc.add_ReferencesServicer_to_server(References(), server)
    requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), server)
    search_pb2_grpc.add_SearchServicer_to_server(Search(), server)
    threads_pb2_grpc.add_ThreadsServicer_to_server(Threads(), server)

    server.start()

    media_server = grpc.server(
        futures.ThreadPoolExecutor(8),
        interceptors=[TracingInterceptor(), get_media_auth_interceptor(config.config["MEDIA_SERVER_BEARER_TOKEN"])],
    )
    media_server.add_insecure_port("[::]:1753")
    media_pb2_grpc.add_MediaServicer_to_server(Media(), media_server)
    media_server.start()

    logger.info(f"Serving on 1751 (secure), 1752 (auth), 1753 (media), and 1754 (jailed)")

if config.config["ROLE"] in ["scheduler", "all"]:
    scheduler = start_jobs_scheduler()

if config.config["ROLE"] in ["worker", "all"]:
    worker = start_jobs_worker()

logger.info("App waiting for signal...")

signal.pause()
