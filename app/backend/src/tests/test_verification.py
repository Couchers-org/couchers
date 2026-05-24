from unittest.mock import Mock, patch

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select, update

import couchers.phone.sms
from couchers.config import config
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.models import SMS, User
from couchers.proto import account_pb2, api_pb2
from couchers.utils import now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import PushCollector, process_jobs
from tests.fixtures.sessions import account_session, api_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_ChangePhone(db, monkeypatch, push_collector: PushCollector):
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

        assert push_collector.count_for_user(user_id) == 0

        monkeypatch.setattr(couchers.phone.sms, "send_sms", succeed)

        account.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == user_id)).scalar_one()
            assert user.phone == "+46701740605"
            assert user.phone_verification_token
            assert len(user.phone_verification_token) == 6

        process_jobs()
        push = push_collector.pop_for_user(user_id, last=True)
        assert push.content.title == "Phone verification started"
        assert push.content.body == "You started phone number verification with the number +46 70 174 06 05."

        # Phone number should show up but not be verified in your profile settings
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"
        assert not res.phone_verified

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
            assert user.phone_verification_token
            assert len(user.phone_verification_token) == 6


def test_VerifyPhone(push_collector: PushCollector):
    user, token = generate_user()
    with account_session(token) as account, api_session(token) as api:
        with pytest.raises(grpc.RpcError) as e:
            account.VerifyPhone(account_pb2.VerifyPhoneReq(token="123455"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION

        res = api.GetUser(api_pb2.GetUserReq(user=str(user.id)))
        assert res.verification == 0.0

        with session_scope() as session:
            session.execute(
                update(User)
                .where(User.id == user.id)
                .values(phone_verification_token="111112", phone_verification_sent=now(), phone="+46701740605")
            )

        account.VerifyPhone(account_pb2.VerifyPhoneReq(token="111112"))

        process_jobs()
        push = push_collector.pop_for_user(user.id, last=True)
        assert push.content.title == "Phone verification completed"
        assert push.content.body == "Your phone number was successfully verified as +46 70 174 06 05."

        res = api.GetUser(api_pb2.GetUserReq(user=str(user.id)))
        assert res.verification == 1.0

        # Phone number should finally show up on in your profile settings
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"


def test_VerifyPhone_antibrute():
    user, token = generate_user(
        phone_verification_token="111112",
        phone_verification_sent=now(),
        phone="+46701740605",
    )

    with account_session(token) as account:
        for _ in range(10):
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
            token = session.execute(select(User.phone_verification_token).where(User.id == user1.id)).scalar_one()
        account1.VerifyPhone(account_pb2.VerifyPhoneReq(token=token))
        res = account1.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"
        assert res.phone_verified

        # Let user2 steal user1:s phone number

        account2.ChangePhone(account_pb2.ChangePhoneReq(phone="+46701740605"))

        res = account1.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"
        assert res.phone_verified

        res = account2.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"
        assert not res.phone_verified

        with session_scope() as session:
            token = session.execute(select(User.phone_verification_token).where(User.id == user2.id)).scalar_one()
        account2.VerifyPhone(account_pb2.VerifyPhoneReq(token=token))

        # number gets wiped when it's stolen
        res = account1.GetAccountInfo(empty_pb2.Empty())
        assert not res.phone
        assert not res.phone_verified

        res = account2.GetAccountInfo(empty_pb2.Empty())
        assert res.phone == "+46701740605"
        assert res.phone_verified


def test_send_sms(db, monkeypatch):
    new_config = config.copy()
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


def test_send_sms_disabled(db, feature_flags):
    feature_flags.set("sms_enabled", False)
    assert couchers.phone.sms.send_sms("+46701740605", "Testing SMS message") == "SMS not enabled."


def test_sms_verification_no_donation():
    user, token = generate_user(last_donated=None)
    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.ChangePhone(account_pb2.ChangePhoneReq(phone="+467017406066"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "Please complete donation to get phone verified."
