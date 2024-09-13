import pytest

from couchers import crypto
from tests.test_fixtures import testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_b64():
    assert crypto.b64decode(crypto.b64encode(b"hello there")) == b"hello there"


def test_simple_crypto():
    assert crypto.simple_decrypt("test_simple", crypto.simple_encrypt("test_simple", b"hello there")) == b"hello there"


def test_hash_sigs():
    sig = crypto.generate_hash_signature(b"this is the message", crypto.get_secret("test_hash"))
    crypto.verify_hash_signature(b"this is the message", crypto.get_secret("test_hash"), sig)


def test_asym_crypto():
    skey, pkey = crypto.generate_asym_keypair()
    encrypted = crypto.asym_encrypt(pkey, b"a very secret message")
    assert crypto.asym_decrypt(skey, encrypted) == b"a very secret message"
