import binascii

import nacl.utils
import pytest
from nacl.exceptions import CryptoError
from nacl.exceptions import TypeError as NaClTypeError

from couchers import crypto
from couchers.proto.internal import internal_pb2
from couchers.utils import Timestamp_from_datetime, now


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


def test_encrypt_decrypt_proto_roundtrip():
    original = internal_pb2.VerificationReferencePayload(
        verification_attempt_token="test-token-123",
        user_id=42,
    )
    encrypted = crypto.encrypt_proto("test_key", original)

    # Should be a non-empty base64 string
    assert encrypted
    assert isinstance(encrypted, str)

    # Should decrypt back to the same values
    decrypted = crypto.decrypt_proto("test_key", encrypted, internal_pb2.VerificationReferencePayload)
    assert decrypted.verification_attempt_token == original.verification_attempt_token
    assert decrypted.user_id == original.user_id


def test_encrypt_decrypt_proto_with_different_fields():
    original = internal_pb2.SofaPayload(
        created=Timestamp_from_datetime(now()),
    )
    encrypted = crypto.encrypt_proto("another_key", original)
    decrypted = crypto.decrypt_proto("another_key", encrypted, internal_pb2.SofaPayload)

    assert decrypted.created.seconds == original.created.seconds


def test_decrypt_proto_wrong_key():
    original = internal_pb2.VerificationReferencePayload(
        verification_attempt_token="test-token",
        user_id=1,
    )
    encrypted = crypto.encrypt_proto("correct_key", original)

    # Decrypting with wrong key should fail with CryptoError
    with pytest.raises(CryptoError):
        crypto.decrypt_proto("wrong_key", encrypted, internal_pb2.VerificationReferencePayload)


def test_decrypt_proto_invalid_data():
    # Invalid data should raise NaCl TypeError (nonce not long enough)
    with pytest.raises(NaClTypeError):
        crypto.decrypt_proto("any_key", "not-valid-base64!!!", internal_pb2.SofaPayload)


def test_decrypt_proto_invalid_encrypted_data():
    # Valid base64 but not valid encrypted data
    with pytest.raises(CryptoError):
        crypto.decrypt_proto("any_key", crypto.b64encode(b"invalid data"), internal_pb2.SofaPayload)


def test_encrypt_proto_different_keys_different_output():
    original = internal_pb2.VerificationReferencePayload(
        verification_attempt_token="test-token",
        user_id=1,
    )
    encrypted1 = crypto.encrypt_proto("key1", original)
    encrypted2 = crypto.encrypt_proto("key2", original)

    # Different keys should produce different encrypted values
    assert encrypted1 != encrypted2


def test_create_sofa_id():
    sofa_id = crypto.create_sofa_id()
    assert len(sofa_id) == 18
    assert isinstance(sofa_id, bytes)

    sofa_id2 = crypto.create_sofa_id()
    assert sofa_id != sofa_id2


def test_sofa_payload_roundtrip():
    sofa_id = crypto.create_sofa_id()
    original = internal_pb2.SofaPayload(created=Timestamp_from_datetime(now()))
    signed = crypto.encode_sofa(sofa_id, original)

    assert signed
    assert isinstance(signed, str)

    returned_sofa_id, verified = crypto.decode_sofa(signed)
    assert returned_sofa_id == sofa_id
    assert verified.created.seconds == original.created.seconds


def test_sofa_payload_invalid_data():
    with pytest.raises(binascii.Error):
        crypto.decode_sofa("invalid-base64")


def test_sofa_payload_too_short():
    with pytest.raises(ValueError, match="too short"):
        crypto.decode_sofa(crypto.b64encode(b"short"))


def test_sofa_payload_tampered_sofa_id():
    sofa_id = crypto.create_sofa_id()
    original = internal_pb2.SofaPayload(created=Timestamp_from_datetime(now()))
    signed = crypto.encode_sofa(sofa_id, original)

    data = crypto.b64decode(signed)
    tampered = bytes([data[0] ^ 0xFF]) + data[1:]
    tampered_b64 = crypto.b64encode(tampered)

    with pytest.raises(ValueError, match="Invalid signature"):
        crypto.decode_sofa(tampered_b64)


def test_sofa_payload_tampered_proto():
    sofa_id = crypto.create_sofa_id()
    original = internal_pb2.SofaPayload(created=Timestamp_from_datetime(now()))
    signed = crypto.encode_sofa(sofa_id, original)

    data = crypto.b64decode(signed)
    proto_start = 18
    proto_end = len(data) - 16
    if proto_end > proto_start:
        tampered = data[:proto_start] + bytes([data[proto_start] ^ 0xFF]) + data[proto_start + 1 :]
        tampered_b64 = crypto.b64encode(tampered)

        with pytest.raises(ValueError, match="Invalid signature"):
            crypto.decode_sofa(tampered_b64)


def test_sofa_payload_same_id_same_output():
    sofa_id = crypto.create_sofa_id()
    original = internal_pb2.SofaPayload(created=Timestamp_from_datetime(now()))
    signed1 = crypto.encode_sofa(sofa_id, original)
    signed2 = crypto.encode_sofa(sofa_id, original)

    assert signed1 == signed2


def test_sofa_payload_different_ids_different_output():
    original = internal_pb2.SofaPayload(created=Timestamp_from_datetime(now()))
    signed1 = crypto.encode_sofa(crypto.create_sofa_id(), original)
    signed2 = crypto.encode_sofa(crypto.create_sofa_id(), original)

    assert signed1 != signed2
