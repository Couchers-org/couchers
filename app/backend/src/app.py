import json
import logging
import traceback
from concurrent import futures
from datetime import date

import grpc
from crypto import hash_password
from db import session_scope
from interceptors import LoggingInterceptor, intercept_server
from models import Base, User
from pb import api_pb2_grpc, auth_pb2_grpc
from servicers.api import APIServicer
from servicers.auth import Auth
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker
from utils import Timestamp_from_datetime

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s", datefmt="%F %T", level=logging.DEBUG)
logging.info(f"Starting")

engine = create_engine("sqlite:///db.sqlite", echo=False)

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)

def add_dummy_data(file_name):
    with session_scope(Session) as session:
        with open(file_name, "r") as file:
            users = json.loads(file.read())

        for user in users:
            new_user = User(
                username=user["username"],
                email=user["email"],
                hashed_password=hash_password(user["password"]) if user["password"] else None,
                name=user["name"],
                city=user["city"],
                verification=user["verification"],
                community_standing=user["community_standing"],
                birthdate=date(
                    year=user["birthdate"]["year"],
                    month=user["birthdate"]["month"],
                    day=user["birthdate"]["day"]
                ),
                gender=user["gender"],
                languages="|".join(user["languages"]),
                occupation=user["occupation"],
                about_me=user["about_me"],
                about_place=user["about_place"],
                countries_visited="|".join(user["countries_visited"]),
                countries_lived="|".join(user["countries_lived"]),
            )
            session.add(new_user)

logging.info(f"Adding dummy data")

try:
    add_dummy_data("src/dummy_data.json")
except IntegrityError as e:
    print("Failed to insert dummy data, is it already inserted?")

with session_scope(Session) as session:
    for user in session.query(User).all():
        print(user)

auth = Auth(Session)
auth_server = grpc.server(futures.ThreadPoolExecutor(2))
auth_server.add_insecure_port("[::]:1752")
auth_pb2_grpc.add_AuthServicer_to_server(auth, auth_server)
auth_server.start()

server = grpc.server(futures.ThreadPoolExecutor(2))
server = intercept_server(server, LoggingInterceptor())
server = intercept_server(server, auth.get_auth_interceptor())
server.add_insecure_port("[::]:1751")
servicer = APIServicer()
api_pb2_grpc.add_APIServicer_to_server(servicer, server)
server.start()

logging.info(f"Serving on 1751 and 1752 (auth)")

server.wait_for_termination()
auth_server.wait_for_termination()
