import logging
import os
import sys
from concurrent import futures

import grpc
from couchers.config import config
from couchers.interceptors import LoggingInterceptor, UpdateLastActiveTimeInterceptor
from couchers.models import Base
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.bugs import Bugs
from couchers.servicers.conversations import Conversations
from couchers.servicers.media import Media
from couchers.servicers.requests import Requests
from couchers.servicers.media import Media, get_media_auth_interceptor
from couchers.servicers.sso import SSO
from dummy_data import add_dummy_data
from pb import (
    api_pb2_grpc,
    auth_pb2_grpc,
    bugs_pb2_grpc,
    conversations_pb2_grpc,
    media_pb2_grpc,
    requests_pb2_grpc,
    sso_pb2_grpc,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# hex-encoded secret key, used for signatures that  verify main & media server
# are talking to each other
MEDIA_SERVER_BEARER_TOKEN = config["MEDIA_SERVER_BEARER_TOKEN"]

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s", datefmt="%F %T", level=logging.INFO)
logger = logging.getLogger(__name__)


def log_unhandled_exception(exc_type, exc_value, exc_traceback):
    """Make sure that any unhandled exceptions will write to the logs"""
    if issubclass(exc_type, KeyboardInterrupt):
        # call the default excepthook saved at __excepthook__
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logger.critical("Unhandled exception", exc_info=(exc_type, exc_value, exc_traceback))


sys.excepthook = log_unhandled_exception

logger.info(f"Starting")

engine = create_engine("sqlite:///db.sqlite", echo=False)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

add_dummy_data(Session, "src/dummy_data.json")

auth = Auth(Session)
open_server = grpc.server(futures.ThreadPoolExecutor(2), interceptors=[LoggingInterceptor()])
open_server.add_insecure_port("[::]:1752")
auth_pb2_grpc.add_AuthServicer_to_server(auth, open_server)
bugs_pb2_grpc.add_BugsServicer_to_server(Bugs(), open_server)
open_server.start()

servicer = API(Session)
server = grpc.server(
    futures.ThreadPoolExecutor(2),
    interceptors=[
        LoggingInterceptor(),
        auth.get_auth_interceptor(),
        UpdateLastActiveTimeInterceptor(servicer.update_last_active_time),
    ],
)
server.add_insecure_port("[::]:1751")
api_pb2_grpc.add_APIServicer_to_server(servicer, server)
sso_pb2_grpc.add_SSOServicer_to_server(SSO(Session), server)
conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(Session), server)
requests_pb2_grpc.add_RequestsServicer_to_server(Requests(Session), server)
server.start()

media_server = grpc.server(
    futures.ThreadPoolExecutor(2),
    interceptors=[LoggingInterceptor(), get_media_auth_interceptor(MEDIA_SERVER_BEARER_TOKEN)],
)
media_server.add_insecure_port("[::]:1753")
media_pb2_grpc.add_MediaServicer_to_server(Media(Session), media_server)
media_server.start()

logger.info(f"Serving on 1751 (secure), 1752 (auth), and 1753 (media)")

server.wait_for_termination()
auth_server.wait_for_termination()
media_server.wait_for_termination()
