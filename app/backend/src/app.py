import logging
import os
import sys
from concurrent import futures

import grpc

from couchers import config
from couchers.db import apply_migrations, session_scope
from couchers.interceptors import ErrorSanitizationInterceptor, LoggingInterceptor
from couchers.models import Base
from couchers.servicers.account import Account
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.bugs import Bugs
from couchers.servicers.conversations import Conversations
from couchers.servicers.gis import GIS
from couchers.servicers.jail import Jail
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.requests import Requests
from couchers.servicers.sso import SSO
from dummy_data import add_dummy_data
from pb import (
    account_pb2_grpc,
    api_pb2_grpc,
    auth_pb2_grpc,
    bugs_pb2_grpc,
    conversations_pb2_grpc,
    gis_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    requests_pb2_grpc,
    sso_pb2_grpc,
)

config.check_config()

# hex-encoded secret key, used for signatures that  verify main & media server
# are talking to each other
MEDIA_SERVER_BEARER_TOKEN = config.config["MEDIA_SERVER_BEARER_TOKEN"]

logging.basicConfig(format="%(asctime)s: %(name)d: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)


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
    add_dummy_data("src/dummy_data.json")

logger.info(f"Starting")

auth = Auth()
open_server = grpc.server(
    futures.ThreadPoolExecutor(2), interceptors=[ErrorSanitizationInterceptor(), LoggingInterceptor()]
)
open_server.add_insecure_port("[::]:1752")
auth_pb2_grpc.add_AuthServicer_to_server(auth, open_server)
bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), open_server)
# TODO: secure server
gis_pb2_grpc.add_GISServicer_to_server(GIS(), open_server)
open_server.start()

jailed_server = grpc.server(
    futures.ThreadPoolExecutor(2),
    interceptors=[ErrorSanitizationInterceptor(), LoggingInterceptor(), auth.get_auth_interceptor(allow_jailed=True)],
)
jailed_server.add_insecure_port("[::]:1754")
jail_pb2_grpc.add_JailServicer_to_server(Jail(), jailed_server)
jailed_server.start()

servicer = API()
server = grpc.server(
    futures.ThreadPoolExecutor(2),
    interceptors=[
        ErrorSanitizationInterceptor(),
        LoggingInterceptor(),
        auth.get_auth_interceptor(allow_jailed=False),
    ],
)
server.add_insecure_port("[::]:1751")

account_pb2_grpc.add_AccountServicer_to_server(Account(), server)
api_pb2_grpc.add_APIServicer_to_server(servicer, server)
conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(), server)
requests_pb2_grpc.add_RequestsServicer_to_server(Requests(), server)
sso_pb2_grpc.add_SSOServicer_to_server(SSO(), server)

server.start()

media_server = grpc.server(
    futures.ThreadPoolExecutor(2),
    interceptors=[LoggingInterceptor(), get_media_auth_interceptor(MEDIA_SERVER_BEARER_TOKEN)],
)
media_server.add_insecure_port("[::]:1753")
media_pb2_grpc.add_MediaServicer_to_server(Media(), media_server)
media_server.start()

logger.info(f"Serving on 1751 (secure), 1752 (auth), 1753 (media), and 1754 (jailed)")

server.wait_for_termination()
jailed_server.wait_for_termination()
auth_server.wait_for_termination()
media_server.wait_for_termination()
