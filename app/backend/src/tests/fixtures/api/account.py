from contextlib import contextmanager
from typing import cast

import grpc
from google.protobuf import empty_pb2, timestamp_pb2, wrappers_pb2

from couchers.proto import account_pb2, account_pb2_grpc, auth_pb2
from couchers.servicers.account import Account
from tests.fixtures.sessions import FakeChannel


def _string_value(value: str | None) -> wrappers_pb2.StringValue | None:
    return wrappers_pb2.StringValue(value=value) if value is not None else None


def _bool_value(value: bool | None) -> wrappers_pb2.BoolValue | None:
    return wrappers_pb2.BoolValue(value=value) if value is not None else None


@contextmanager
def _account_session(token: str):
    channel = FakeChannel(token)
    account_pb2_grpc.add_AccountServicer_to_server(Account(), cast(grpc.Server, channel))
    yield account_pb2_grpc.AccountStub(cast(grpc.Channel, channel))


def get_account_info(*, token: str) -> account_pb2.GetAccountInfoRes:
    with _account_session(token) as session:
        res: account_pb2.GetAccountInfoRes = session.GetAccountInfo(empty_pb2.Empty())
    return res


def change_password(*, token: str, old_password: str | None, new_password: str | None) -> None:
    with _account_session(token) as session:
        session.ChangePasswordV2(account_pb2.ChangePasswordV2Req(old_password=old_password, new_password=new_password))


def change_email(*, token: str, password: str, new_email: str) -> None:
    with _account_session(token) as session:
        session.ChangeEmailV2(account_pb2.ChangeEmailV2Req(password=password, new_email=new_email))


def get_contributor_form_info(*, token: str) -> account_pb2.GetContributorFormInfoRes:
    with _account_session(token) as session:
        res: account_pb2.GetContributorFormInfoRes = session.GetContributorFormInfo(empty_pb2.Empty())
    return res


def fill_contributor_form(*, token: str, contributor_form: auth_pb2.ContributorForm) -> None:
    with _account_session(token) as session:
        session.FillContributorForm(account_pb2.FillContributorFormReq(contributor_form=contributor_form))


def change_language_preference(*, token: str, ui_language_preference: str) -> None:
    with _account_session(token) as session:
        session.ChangeLanguagePreference(
            account_pb2.ChangeLanguagePreferenceReq(ui_language_preference=ui_language_preference)
        )


def change_phone(*, token: str, phone: str) -> None:
    with _account_session(token) as session:
        session.ChangePhone(account_pb2.ChangePhoneReq(phone=phone))


def verify_phone(*, token: str, code: str) -> None:
    # The request field is named "token", which would clash with the auth token parameter.
    with _account_session(token) as session:
        session.VerifyPhone(account_pb2.VerifyPhoneReq(token=code))


def initiate_strong_verification(*, token: str) -> account_pb2.InitiateStrongVerificationRes:
    with _account_session(token) as session:
        res: account_pb2.InitiateStrongVerificationRes = session.InitiateStrongVerification(empty_pb2.Empty())
    return res


def get_strong_verification_attempt_status(
    *, token: str, verification_attempt_token: str
) -> account_pb2.GetStrongVerificationAttemptStatusRes:
    with _account_session(token) as session:
        res: account_pb2.GetStrongVerificationAttemptStatusRes = session.GetStrongVerificationAttemptStatus(
            account_pb2.GetStrongVerificationAttemptStatusReq(verification_attempt_token=verification_attempt_token)
        )
    return res


def delete_strong_verification_data(*, token: str) -> None:
    with _account_session(token) as session:
        session.DeleteStrongVerificationData(empty_pb2.Empty())


def delete_account(*, token: str, confirm: bool = True, reason: str | None = None) -> None:
    with _account_session(token) as session:
        session.DeleteAccount(account_pb2.DeleteAccountReq(confirm=confirm, reason=reason))


def list_mod_notes(*, token: str) -> account_pb2.ListModNotesRes:
    with _account_session(token) as session:
        res: account_pb2.ListModNotesRes = session.ListModNotes(empty_pb2.Empty())
    return res


def list_active_sessions(
    *, token: str, page_size: int | None = None, page_token: str | None = None
) -> account_pb2.ListActiveSessionsRes:
    with _account_session(token) as session:
        res: account_pb2.ListActiveSessionsRes = session.ListActiveSessions(
            account_pb2.ListActiveSessionsReq(page_size=page_size, page_token=page_token)
        )
    return res


def log_out_session(*, token: str, created: timestamp_pb2.Timestamp) -> None:
    with _account_session(token) as session:
        session.LogOutSession(account_pb2.LogOutSessionReq(created=created))


def log_out_other_sessions(*, token: str, confirm: bool = True) -> None:
    with _account_session(token) as session:
        session.LogOutOtherSessions(account_pb2.LogOutOtherSessionsReq(confirm=confirm))


def set_profile_public_visibility(
    *, token: str, profile_public_visibility: account_pb2.ProfilePublicVisibility.ValueType
) -> None:
    with _account_session(token) as session:
        session.SetProfilePublicVisibility(
            account_pb2.SetProfilePublicVisibilityReq(profile_public_visibility=profile_public_visibility)
        )


def create_invite_code(*, token: str) -> account_pb2.CreateInviteCodeRes:
    with _account_session(token) as session:
        res: account_pb2.CreateInviteCodeRes = session.CreateInviteCode(account_pb2.CreateInviteCodeReq())
    return res


def disable_invite_code(*, token: str, code: str) -> None:
    with _account_session(token) as session:
        session.DisableInviteCode(account_pb2.DisableInviteCodeReq(code=code))


def list_invite_codes(*, token: str) -> account_pb2.ListInviteCodesRes:
    with _account_session(token) as session:
        res: account_pb2.ListInviteCodesRes = session.ListInviteCodes(empty_pb2.Empty())
    return res


def get_reminders(*, token: str) -> account_pb2.GetRemindersRes:
    with _account_session(token) as session:
        res: account_pb2.GetRemindersRes = session.GetReminders(empty_pb2.Empty())
    return res


def get_my_volunteer_info(*, token: str) -> account_pb2.GetMyVolunteerInfoRes:
    with _account_session(token) as session:
        res: account_pb2.GetMyVolunteerInfoRes = session.GetMyVolunteerInfo(empty_pb2.Empty())
    return res


def update_my_volunteer_info(
    *,
    token: str,
    # None leaves the field unchanged.
    display_name: str | None = None,
    display_location: str | None = None,
    show_on_team_page: bool | None = None,
    link_type: str | None = None,
    link_text: str | None = None,
    link_url: str | None = None,
) -> account_pb2.GetMyVolunteerInfoRes:
    with _account_session(token) as session:
        res: account_pb2.GetMyVolunteerInfoRes = session.UpdateMyVolunteerInfo(
            account_pb2.UpdateMyVolunteerInfoReq(
                display_name=_string_value(display_name),
                display_location=_string_value(display_location),
                show_on_team_page=_bool_value(show_on_team_page),
                link_type=_string_value(link_type),
                link_text=_string_value(link_text),
                link_url=_string_value(link_url),
            )
        )
    return res
