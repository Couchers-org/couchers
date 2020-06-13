from base64 import urlsafe_b64encode

import nacl.pwhash
from nacl.exceptions import InvalidkeyError
from nacl.utils import random as random_bytes


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
