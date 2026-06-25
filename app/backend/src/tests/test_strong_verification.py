import json
from datetime import date, timedelta
from unittest.mock import ANY, patch
from urllib.parse import urlencode

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import select, update
from sqlalchemy.sql import or_

import couchers.jobs.handlers
import couchers.servicers.account
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
from couchers.proto import account_pb2, admin_pb2, api_pb2
from couchers.proto.google.api import httpbody_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.misc import PushCollector
from tests.fixtures.sessions import account_session, api_session, real_admin_session, real_iris_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


class MockSVFlow:
    """Simulates the strong verification flow, including all IRIS callbacks."""

    def __init__(self, user: User, token: str, verification_id: int = 5731012934821983) -> None:
        self.user = user
        self.token = token
        self.verification_id = verification_id

        iris_token_data = {
            "merchant_id": 5731012934821982,
            "session_id": self.verification_id,
            "seed": 1674246339,
            "face_verification": False,
            "host": "https://passportreader.app",
        }
        self.iris_token = b64encode_unpadded(json.dumps(iris_token_data).encode("utf8"))

        with account_session(self.token) as account:
            # start by initiation
            with patch("couchers.servicers.account.requests.post") as mock:
                json_resp1 = {
                    "id": self.verification_id,
                    "token": self.iris_token,
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
                    "passport_only": True,
                    "reference": ANY,
                },
                timeout=10,
                verify="/etc/ssl/certs/ca-certificates.crt",
            )
            self.reference_data = mock.call_args.kwargs["json"]["reference"]
            self.verification_attempt_token = res.verification_attempt_token
            return_url = f"http://localhost:3000/complete-strong-verification?verification_attempt_token={self.verification_attempt_token}"
            assert res.redirect_url == "https://passportreader.app/open?" + urlencode(
                {"token": self.iris_token, "redirect_url": return_url}
            )

            assert (
                account.GetStrongVerificationAttemptStatus(
                    account_pb2.GetStrongVerificationAttemptStatusReq(
                        verification_attempt_token=self.verification_attempt_token
                    )
                ).status
                == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_TO_OPEN_APP
            )

    def process_iris_callbacks(
        self,
        *,
        nationality: str = "US",
        sex: PassportSex | None = None,
        date_of_birth: date | None = None,
        document_type: str = "PASSPORT",
        document_number: str = "31195855",
        document_expiry: date | None = None,
        expected_status: StrongVerificationAttemptStatus = StrongVerificationAttemptStatus.succeeded,
    ) -> None:
        self.process_iris_initiated_callback()
        self.process_iris_completed_callback()
        self.process_iris_approved_callback(
            nationality=nationality,
            sex=sex,
            date_of_birth=date_of_birth,
            document_type=document_type,
            document_number=document_number,
            document_expiry=document_expiry,
            expected_status=expected_status,
        )

    def process_iris_initiated_callback(self) -> None:
        # ok, now the user downloads the app, scans their id, and Iris ID sends callbacks to the server
        self._emulate_iris_callback("INITIATED")

        with account_session(self.token) as account:
            assert (
                account.GetStrongVerificationAttemptStatus(
                    account_pb2.GetStrongVerificationAttemptStatusReq(
                        verification_attempt_token=self.verification_attempt_token
                    )
                ).status
                == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_USER_IN_APP
            )

    def process_iris_completed_callback(self) -> None:
        self._emulate_iris_callback("COMPLETED")

        with account_session(self.token) as account:
            assert (
                account.GetStrongVerificationAttemptStatus(
                    account_pb2.GetStrongVerificationAttemptStatusReq(
                        verification_attempt_token=self.verification_attempt_token
                    )
                ).status
                == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND
            )

    def process_iris_approved_callback(
        self,
        *,
        nationality: str = "US",
        sex: PassportSex | None = None,
        date_of_birth: date | None = None,
        document_type: str = "PASSPORT",
        document_number: str = "31195855",
        document_expiry: date | None = None,
        expected_status: StrongVerificationAttemptStatus = StrongVerificationAttemptStatus.succeeded,
    ) -> None:
        if sex is None:
            match self.user.gender:
                case "Man":
                    sex = PassportSex.male
                case "Woman":
                    sex = PassportSex.female
                case _:
                    sex = PassportSex.unspecified
        if date_of_birth is None:
            date_of_birth = self.user.birthdate
        if document_expiry is None:
            document_expiry = date.today() + timedelta(days=5 * 365)

        self._emulate_iris_callback("APPROVED")

        with account_session(self.token) as account:
            assert (
                account.GetStrongVerificationAttemptStatus(
                    account_pb2.GetStrongVerificationAttemptStatusReq(
                        verification_attempt_token=self.verification_attempt_token
                    )
                ).status
                == account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_IN_PROGRESS_WAITING_ON_BACKEND
            )

        with patch("couchers.jobs.handlers.requests.post") as mock:
            json_resp = {
                "id": self.verification_id,
                "created": "2024-05-11T15:46:46Z",
                "expires": "2024-05-11T16:17:26Z",
                "state": "APPROVED",
                "reference": self.reference_data,
                "user_ip": "10.123.123.123",
                "user_agent": "Iris%20ID/168357896 CFNetwork/1494.0.7 Darwin/23.4.0",
                "given_names": "John Wayne",
                "surname": "Doe",
                "nationality": nationality,
                "sex": sex.name.upper(),
                "date_of_birth": date_of_birth.isoformat(),
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
                    "text": json.dumps(json_resp),
                    "json": lambda: json_resp,
                },
            )
            while process_job():
                pass

        mock.assert_called_once_with(
            "https://passportreader.app/api/v1/session.get",
            auth=("dummy_pubkey", "dummy_secret"),
            json={"id": self.verification_id},
            timeout=10,
            verify="/etc/ssl/certs/ca-certificates.crt",
        )

        # The API should now report success or failure
        with account_session(self.token) as account:
            expected_pb_status = (
                account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_SUCCEEDED
                if expected_status == StrongVerificationAttemptStatus.succeeded
                else account_pb2.STRONG_VERIFICATION_ATTEMPT_STATUS_FAILED
            )
            assert (
                account.GetStrongVerificationAttemptStatus(
                    account_pb2.GetStrongVerificationAttemptStatusReq(
                        verification_attempt_token=self.verification_attempt_token
                    )
                ).status
                == expected_pb_status
            )

        # The StrongVerificationAttempt row should now reflect data from the IRIS callback
        with session_scope() as session:
            verification_attempt = session.execute(
                select(StrongVerificationAttempt).where(
                    StrongVerificationAttempt.verification_attempt_token == self.verification_attempt_token
                )
            ).scalar_one()

            assert verification_attempt.user_id == self.user.id
            assert verification_attempt.status == expected_status
            assert verification_attempt.has_full_data
            assert verification_attempt.passport_encrypted_data
            assert verification_attempt.passport_date_of_birth == date_of_birth
            assert verification_attempt.passport_sex == sex
            assert verification_attempt.has_minimal_data
            assert verification_attempt.passport_expiry_date == document_expiry
            assert verification_attempt.passport_nationality == nationality
            assert verification_attempt.passport_last_three_document_chars == document_number[-3:]
            assert verification_attempt.iris_token == self.iris_token
            assert verification_attempt.iris_session_id == self.verification_id

            # We should have gone through all IRIS callbacks
            private_key = bytes.fromhex("e6c2fbf3756b387bc09a458a7b85935718ef3eb1c2777ef41d335c9f6c0ab272")
            decrypted_data = json.loads(asym_decrypt(private_key, verification_attempt.passport_encrypted_data))
            assert decrypted_data == json_resp

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

    def _emulate_iris_callback(self, session_state: str):
        assert session_state in ["CREATED", "INITIATED", "FAILED", "ABORTED", "COMPLETED", "REJECTED", "APPROVED"]
        with real_iris_session() as iris:
            data = json.dumps(
                {
                    "session_id": self.verification_id,
                    "session_state": session_state,
                    "session_reference": self.reference_data,
                }
            ).encode("ascii")
            iris.Webhook(httpbody_pb2.HttpBody(content_type="application/json", data=data))


