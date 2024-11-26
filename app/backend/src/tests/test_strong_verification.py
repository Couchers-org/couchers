import json
from datetime import date, timedelta
from unittest.mock import ANY, patch

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy.sql import or_

import couchers.jobs.handlers
import couchers.servicers.account
from couchers import errors
from couchers.config import config
from couchers.crypto import asym_decrypt, b64encode_unpadded
from couchers.db import session_scope
from couchers.jobs.handlers import update_badges
from couchers.jobs.worker import process_job
from couchers.materialized_views import refresh_materialized_views_rapid
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


default_expiry = date.today() + timedelta(days=5 * 365)


def do_and_check_sv(
    user,
    token,
    verification_id,
    sex,
    dob,
    document_type,
    document_number,
    document_expiry,
    nationality,
    return_after=None,
):
    iris_token_data = {
        "merchant_id": 5731012934821982,
        "session_id": verification_id,
        "seed": 1674246339,
        "face_verification": False,
        "host": "https://passportreader.app",
    }
    iris_token = b64encode_unpadded(json.dumps(iris_token_data).encode("utf8"))

    with account_session(token) as account:
        # start by initiation
        with patch("couchers.servicers.account.requests.post") as mock:
            json_resp1 = {
                "id": verification_id,
                "token": iris_token,
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
        assert res.iris_url == f"iris:///?token={iris_token}"

        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_TO_OPEN_APP
        )

    # ok, now the user downloads the app, scans their id, and Iris ID sends callbacks to the server
    _emulate_iris_callback(verification_id, "INITIATED", reference_data)

    with account_session(token) as account:
        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_IN_APP
        )

    if return_after == "INITIATED":
        return

    _emulate_iris_callback(verification_id, "COMPLETED", reference_data)

    with account_session(token) as account:
        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND
        )

    if return_after == "COMPLETED":
        return

    _emulate_iris_callback(verification_id, "APPROVED", reference_data)

    with account_session(token) as account:
        assert (
            account.GetStrongVerificationAttemptStatus(
                account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
            ).status
            == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND
        )

    if return_after == "APPROVED":
        return

    with patch("couchers.jobs.handlers.requests.post") as mock:
        json_resp2 = {
            "id": verification_id,
            "created": "2024-05-11T15:46:46Z",
            "expires": "2024-05-11T16:17:26Z",
            "state": "APPROVED",
            "reference": reference_data,
            "user_ip": "10.123.123.123",
            "user_agent": "Iris%20ID/168357896 CFNetwork/1494.0.7 Darwin/23.4.0",
            "given_names": "John Wayne",
            "surname": "Doe",
            "nationality": nationality,
            "sex": sex,
            "date_of_birth": dob,
            "document_type": document_type,
            "document_number": document_number,
            "expiry_date": document_expiry.isoformat(),
            "issuing_country": nationality,
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
        json={"id": verification_id},
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
        # assert verification_attempt.passport_date_of_birth == date(1988, 1, 1)
        # assert verification_attempt.passport_sex == PassportSex.male
        assert verification_attempt.has_minimal_data
        assert verification_attempt.passport_expiry_date == document_expiry
        assert verification_attempt.passport_nationality == nationality
        assert verification_attempt.passport_last_three_document_chars == document_number[-3:]
        assert verification_attempt.iris_token == iris_token
        assert verification_attempt.iris_session_id == verification_id

        private_key = bytes.fromhex("e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272")
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


def monkeypatch_sv_config(monkeypatch):
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


def test_strong_verification_happy_path(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_UNVERIFIED
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821983,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="31195855",
        document_expiry=default_expiry,
        nationality="US",
    )

    with session_scope() as session:
        verification_attempt = session.execute(
            select(StrongVerificationAttempt).where(StrongVerificationAttempt.user_id == user.id)
        ).scalar_one()
        assert verification_attempt.status == StrongVerificationAttemptStatus.succeeded
        assert verification_attempt.passport_date_of_birth == date(1988, 1, 1)
        assert verification_attempt.passport_sex == PassportSex.male
        assert verification_attempt.passport_expiry_date == default_expiry
        assert verification_attempt.passport_nationality == "US"
        assert verification_attempt.passport_last_three_document_chars == "855"

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(None)

    # the user should now have strong verification
    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

    # wrong dob = no badge
    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        user_.birthdate = date(1988, 1, 2)

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_MISMATCH
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

    # bad gender-sex correspondence = no badge
    with session_scope() as session:
        user_ = session.execute(select(User).where(User.id == user.id)).scalar_one()
        user_.birthdate = date(1988, 1, 1)
        user_.gender = "Woman"

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

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
    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

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
    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" in res.badges
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

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
    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == res.has_strong_verification
        )

    with real_admin_session(superuser_token) as admin:
        res = admin.GetUserDetails(admin_pb2.GetUserDetailsReq(user=user.username))
        assert "strong_verification" not in res.badges
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_MISMATCH


