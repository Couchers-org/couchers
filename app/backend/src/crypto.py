import nacl.pwhash
from nacl.exceptions import InvalidkeyError
from nacl.utils import random as random_bytes


def hash_password(password: str):
    return nacl.pwhash.str(password.encode("utf-8"))

def verify_password(hashed: bytes, password: str):
    try:
        correct = nacl.pwhash.verify(hashed, password.encode("utf-8"))
        return correct
    except InvalidkeyError:
        return False