def monkeypatch_sv_config(monkeypatch):
    new_config = config.copy()
    new_config.IRIS_ID_PUBKEY = "dummy_pubkey"
    new_config.IRIS_ID_SECRET = "dummy_secret"
    new_config.VERIFICATION_DATA_PUBLIC_KEY = bytes.fromhex(
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
    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    expiry = date.today() + timedelta(days=5 * 365)

    MockSVFlow(user=user, token=token).process_iris_callbacks(
        nationality="US",
        sex=PassportSex.male,
        date_of_birth=date.fromisoformat("1988-01-01"),
        document_number="31195855",
        document_expiry=expiry,
    )

    with session_scope() as session:
        verification_attempt = session.execute(
            select(StrongVerificationAttempt).where(StrongVerificationAttempt.user_id == user.id)
        ).scalar_one()
        assert verification_attempt.status == StrongVerificationAttemptStatus.succeeded
        assert verification_attempt.passport_date_of_birth == date(1988, 1, 1)
        assert verification_attempt.passport_sex == PassportSex.male
        assert verification_attempt.passport_expiry_date == expiry
        assert verification_attempt.passport_nationality == "US"
        assert verification_attempt.passport_last_three_document_chars == "855"

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(empty_pb2.Empty())

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
        session.execute(update(User).where(User.id == user.id).values(birthdate=date(1988, 1, 2)))

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(empty_pb2.Empty())

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
        session.execute(update(User).where(User.id == user.id).values(birthdate=date(1988, 1, 1), gender="Woman"))

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(empty_pb2.Empty())

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
        session.execute(update(User).where(User.id == user.id).values(gender="Man"))

    update_badges(empty_pb2.Empty())
    refresh_materialized_views_rapid(empty_pb2.Empty())

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
    refresh_materialized_views_rapid(empty_pb2.Empty())

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
    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    # can remove SV data even if there is none, should do nothing
    with account_session(token) as account:
        account.DeleteStrongVerificationData(empty_pb2.Empty())

    MockSVFlow(user=user, token=token).process_iris_callbacks()

    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    MockSVFlow(user=user, token=token).process_iris_callbacks(document_expiry=date.today() + timedelta(days=10))

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

    MockSVFlow(user=user, token=token, verification_id=5731012934821985).process_iris_callbacks(
        nationality="AU", document_number="PA41323412", document_expiry=date.today() + timedelta(days=365)
    )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
    assert (
        api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
        == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
    )


def test_strong_verification_regression(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    sv_flow = MockSVFlow(user=user, token=token)
    sv_flow.process_iris_initiated_callback()

    with api_session(token) as api:
        api.Ping(api_pb2.PingReq())


def test_strong_verification_regression2(db, monkeypatch):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    sv_flow = MockSVFlow(user=user, token=token, verification_id=5731012934821983)
    sv_flow.process_iris_initiated_callback()

    sv_flow = MockSVFlow(user=user, token=token, verification_id=5731012934821985)
    sv_flow.process_iris_callbacks(nationality="AU", document_number="PA41323412")

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )


def test_strong_verification_disabled(db, feature_flags):
    feature_flags.set("strong_verification_enabled", False)
    user, token = generate_user()

    with account_session(token) as account:
        with pytest.raises(grpc.RpcError) as e:
            account.InitiateStrongVerification(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.UNAVAILABLE
        assert e.value.details() == "Strong verification is currently disabled."


def test_strong_verification_delete_data_cant_reverify(db, monkeypatch, push_collector: PushCollector):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    MockSVFlow(user=user, token=token).process_iris_callbacks()

    refresh_materialized_views_rapid(empty_pb2.Empty())

    # the user should now have strong verification
    with api_session(token) as api:
        assert api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    # There should be a notification confirming it
    push_collector.pop_for_user(user.id, last=True)

    # check removing SV data
    with account_session(token) as account:
        account.DeleteStrongVerificationData(empty_pb2.Empty())

    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    MockSVFlow(user=user, token=token, verification_id=5731012934821984).process_iris_callbacks(
        expected_status=StrongVerificationAttemptStatus.duplicate
    )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Strong Verification failed"
    assert (
        push.content.body
        == "You used a passport that has already been used for verification. Please use another passport."
    )

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )


def test_strong_verification_duplicate_other_user(db, monkeypatch, push_collector: PushCollector):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    user2, token2 = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    refresh_materialized_views_rapid(empty_pb2.Empty())

    with api_session(token) as api:
        assert not api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        assert (
            api.GetLiteUser(api_pb2.GetLiteUserReq(user=user.username)).has_strong_verification
            == api.GetUser(api_pb2.GetUserReq(user=user.username)).has_strong_verification
        )

    # can remove SV data even if there is none, should do nothing
    with account_session(token) as account:
        account.DeleteStrongVerificationData(empty_pb2.Empty())

    MockSVFlow(user=user, token=token).process_iris_callbacks(nationality="US", document_number="31195855")

    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    refresh_materialized_views_rapid(empty_pb2.Empty())

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

    MockSVFlow(user=user2, token=token2, verification_id=5731012934821984).process_iris_callbacks(
        nationality="US", document_number="31195855", expected_status=StrongVerificationAttemptStatus.duplicate
    )

    push = push_collector.pop_for_user(user2.id, last=True)
    assert push.content.title == "Strong Verification failed"
    assert (
        push.content.body
        == "You used a passport that has already been used for verification. Please use another passport."
    )


def test_strong_verification_non_passport(db, monkeypatch, push_collector: PushCollector):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")
    _, superuser_token = generate_user(is_superuser=True)

    MockSVFlow(user=user, token=token).process_iris_callbacks(
        document_type="IDENTITY_CARD"
    )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Strong Verification failed"
    assert (
        push.content.body
        == "You used a document other than a passport. You can only use a passport for Strong Verification."
    )


def test_strong_verification_wrong_birthdate(db, monkeypatch, push_collector: PushCollector):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    MockSVFlow(user=user, token=token).process_iris_callbacks(
        date_of_birth=date.fromisoformat("1999-12-31")
    )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Strong Verification failed"
    assert push.content.body == (
        "The date of birth on your profile does not match the date of birth on your passport. "
        "Please contact the support team to update your date of birth."
    )


def test_strong_verification_wrong_gender(db, monkeypatch, push_collector: PushCollector):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    MockSVFlow(user=user, token=token).process_iris_callbacks(
        sex=PassportSex.female
    )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Strong Verification failed"
    assert push.content.body == (
        "The gender on your profile does not match the sex on your passport. "
        "Please contact the support team to update your gender, or if your passport sex does not "
        "match your gender identity."
    )


def test_strong_verification_wrong_birthdate_and_gender(db, monkeypatch, push_collector: PushCollector):
    monkeypatch_sv_config(monkeypatch)

    user, token = generate_user(birthdate=date(1988, 1, 1), gender="Man")

    MockSVFlow(user=user, token=token).process_iris_callbacks(
        date_of_birth=date.fromisoformat("1999-12-31"),
        sex=PassportSex.female,
    )

    push = push_collector.pop_for_user(user.id, last=True)
    assert push.content.title == "Strong Verification failed"
    assert push.content.body == (
        "The date of birth or gender on your profile does not match the date of birth or sex on your "
        "passport. Please contact the support team to update your date of birth or gender, or if your "
        "passport sex does not match your gender identity."
    )