def test_strong_verification_delete_data(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    # can remove SV data even if there is none, should do nothing
    with account_session(token) as account:
        account.DeleteStrongVerificationData(empty_pb2.Empty())

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821983,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="31195855",
        document_expiry=default_expiry,
        nationality="US",
    )

    refresh_materialized_views_rapid(None)

    # the user should now have strong verification
    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    # check removing SV data
    with account_session(token) as account:
        account.DeleteStrongVerificationData(empty_pb2.Empty())

    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    with session_scope() as session:
        assert (
            len(
                session.execute(
                    select(StrongVerificationAttempt).where(
                        or_(
                            StrongVerificationAttempt.passport_encrypted_data != None,
                            StrongVerificationAttempt.passport_date_of_birth != None,
                            StrongVerificationAttempt.passport_sex != None,
                        )
                    )
                )
                .scalars()
                .all()
            )
            == 0
        )


def test_strong_verification_expiry(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    expiry = date.today() + timedelta(days=10)

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821983,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="31195855",
        document_expiry=expiry,
        nationality="US",
    )

    # the user should now have strong verification
    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_VERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_VERIFIED

    with session_scope() as session:
        attempt = session.execute(select(StrongVerificationAttempt)).scalars().one()
        attempt.passport_expiry_date = date.today() - timedelta(days=2)

    with api_session(token) as api:
        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert not res.has_strong_verification
        assert res.birthdate_verification_status == api_pb2.BIRTHDATE_VERIFICATION_STATUS_UNVERIFIED
        assert res.gender_verification_status == api_pb2.GENDER_VERIFICATION_STATUS_UNVERIFIED

        res = api.GetUser(api_pb2.GetUserReq(user=user.username))
        assert not res.has_strong_verification
        assert not res.has_strong_verification

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821985,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="PA41323412",
        document_expiry=date.today() + timedelta(days=365),
        nationality="AU",
    )

    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
    assert (
        api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
        == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
    )


def test_strong_verification_regression(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821983,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="31195855",
        document_expiry=default_expiry,
        nationality="US",
        return_after="INITIATED",
    )

    with api_session(token) as api:
        api.Ping(api_pb2.PingReq())


def test_strong_verification_regression2(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821983,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="31195855",
        document_expiry=default_expiry,
        nationality="US",
        return_after="INITIATED",
    )

    do_and_check_sv(
        user,
        token,
        verification_id=5731012934821985,
        sex="MALE",
        dob="1988-01-01",
        document_type="PASSPORT",
        document_number="PA41323412",
        document_expiry=default_expiry,
        nationality="AU",
    )

    refresh_materialized_views_rapid(None)

    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )


def test_strong_verification_disabled(db):
    user, token = generate_user()

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.InitiateStrongVerification(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert e.value.details() == errors.STRONG_VERIFICATION_DISABLED
