from base64 import b64decode, b64encode, urlsafe_b64encode
from hmac import HMAC, compare_digest

import nacl.pwhash
from nacl.exceptions import InvalidkeyError
from nacl.utils import random as random_bytes


def base64encode(msg):
    """
    Base 64 encode strings to strings
    """
    return b64encode(msg.encode("utf8")).decode("utf8")

def base64decode(msg):
    """
    Base 64 decode strings to strings
    """
    return b64decode(msg).decode("utf8")

def sso_check_hmac(msg, key, digest):
    """
    Checks that the given Discourse SSO HMAC (HMAS-SHA256) matches the message
    """
    mac = HMAC(key.encode("utf8"), msg.encode("utf8"), "sha256").hexdigest()
    return compare_digest(mac, digest)

def sso_create_hmac(msg, key):
    """
    "Signs" a message with a SHA256 hmac.
    """
    return HMAC(key.encode("utf8"), msg.encode("utf8"), "sha256").hexdigest()

def urlsafe_random_bytes(length=32):
    return urlsafe_b64encode(random_bytes(length)).decode("utf8")

def urlsafe_secure_token():
    """
    A cryptographically secure random token that can be put in a URL
    """
    return urlsafe_random_bytes(32)

def hash_password(password: str):
    return nacl.pwhash.str(password.encode("utf-8"))

def verify_password(hashed: bytes, password: str):
    try:
        correct = nacl.pwhash.verify(hashed, password.encode("utf-8"))
        return correct
    except InvalidkeyError:
        return False
