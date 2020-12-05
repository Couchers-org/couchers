import logging
from urllib.parse import parse_qs, quote, unquote, urlencode

import grpc

from couchers import errors
from couchers.crypto import base64decode, base64encode, sso_check_hmac, sso_create_hmac
from couchers.db import session_scope
from couchers.models import User
from pb import sso_pb2, sso_pb2_grpc

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s", datefmt="%F %T", level=logging.DEBUG)

logger = logging.getLogger(__name__)


class SSO(sso_pb2_grpc.SSOServicer):
    def SSO(self, request, context):
        # Protocol description: https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
        with session_scope() as session:
            sso = request.sso
            sig = request.sig

            logger.info(f"Doing SSO login for {context.user_id=}, {sso=}, {sig=}")

            # TODO: secrets management, this is from sso-test instance
            hmac_sec = "b26c7ff6aa391b6a2ba2c0ad18cc6eae40c1a72e5355f86b7b35a4200b514709"

            if not sso_check_hmac(sso, hmac_sec, sig):
                context.abort(grpc.StatusCode.UNAUTHENTICATED, errors.SSO_SIGNATURE_FAILED)

            # grab data from the "sso" string
            decoded_sso = base64decode(unquote(sso))
            parsed_query_string = parse_qs(decoded_sso)

            logger.info(f"SSO {parsed_query_string=}")

            nonce = parsed_query_string["nonce"][0]
            return_sso_url = parsed_query_string["return_sso_url"][0]

            user = session.query(User).filter(User.id == context.user_id).one()

            payload = {
                "nonce": nonce,
                "email": user.email,
                "external_id": user.id,
                "username": user.username,
                "name": user.name,
                # "admin": False
            }

            logger.info(f"SSO {payload=}")

            encoded_payload = base64encode(urlencode(payload))
            payload_sig = sso_create_hmac(encoded_payload, hmac_sec)

            query_string = urlencode({"sso": encoded_payload, "sig": payload_sig})

            redirect_url = f"{return_sso_url}?{query_string}"
            logger.info(f"SSO {redirect_url=}")

            return sso_pb2.SSORes(redirect_url=redirect_url)
