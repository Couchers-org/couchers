from sqlalchemy import select

from couchers.crypto import hash_password, random_hex
from couchers.db import session_scope
from couchers.models import User, UserEmailHistory
from couchers.proto import account_pb2, auth_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import account_session, auth_api_session
from tests.test_auth import _quick_signup


def get_history(user_id: int) -> list[str]:
    with session_scope() as session:
        return list(
            session.execute(
                select(UserEmailHistory.email).where(UserEmailHistory.user_id == user_id).order_by(UserEmailHistory.id)
            ).scalars()
        )


def change_email(token: str, password: str, new_email: str) -> None:
    with account_session(token) as account:
        account.ChangeEmailV2(account_pb2.ChangeEmailV2Req(password=password, new_email=new_email))

    with session_scope() as session:
        change_email_token = session.execute(
            select(User.new_email_token).where(User.new_email == new_email)
        ).scalar_one()

    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.ConfirmChangeEmailV2(auth_pb2.ConfirmChangeEmailV2Req(change_email_token=change_email_token))


def test_email_history_recorded_on_signup(db, fast_passwords):
    user_id = _quick_signup()

    assert get_history(user_id) == ["email@couchers.org.invalid"]


def test_email_history_recorded_on_confirmed_email_change(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))
    first_email = f"{random_hex()}@couchers.org.invalid"
    second_email = f"{random_hex()}@couchers.org.invalid"

    change_email(token, password, first_email)
    change_email(token, password, second_email)

    assert get_history(user.id) == [first_email, second_email]


def test_email_history_not_recorded_on_unconfirmed_email_change(db, fast_passwords):
    password = random_hex()
    user, token = generate_user(hashed_password=hash_password(password))

    with account_session(token) as account:
        account.ChangeEmailV2(
            account_pb2.ChangeEmailV2Req(password=password, new_email=f"{random_hex()}@couchers.org.invalid")
        )

    assert get_history(user.id) == []
