import logging
from time import time
from urllib.parse import urlparse

import http_ece
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from py_vapid import Vapid
from py_vapid.utils import b64urldecode, b64urlencode

logger = logging.getLogger(__name__)


def gen_vapid_keys():
    prv_key = ec.generate_private_key(ec.SECP256R1())
    pub_key = prv_key.public_key()
    prv = prv_key.private_numbers().private_value.to_bytes(length=32)
    pub = pub_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return b64urlencode(prv), b64urlencode(pub)


def get_vapid_public_key_from_private_key(private):
    pub = Vapid.from_string(private).public_key
    return b64urlencode(pub.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint))


def generate_vapid_authorization(endpoint, vapid_sub, vapid_private_key):
    url = urlparse(endpoint)
    vapid_claim = {
        "sub": vapid_sub,
        "aud": "{}://{}".format(url.scheme, url.netloc),
        "exp": int(time()) + (12 * 60 * 60),
    }
    return Vapid.from_string(private_key=vapid_private_key).sign(vapid_claim)["Authorization"]


class PushException(Exception):
    pass


def send_push(data, endpoint, auth_key, receiver_key, vapid_sub, vapid_private_key):
    logger.debug(f"Sending {len(data)} bytes to {endpoint[:20]}...")
    headers = {
        "authorization": generate_vapid_authorization(endpoint, vapid_sub, vapid_private_key),
        "content-encoding": "aes128gcm",
        "ttl": "0",
    }

    encrypted = http_ece.encrypt(
        data,
        private_key=ec.generate_private_key(ec.SECP256R1()),
        auth_secret=auth_key,
        dh=receiver_key,
    )

    resp = requests.post(
        endpoint,
        timeout=20,
        data=encrypted,
        headers=headers,
    )

    logger.info(resp)

    if resp.status_code != 201:
        raise PushException(f"Push failed: {resp.status_code}/{resp.text}")


def decode_key(value):
    return b64urldecode(value.encode())


def parse_subscription_info(subscription_info):
    endpoint = subscription_info["endpoint"]
    auth_key = decode_key(subscription_info["keys"]["auth"])
    receiver_key = decode_key(subscription_info["keys"]["p256dh"])
    return endpoint, auth_key, receiver_key
