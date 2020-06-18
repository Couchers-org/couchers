import logging
from urllib.parse import parse_qs, quote, unquote, urlencode

import grpc
from crypto import base64decode, base64encode, sso_check_hmac, sso_create_hmac
from db import get_user_by_field, is_valid_color, session_scope
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
                color=user.color,
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

            if request.HasField("color"):
                color = request.color.value.lower()
                if not is_valid_color(color):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Invalid color")
                user.color = color
                res.updated_color = True

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

    def SSO(self, request, context):
        # Protocol description: https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
        with session_scope(self._Session) as session:
            sso = request.sso
            sig = request.sig

            logging.info(f"Doing SSO login for {context.user_id=}, {sso=}, {sig=}")

            # TODO: secrets management, this is from sso-test instance
            hmac_sec = "b26c7ff6aa391b6a2ba2c0ad18cc6eae40c1a72e5355f86b7b35a4200b514709"

            if not sso_check_hmac(sso, hmac_sec, sig):
                context.abort(grpc.StatusCode.UNAUTHENTICATED, "Signature mismatch")

            # grab data from the "sso" string
            decoded_sso = base64decode(unquote(sso))
            parsed_query_string = parse_qs(decoded_sso)

            logging.info(f"SSO {parsed_query_string=}")

            nonce = parsed_query_string["nonce"][0]
            return_sso_url = parsed_query_string["return_sso_url"][0]

            user = session.query(User).filter(User.id == context.user_id).one()

            payload = {
                "nonce": nonce,
                "email": user.email,
                "external_id": user.id,
                "username": user.username,
                "name": user.name,
                #"admin": False
            }

            logging.info(f"SSO {payload=}")

            encoded_payload = base64encode(urlencode(payload))
            payload_sig = sso_create_hmac(encoded_payload, hmac_sec)

            query_string = urlencode({
                "sso": encoded_payload,
                "sig": payload_sig
            })

            redirect_url = f"{return_sso_url}?{query_string}"
            logging.info(f"SSO {redirect_url=}")

            return api_pb2.SSORes(redirect_url=redirect_url)
