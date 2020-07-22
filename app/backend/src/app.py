import logging
from concurrent import futures

import grpc
from couchers.interceptors import (LoggingInterceptor,
                                   UpdateLastActiveTimeInterceptor,
                                   intercept_server)
from couchers.models import Base
from couchers.servicers.api import API
from couchers.servicers.auth import Auth
from couchers.servicers.conversations import Conversations
from couchers.servicers.sso import SSO
from dummy_data import add_dummy_data
from pb import (api_pb2_grpc, auth_pb2_grpc, conversations_pb2_grpc,
                sso_pb2_grpc)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s", datefmt="%F %T", level=logging.INFO)
logging.info(f"Starting")

engine = create_engine("sqlite:///db.sqlite", echo=False)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

add_dummy_data(Session, "src/dummy_data.json")

auth = Auth(Session)
auth_server = grpc.server(futures.ThreadPoolExecutor(2))
auth_server.add_insecure_port("[::]:1752")
auth_pb2_grpc.add_AuthServicer_to_server(auth, auth_server)
auth_server.start()

server = grpc.server(futures.ThreadPoolExecutor(2))
server = intercept_server(server, LoggingInterceptor())
server = intercept_server(server, auth.get_auth_interceptor())

servicer = API(Session)
server = intercept_server(server, UpdateLastActiveTimeInterceptor(servicer.update_last_active_time))
server.add_insecure_port("[::]:1751")
api_pb2_grpc.add_APIServicer_to_server(servicer, server)
sso_pb2_grpc.add_SSOServicer_to_server(SSO(Session), server)
conversations_pb2_grpc.add_ConversationsServicer_to_server(Conversations(Session), server)
server.start()

logging.info(f"Serving on 1751 and 1752 (auth)")

server.wait_for_termination()
auth_server.wait_for_termination()
