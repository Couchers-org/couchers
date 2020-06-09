import json
from concurrent import futures
from datetime import date

import grpc
from auth import Auth, SessionStore
from db import session_scope
from models import Base, User
from nacl.pwhash import str as password_hash
from nacl.pwhash import verify as password_verify
from pb import api_pb2, api_pb2_grpc, auth_pb2_grpc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///db.sqlite", echo=True)

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)

def add_dummy_data(file_name):
    with session_scope(Session) as session:
        with open(file_name, "r") as file:
            users = json.loads(file.read())

        for user in users:
            new_user = User(
                username=user["username"],
                password="",
                name=user["name"],
                city=user["city"],
                verification=user["verification"],
                community_standing=user["community_standing"],
                birth_date=date(
                    year=user["birth_date"]["year"],
                    month=user["birth_date"]["month"],
                    day=user["birth_date"]["day"]
                ),
                gender=user["gender"],
                languages="|".join(user["languages"]),
                occupation=user["occupation"],
                about_me=user["about_me"],
                why=user["why"],
                thing=user["thing"],
                share=user["share"],
                countries_visited="|".join(user["countries_visited"]),
                countries_lived="|".join(user["countries_lived"]),
            )
            session.add(new_user)

try:
    add_dummy_data("src/dummy_data.json")
except:
    print("Failed to insert dummy data, is it already inserted?")

with session_scope(Session) as session:
    for user in session.query(User).all():
        print(user)

class APIServicer(api_pb2_grpc.APIServicer):
    def GetUserById(self, request, context):
        with session_scope(Session) as session:
            user = session.query(User).filter(User.id == request.id).one()
            return api_pb2.User(
                id=user.id,
                name=user.name,
                city=user.city,
                verification=user.verification,
                community_standing=user.community_standing,
                # num_references=user.num_references,
                gender=user.gender,
                # age=user.age,
                languages=user.languages.split("|"),
                occupation=user.occupation,
                about_me=user.about_me,
                why=user.why,
                thing=user.thing,
                share=user.share,
                countries_visited=user.countries_visited.split("|"),
                countries_lived=user.countries_lived.split("|"),
            )


session_store = SessionStore()
auth = Auth(session_store)
auth_server = grpc.server(futures.ThreadPoolExecutor(2))
auth_server.add_insecure_port("[::]:1752")
auth_servicer = auth.get_auth_servicer()
auth_pb2_grpc.add_AuthServicer_to_server(auth_servicer, auth_server)
auth_server.start()

server = grpc.server(futures.ThreadPoolExecutor(2), interceptors=[auth.get_auth_interceptor()])
server.add_insecure_port("[::]:1751")
servicer = APIServicer()
api_pb2_grpc.add_APIServicer_to_server(servicer, server)
server.start()

server.wait_for_termination()
auth_server.wait_for_termination()
