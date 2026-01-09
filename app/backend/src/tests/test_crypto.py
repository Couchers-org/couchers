import nacl.utils
import pytest

from couchers import crypto


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


def test_stable_secure_uniform():
    # make sure it didn't change
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed0") == 0.17992286217826525
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed1") == 0.725282807072193
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed2") == 0.9063440288190295
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed3") == 0.6327659823819931
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed4") == 0.927720188949493
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed5") == 0.055950106064694194
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed6") == 0.5282629474672513
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed7") == 0.8330914059728719
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed8") == 0.8089643245604919
    assert crypto.stable_secure_uniform(key=b"stable", seed=b"seed9") == 0.4034213734044777

    # make sure it's rand unif
    for _ in range(1000):
        u = crypto.stable_secure_uniform(key=b"test", seed=nacl.utils.random(32))
        assert u > 0 and u < 1
        print(u)

    # make sure it's stable
    u1 = crypto.stable_secure_uniform(key=b"test", seed=b"seed1")
    u2 = crypto.stable_secure_uniform(key=b"test", seed=b"seed1")
    u3 = crypto.stable_secure_uniform(key=b"test", seed=b"seed1")
    assert u1 == u2 and u2 == u3

    # make sure it's diff
    u4 = crypto.stable_secure_uniform(key=b"test", seed=b"seed2")
    u5 = crypto.stable_secure_uniform(key=b"test", seed=b"seed3")
    assert u4 != u5

    u6 = crypto.stable_secure_uniform(key=b"test1", seed=b"seed")
    u7 = crypto.stable_secure_uniform(key=b"test2", seed=b"seed")
    assert u6 != u7
