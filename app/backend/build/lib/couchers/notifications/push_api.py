import logging
from time import time
from urllib.parse import urlparse

import http_ece
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from py_vapid import Vapid

from couchers.crypto import b64decode_unpadded, b64encode_unpadded

logger = logging.getLogger(__name__)


def gen_vapid_keys():
    prv_key = ec.generate_private_key(ec.SECP256R1())
    pub_key = prv_key.public_key()
    prv = prv_key.private_numbers().private_value.to_bytes(length=32)
    pub = pub_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return b64encode_unpadded(prv), b64encode_unpadded(pub)


def get_vapid_public_key_from_private_key(private):
    pub = Vapid.from_string(private).public_key
    return b64encode_unpadded(
        pub.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    )


def generate_vapid_authorization(endpoint, vapid_sub, vapid_private_key):
    url = urlparse(endpoint)
    vapid_claim = {
        "sub": vapid_sub,
        "aud": f"{url.scheme}://{url.netloc}",
        "exp": int(time()) + (12 * 60 * 60),
    }
    return Vapid.from_string(private_key=vapid_private_key).sign(vapid_claim)["Authorization"]


def send_push(data, endpoint, auth_key, receiver_key, vapid_sub, vapid_private_key, ttl=0):
    logger.debug(f"Sending {len(data)} bytes to {endpoint[:20]}...")
    headers = {
        "authorization": generate_vapid_authorization(endpoint, vapid_sub, vapid_private_key),
        "content-encoding": "aes128gcm",
        "ttl": str(ttl),
    }

    encrypted = http_ece.encrypt(
        data,
        private_key=ec.generate_private_key(ec.SECP256R1()),
        auth_secret=auth_key,
        dh=receiver_key,
    )

    return requests.post(
        endpoint,
        timeout=20,
        data=encrypted,
        headers=headers,
    )


def decode_key(value):
    return b64decode_unpadded(value.encode())


def parse_subscription_info(subscription_info):
    endpoint = subscription_info["endpoint"]
    auth_key = decode_key(subscription_info["keys"]["auth"])
    receiver_key = decode_key(subscription_info["keys"]["p256dh"])
    return endpoint, auth_key, receiver_key
