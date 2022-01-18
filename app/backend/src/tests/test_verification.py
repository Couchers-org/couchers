from unittest.mock import Mock, patch

import grpc
import pytest
from google.protobuf import empty_pb2

import couchers.phone.sms
from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import SMS, User
from couchers.sql import couchers_select as select
from couchers.utils import now
from proto import account_pb2, api_pb2
from tests.test_fixtures import account_session, api_session, db, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ChangePhone(db, monkeypatch):
    user, token = generate_user()
    user_id = user.id

    with account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == ""

        monkeypatch.setattr(couchers.phone.sms, "send_sms", pytest.fail)

        # Try with a too long number
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePhone(account_pb2.ChangePhoneReq(phone="+4670174060666666"))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT

        # try to see if one digit too much is caught before attempting to send sms
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePhone(account_pb2.ChangePhoneReq(phone="+467017406066"))
        assert e.value.code() == grpc.StatusCode.UNIMPLEMENTED

        # Test with operator not supported by SMS backend
        def deny_operator(phone, message):
            assert phone == "+46701740605"
            return "unsupported operator"

        monkeypatch.setattr(couchers.phone.sms, "send_sms", deny_operator)

        with pytest.raises(grpc.RpcError) as e:
            account.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))
        assert e.value.code() == grpc.StatusCode.UNIMPLEMENTED

        # Test with successfully sent SMS
        def succeed(phone, message):
            assert phone == "+46701740605"
            return "success"

        monkeypatch.setattr(couchers.phone.sms, "send_sms", succeed)

        account.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            assert user.phone == "+46701740605"
            assert len(user.phone_verification_token) == 6

        # Phone number should still not show up on in your profile settings
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == ""

        # Remove phone number
        account.ChangePhone(account_pb2.ChangePhoneReq(phone=""))

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            assert user.phone is None
            assert user.phone_verification_token is None


def test_ChangePhone_ratelimit(db, monkeypatch):
    user, token = generate_user()
    user_id = user.id
    with account_session(token) as account:

        def succeed(phone, message):
            return "success"

        monkeypatch.setattr(couchers.phone.sms, "send_sms", succeed)

        account.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))

        with pytest.raises(grpc.RpcError) as e:
            account.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740606"))
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED

        # Check that an earlier phone number/verification status is still saved
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            assert user.phone == "+46701740605"
            assert len(user.phone_verification_token) == 6


def test_VerifyPhone():
    user, token = generate_user()
    user_id = user.id
    with account_session(token) as account, api_session(token) as api:

        with pytest.raises(grpc.RpcError) as e:
            account.VerifyPhone(account_pb2.VerifyPhoneReq(token="123455"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        res = api.GetUser(api_pb2.GetUserReq(user=str(user_id)))
        assert res.verification == 0.0

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            user.phone = "+46701740605"
            user.phone_verification_token = "111112"
            user.phone_verification_sent = now()

        account.VerifyPhone(account_pb2.VerifyPhoneReq(token="111112"))

        res = api.GetUser(api_pb2.GetUserReq(user=str(user_id)))
        assert res.verification == 1.0

        # Phone number should finally show up on in your profile settings
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"


def test_VerifyPhone_antibrute():
    user, token = generate_user()
    user_id = user.id
    with account_session(token) as account, api_session(token) as api:

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            user.phone_verification_token = "111112"
            user.phone_verification_sent = now()
            user.phone = "+46701740605"

        for i in range(10):
            with pytest.raises(grpc.RpcError) as e:
                account.VerifyPhone(account_pb2.VerifyPhoneReq(token="123455"))
            if e.value.code() != grpc.StatusCode.NOT_FOUND:
                break
        assert e.value.code() == grpc.StatusCode.RESOURCE_EXHAUSTED


def test_phone_uniqueness(monkeypatch):
    user1, token1 = generate_user()
    user2, token2 = generate_user()
    with account_session(token1) as account1, account_session(token2) as account2:

        def succeed(phone, message):
            return "success"

        monkeypatch.setattr(couchers.phone.sms, "send_sms", succeed)

        account1.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user1.id)).scalar_one()
            token = user.phone_verification_token
        account1.VerifyPhone(account_pb2.VerifyPhoneReq(token=token))
        assert account1.GetAccountInfo(empty_pb2.Empty()).phone == "+46701740605"

        # Let user2 steal user1:s phone number

        account2.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))

        assert account1.GetAccountInfo(empty_pb2.Empty()).phone == "+46701740605"
        assert account2.GetAccountInfo(empty_pb2.Empty()).phone == ""

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user2.id)).scalar_one()
            token = user.phone_verification_token
        account2.VerifyPhone(account_pb2.VerifyPhoneReq(token=token))

        assert account1.GetAccountInfo(empty_pb2.Empty()).phone == ""
        assert account2.GetAccountInfo(empty_pb2.Empty()).phone == "+46701740605"


def test_send_sms(db, monkeypatch):
    new_config = config.copy()
    new_config["ENABLE_SMS"] = True
    new_config["SMS_SENDER_ID"] = "CouchersOrg"
    monkeypatch.setattr(couchers.phone.sms, "config", new_config)

    msg_id = random_hex()

    with patch("couchers.phone.sms.boto3") as mock:
        sns = Mock()
        sns.publish.return_value = {"MessageId": msg_id}
        mock.client.return_value = sns

        assert couchers.phone.sms.send_sms("+46701740605", "Testing SMS message") == "success"

        mock.client.assert_called_once_with("sns")
        sns.publish.assert_called_once_with(
            PhoneNumber="+46701740605",
            Message="Testing SMS message",
            MessageAttributes={
                "AWS.SNS.SMS.SMSType": {"DataType": "String", "StringValue": "Transactional"},
                "AWS.SNS.SMS.SenderID": {"DataType": "String", "StringValue": "CouchersOrg"},
            },
        )

    with session_scope() as session:
        sms = session.execute(select(SMS)).scalar_one()
        assert sms.message_id == msg_id
        assert sms.sms_sender_id == "CouchersOrg"
        assert sms.number == "+46701740605"
        assert sms.message == "Testing SMS message"


def test_send_sms_disabled(db):
    assert not config["ENABLE_SMS"]
    assert couchers.phone.sms.send_sms("+46701740605", "Testing SMS message") == "SMS not enabled."
