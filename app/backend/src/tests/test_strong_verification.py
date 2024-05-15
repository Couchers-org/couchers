import json
from datetime import date
from unittest.mock import ANY, patch

import grpc
import pytest
from google.protobuf import empty_pb2

import couchers.jobs.handlers
import couchers.servicers.account
from couchers import errors
from couchers.config import config
from couchers.crypto import asym_decrypt
from couchers.db import session_scope
from couchers.jobs.handlers import update_badges
from couchers.jobs.worker import process_job
from couchers.models import (
    PassportSex,
    StrongVerificationAttempt,
    StrongVerificationAttemptStatus,
    StrongVerificationCallbackEvent,
    User,
)
from couchers.sql import couchers_select as select
from proto import account_pb2, admin_pb2, api_pb2
from proto.google.api import httpbody_pb2
from tests.test_fixtures import (  # noqa
    account_session,
    api_session,
    db,
    generate_user,
    real_admin_session,
    real_iris_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def _emulate_iris_callback(session_id, session_state, reference):
    assert session_state in ["CREATED", "INITIATED", "FAILED", "ABORTED", "COMPLETED", "REJECTED", "APPROVED"]
    with real_iris_session() as iris:
        data = json.dumps(
            {"session_id": session_id, "session_state": session_state, "session_referenace": reference}
        ).encode("ascii")
        iris.Webhook(httpbody_pb2.HttpBody(content_type="application/json", data=data))


def test_strong_verification_happy_path(db, monkeypatch):
    new_config = config.copy()
    new_config["ENABLE_STRONG_VERIFICATION"] = True
    new_config["IRIS_ID_PUBKEY"] = "dummy_pubkey"
    new_config["IRIS_ID_SECRET"] = "dummy_secret"
    new_config["VERIFICATION_DATA_PUBLIC_KEY"] = bytes.fromhex(
        "dd740a2b2a35bf05041a28257ea439b30f76f056f3698000b71e6470cd82275f"
    )

    private_key = bytes.fromhex("e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272")

    monkeypatch.setattr(couchers.servicers.account, "config", new_config)
    monkeypatch.setattr(couchers.jobs.handlers, "config", new_config)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_UNVERIFIED

    with account_session(token) as account:
        # start by initiation
        with patch("couchers.servicers.account.requests.post") as mock:
            json_resp1 = {
                "id": 5731012934821983,
                "token": "eyJtZXJjaGFudF9pZCI6IDU3MzEwMTI5MzQ4MjE5ODIsICJzZXNzaW9uX2lkIjogNTczMTAxMjkzNDgyMTk4MywgInNlZWQiOiAxNjc0MjQ2MzM5LCAiZmFjZV92ZXJpZmljYXRpb24iOiBmYWxzZSwgImhvc3QiOiAiaHR0cHM6Ly9wYXNzcG9ydHJlYWRlci5hcHAifQ",
            }
            mock.return_value = type(
                "__MockResponse",
                (),
                {
                    "status_code": 200,
                    "text": json.dumps(json_resp1),
                    "json": lambda: json_resp1,
                },
            )
            res = account.InitiateStrongVerification(empty_pb2.Empty())
        mock.assert_called_once_with(
            "https://passportreader.app/api/v1/session.create",
            auth=("dummy_pubkey", "dummy_secret"),
            json={
                "callback_url": "http://localhost:8888/iris/webhook",
                "face_verification": False,
                "reference": ANY,
            },
            timeout=10,
        )
        reference_data = mock.call_args.kwargs["json"]["reference"]
        verification_attempt_token = res.verification_attempt_token
        assert (
            res.iris_url
            == "iris:///?token=eyJtZXJjaGFudF9pZCI6IDU3MzEwMTI5MzQ4MjE5ODIsICJzZXNzaW9uX2lkIjogNTczMTAxMjkzNDgyMTk4MywgInNlZWQiOiAxNjc0MjQ2MzM5LCAiZmFjZV92ZXJpZmljYXRpb24iOiBmYWxzZSwgImhvc3QiOiAiaHR0cHM6Ly9wYXNzcG9ydHJlYWRlci5hcHAifQ"
        )

        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER
        )

    # ok, now the user downloads the app, scans their id, and Iris ID sends callbacks to the server
    _emulate_iris_callback(5731012934821983, "INITIATED", reference_data)
    _emulate_iris_callback(5731012934821983, "COMPLETED", reference_data)

    with account_session(token) as account:
        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER
        )

    _emulate_iris_callback(5731012934821983, "APPROVED", reference_data)

    with account_session(token) as account:
        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND
        )

    with patch("couchers.jobs.handlers.requests.post") as mock:
        json_resp2 = {
            "id": 5731012934821983,
            "created": "2024-05-11T15:46:46Z",
            "expires": "2024-05-11T16:17:26Z",
            "state": "APPROVED",
            "reference": reference_data,
            "user_ip": "10.123.123.123",
            "user_agent": "Iris%20ID/168357896 CFNetwork/1494.0.7 Darwin/23.4.0",
            "given_names": "John Wayne",
            "surname": "Doe",
            "nationality": "US",
            "sex": "MALE",
            "date_of_birth": "1988-01-01",
            "document_type": "PASSPORT",
            "document_number": "31195855",
            "expiry_date": "2031-01-01",
            "issuing_country": "US",
            "issuer": "Department of State, U.S. Government",
            "portrait": "dGVzdHRlc3R0ZXN0...",
        }
        mock.return_value = type(
            "__MockResponse",
            (),
            {
                "status_code": 200,
                "text": json.dumps(json_resp2),
                "json": lambda: json_resp2,
            },
        )
        while process_job():
            pass

    mock.assert_called_once_with(
        "https://passportreader.app/api/v1/session.get",
        auth=("dummy_pubkey", "dummy_secret"),
        json={"id": 5731012934821983},
        timeout=10,
    )

    with account_session(token) as account:
        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_SUCCEEDED
        )

    with session_scope() as session:
        verification_attempt = session.execute(
            select(StrongVerificationAttempt).where(
                StrongVerificationAttempt.verification_attempt_token == verification_attempt_token
            )
        ).scalar_one()
        assert verification_attempt.user_id == user.id
        assert verification_attempt.status == StrongVerificationAttemptStatus.succeeded
        assert verification_attempt.has_full_data
        assert verification_attempt.passport_encrypted_data
        assert verification_attempt.passport_name == "John Wayne Doe"
        assert verification_attempt.passport_date_of_birth == date(1988, 1, 1)
        assert verification_attempt.passport_sex == PassportSex.male
        assert verification_attempt.has_minimal_data
        assert verification_attempt.passport_expiry_date == date(2031, 1, 1)
        assert verification_attempt.passport_nationality == "US"
        assert verification_attempt.passport_last_three_document_chars == "855"
        assert (
            verification_attempt.iris_token
            == "eyJtZXJjaGFudF9pZCI6IDU3MzEwMTI5MzQ4MjE5ODIsICJzZXNzaW9uX2lkIjogNTczMTAxMjkzNDgyMTk4MywgInNlZWQiOiAxNjc0MjQ2MzM5LCAiZmFjZV92ZXJpZmljYXRpb24iOiBmYWxzZSwgImhvc3QiOiAiaHR0cHM6Ly9wYXNzcG9ydHJlYWRlci5hcHAifQ"
        )
        assert verification_attempt.iris_session_id == 5731012934821983

        decrypted_data = json.loads(asym_decrypt(private_key, verification_attempt.passport_encrypted_data))
        assert decrypted_data == json_resp2

        callbacks = (
            session.execute(
                select(StrongVerificationCallbackEvent.iris_status)
                .where(StrongVerificationCallbackEvent.verification_attempt_id == verification_attempt.id)
                .order_by(StrongVerificationCallbackEvent.created.asc())
            )
            .scalars()
            .all()
        )
        assert callbacks == ["INITIATED", "COMPLETED", "APPROVED"]

    update_badges(empty_pb2.Empty())

    # the user should now have strong verification
    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

    # wrong dob = no badge
    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        user_.birthdate = date(1988, 1, 2)

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_MISMATCH
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

    # bad gender-sex correspondence = no badge
    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        user_.birthdate = date(1988, 1, 1)
        user_.gender = "Woman"

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH

    with account_session(token) as account:
        res = account.GetAccountInfo(empty_pb2.Empty())
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH

    # back to should have a badge
    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        user_.gender = "Man"

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

    # check has_passport_sex_gender_exception
    with real_admin_session(superuser_token) as admin:
        res = admin.GetUserDetails(admin_pb2.GetUserDetailsReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

        admin.SetPassportSexGenderException(
            admin_pb2.SetPassportSexGenderExceptionReq(user=user.username, passport_sex_gender_exception=True)
        )
        admin.ChangeUserGender(admin_pb2.ChangeUserGenderReq(user=user.username, gender="Woman"))

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

    with real_admin_session(superuser_token) as admin:
        res = admin.GetUserDetails(admin_pb2.GetUserDetailsReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

        # now turn exception off
        admin.SetPassportSexGenderException(
            admin_pb2.SetPassportSexGenderExceptionReq(user=user.username, passport_sex_gender_exception=False)
        )

    update_badges(empty_pb2.Empty())

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH

    with real_admin_session(superuser_token) as admin:
        res = admin.GetUserDetails(admin_pb2.GetUserDetailsReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH


def test_strong_verification_disabled(db):
    user, token = generate_user()

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.InitiateStrongVerification(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert e.value.details() == errors.STRONG_VERIFICATION_DISABLED
