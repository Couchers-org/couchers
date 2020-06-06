import json
from concurrent import futures
from contextlib import contextmanager
from datetime import date

import grpc
from models import Base, User
from pb import api_pb2, api_pb2_grpc
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///db.sqlite", echo=True)

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)

@contextmanager
def session_scope():
    """Provide a transactional scope around a series of operations."""
    session = Session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()

def add_dummy_data(file_name):
    with session_scope() as session:
        with open(file_name, "r") as file:
            users = json.loads(file.read())

        for user in users:
            new_user = User(
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
                share=user["share"],
                countries_visited="|".join(user["countries_visited"]),
                countries_lived="|".join(user["countries_lived"]),
            )
            session.add(new_user)

#add_dummy_data("src/dummy_data.json")

with session_scope() as session:
    for user in session.query(User).all():
        print(user)

class APIServicer(api_pb2_grpc.APIServicer):
    def GetUserById(self, request, context):
        with session_scope() as session:
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
                share=user.share,
                countries_visited=user.countries_visited.split("|"),
                countries_lived=user.countries_lived.split("|"),
            )

server = grpc.server(futures.ThreadPoolExecutor(2))
server.add_insecure_port("[::]:1751")
servicer = APIServicer()
api_pb2_grpc.add_APIServicer_to_server(servicer, server)

server.start()
server.wait_for_termination()
