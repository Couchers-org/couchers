import logging

import grpc
from db import get_user_by_field, session_scope
from models import User
from pb import api_pb2, api_pb2_grpc
from utils import Timestamp_from_datetime

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s", datefmt="%F %T", level=logging.DEBUG)

class APIServicer(api_pb2_grpc.APIServicer):
    def __init__(self, Session):
        self._Session = Session

    def Ping(self, request, context):
        with session_scope(self._Session) as session:
            # auth ought to make sure the user exists
            user = session.query(User).filter(User.id == context.user_id).one()
            return api_pb2.PingRes(
                user_id=user.id,
                username=user.username,
                name=user.name
            )

    def GetUser(self, request, context):
        with session_scope(self._Session) as session:
            user = get_user_by_field(session, request.user)
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, "No such user.")
            
            return api_pb2.User(
                username=user.username,
                name=user.name,
                city=user.city,
                verification=user.verification,
                community_standing=user.community_standing,
                num_references=0,
                gender=user.gender,
                age=user.age,
                joined=Timestamp_from_datetime(user.display_joined),
                last_active=Timestamp_from_datetime(user.display_last_active),
                occupation=user.occupation,
                about_me=user.about_me,
                about_place=user.about_place,
                languages=user.languages.split("|") if user.languages else [],
                countries_visited=user.countries_visited.split("|") if user.countries_visited else [],
                countries_lived=user.countries_lived.split("|") if user.countries_lived else []
            )

    def UpdateProfile(self, request, context):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            res = api_pb2.UpdateProfileRes()

            if request.HasField("name"):
                user.name = request.name.value
                res.updated_name = True

            if request.HasField("city"):
                user.city = request.city.value
                res.updated_city = True

            if request.HasField("gender"):
                user.gender = request.gender.value
                res.updated_gender = True

            if request.HasField("occupation"):
                user.occupation = request.occupation.value
                res.updated_occupation = True

            if request.HasField("about_me"):
                user.about_me = request.about_me.value
                res.updated_about_me = True

            if request.HasField("about_place"):
                user.about_place = request.about_place.value
                res.updated_about_place = True

            if request.languages.exists:
                user.languages = "|".join(request.languages.value)
                res.updated_languages = True

            if request.countries_visited.exists:
                user.countries_visited = "|".join(request.countries_visited.value)
                res.updated_countries_visited = True

            if request.countries_lived.exists:
                user.countries_lived = "|".join(request.countries_lived.value)
                res.updated_countries_lived = True

            # save updates
            session.commit()

            return res
