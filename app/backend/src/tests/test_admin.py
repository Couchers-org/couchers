from datetime import date, datetime, timedelta

import grpc
import pytest
from sqlalchemy import select
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import (
    AccountDeletionToken,
    ContentReport,
    EventOccurrence,
    ModerationUserList,
    Reference,
    User,
    UserSession,
)
from couchers.proto import account_pb2, admin_pb2, auth_pb2, events_pb2, references_pb2, reporting_pb2
from couchers.utils import Timestamp_from_datetime, now, parse_date
from tests.fixtures.db import add_users_to_new_moderation_list, generate_user, make_friends
from tests.fixtures.misc import PushCollector, email_fields, mock_notification_email
from tests.fixtures.sessions import (
    account_session,
    auth_api_session,
    events_session,
    real_admin_session,
    references_session,
    reporting_session,
)
from tests.test_communities import create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_access_by_normal_user(db):
    normal_user, normal_token = generate_user()

    with real_admin_session(normal_token) as api:
        # all requests to the admin servicer should break when done by a non-super_user
        with pytest.raises(grpc.RpcError) as e:
            api.GetUserDetails(
                admin_pb2.GetUserDetailsReq(
                    user=str(normal_user.id),
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED


def test_GetUser(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        res = api.GetUser(admin_pb2.GetUserReq(user=str(normal_user.id)))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username

    with real_admin_session(super_token) as api:
        res = api.BanUser(admin_pb2.BanUserReq(user=normal_user.username, admin_note="Testing banning"))

    with real_admin_session(super_token) as api:
        res = api.GetUser(admin_pb2.GetUserReq(user=str(normal_user.id)))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username


def test_GetUserDetails(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=str(normal_user.id)))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted

    with real_admin_session(super_token) as api:
        res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted

    with real_admin_session(super_token) as api:
        res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.email))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted


def test_ChangeUserGender(db, push_collector: PushCollector):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        with mock_notification_email() as mock:
            res = api.ChangeUserGender(admin_pb2.ChangeUserGenderReq(user=normal_user.username, gender="Machine"))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == "Machine"
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted

    mock.assert_called_once()
    e = email_fields(mock)
    assert e.subject == "[TEST] Your gender was changed"
    assert e.recipient == normal_user.email
    assert "Machine" in e.plain
    assert "Machine" in e.html

    push = push_collector.pop_for_user(normal_user.id, last=True)
    assert push.content.title == "Gender changed"
    assert push.content.body == "An admin changed your gender to Machine."


def test_ChangeUserBirthdate(db, push_collector: PushCollector):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user(birthdate=date(year=2000, month=1, day=1))

    with real_admin_session(super_token) as api:
        res = api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username))
        assert parse_date(res.birthdate) == date(year=2000, month=1, day=1)

        with mock_notification_email() as mock:
            res = api.ChangeUserBirthdate(
                admin_pb2.ChangeUserBirthdateReq(user=normal_user.username, birthdate="1990-05-25")
            )

    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.birthdate == "1990-05-25"
    assert res.gender == normal_user.gender
    assert not res.banned
    assert not res.deleted

    mock.assert_called_once()
    e = email_fields(mock)
    assert e.subject == "[TEST] Your date of birth was changed"
    assert e.recipient == normal_user.email
    assert "1990" in e.plain
    assert "1990" in e.html

    push = push_collector.pop_for_user(normal_user.id, last=True)
    assert push.content.title == "Birthdate changed"
    assert push.content.body == "An admin changed your date of birth to May 25, 1990."


def test_BanUser(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    admin_note = "A good reason"

    with real_admin_session(super_token) as api:
        res = api.BanUser(admin_pb2.BanUserReq(user=normal_user.username, admin_note=admin_note))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert res.banned
    assert not res.deleted
    assert len(res.admin_actions) == 1
    assert res.admin_actions[0].action_type == "ban"
    assert res.admin_actions[0].level == admin_pb2.ADMIN_ACTION_LEVEL_HIGH
    assert res.admin_actions[0].note == admin_note
    assert res.admin_actions[0].admin_user_id == super_user.id
    assert res.admin_actions[0].admin_username == super_user.username


def test_UnbanUser(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    admin_note = "A good reason"

    with real_admin_session(super_token) as api:
        res = api.UnbanUser(admin_pb2.UnbanUserReq(user=normal_user.username, admin_note=admin_note))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted
    assert len(res.admin_actions) == 1
    assert res.admin_actions[0].action_type == "unban"
    assert res.admin_actions[0].level == admin_pb2.ADMIN_ACTION_LEVEL_HIGH


def test_AddAdminNote(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    admin_note1 = "User reported strange behavior"
    admin_note2 = "Insert private information here"

    with real_admin_session(super_token) as api:
        res = api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note=admin_note1))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted
    assert len(res.admin_actions) == 1
    assert res.admin_actions[0].action_type == "note"
    assert res.admin_actions[0].level == admin_pb2.ADMIN_ACTION_LEVEL_NORMAL
    assert res.admin_actions[0].note == admin_note1

    with real_admin_session(super_token) as api:
        res = api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note=admin_note2))
    assert len(res.admin_actions) == 2
    assert res.admin_actions[0].note == admin_note1
    assert res.admin_actions[1].note == admin_note2


def test_AddAdminNote_blank(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    empty_admin_note = "  \t  \n "

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note=empty_admin_note))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The admin note cannot be empty."


def test_admin_content_reports(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, token = generate_user()
    bad_user1, _ = generate_user()
    bad_user2, _ = generate_user()

    with reporting_session(token) as api:
        api.Report(
            reporting_pb2.ReportReq(
                reason="spam",
                description="r1",
                content_ref="comment/123",
                author_user=bad_user1.username,
                user_agent="n/a",
                page="https://couchers.org/comment/123",
            )
        )
        api.Report(
            reporting_pb2.ReportReq(
                reason="spam",
                description="r2",
                content_ref="comment/124",
                author_user=bad_user2.username,
                user_agent="n/a",
                page="https://couchers.org/comment/124",
            )
        )
        api.Report(
            reporting_pb2.ReportReq(
                reason="something else",
                description="r3",
                content_ref="page/321",
                author_user=bad_user1.username,
                user_agent="n/a",
                page="https://couchers.org/page/321",
            )
        )

    with session_scope() as session:
        id_by_description: dict[str, int] = dict(
            session.execute(select(ContentReport.description, ContentReport.id)).all()  # type: ignore[arg-type]
        )

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetContentReport(admin_pb2.GetContentReportReq(content_report_id=-1))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Content report not found."

        res = api.GetContentReport(admin_pb2.GetContentReportReq(content_report_id=id_by_description["r2"]))
        rep = res.content_report
        assert rep.content_report_id == id_by_description["r2"]
        assert rep.reporting_user_id == normal_user.id
        assert rep.author_user_id == bad_user2.id
        assert rep.reason == "spam"
        assert rep.description == "r2"
        assert rep.content_ref == "comment/124"
        assert rep.user_agent == "n/a"
        assert rep.page == "https://couchers.org/comment/124"

        res = api.GetContentReportsForAuthor(admin_pb2.GetContentReportsForAuthorReq(user=bad_user1.username))
        assert res.content_reports[0].content_report_id == id_by_description["r3"]
        assert res.content_reports[1].content_report_id == id_by_description["r1"]


def test_DeleteUser(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        res = api.DeleteUser(admin_pb2.DeleteUserReq(user=normal_user.username))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert res.deleted

    with real_admin_session(super_token) as api:
        res = api.RecoverDeletedUser(admin_pb2.RecoverDeletedUserReq(user=normal_user.username))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted


def test_RecoverDeletedUser_after_user_initiated_deletion(db, push_collector: PushCollector):
    """
    When a user deletes their account through the normal flow (ConfirmDeleteAccount),
    undelete_token and undelete_until are set. The admin RecoverDeletedUser must clear
    these fields to satisfy the undelete_nullity database constraint.
    """
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()
    user_id = normal_user.id

    # User initiates account deletion
    with account_session(normal_token) as account:
        account.DeleteAccount(account_pb2.DeleteAccountReq(confirm=True))

    # Get the deletion confirmation token
    with session_scope() as session:
        deletion_token = session.execute(select(AccountDeletionToken)).scalar_one().token

    # User confirms account deletion (this sets undelete_token and undelete_until)
    with auth_api_session() as (auth_api, metadata_interceptor):
        auth_api.ConfirmDeleteAccount(auth_pb2.ConfirmDeleteAccountReq(token=deletion_token))

    # Verify the user is deleted and has undelete fields set
    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert user.deleted_at is not None
        assert user.undelete_token is not None
        assert user.undelete_until is not None

    # Admin recovers the user
    with real_admin_session(super_token) as api:
        res = api.RecoverDeletedUser(admin_pb2.RecoverDeletedUserReq(user=normal_user.username))
    assert res.user_id == user_id
    assert not res.deleted

    # Verify undelete fields are cleared
    with session_scope() as session:
        user = session.execute(select(User).where(User.id == user_id)).scalar_one()
        assert user.deleted_at is None
        assert user.undelete_token is None
        assert user.undelete_until is None


def test_CreateApiKey(db, push_collector: PushCollector):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()

        assert (
            session.execute(
                select(func.count())
                .select_from(UserSession)
                .where(UserSession.is_api_key == True)
                .where(UserSession.user_id == normal_user.id)
            ).scalar_one()
            == 0
        )

    with mock_notification_email() as mock:
        with real_admin_session(super_token) as api:
            res = api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=normal_user.username))

    mock.assert_called_once()
    e = email_fields(mock)
    assert e.subject == "[TEST] Your API key for Couchers.org"

    with session_scope() as session:
        token = session.execute(
            select(UserSession.token)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == True)
            .where(UserSession.user_id == normal_user.id)
        ).scalar_one()

        assert token in e.plain
        assert token in e.html

    assert e.recipient == normal_user.email
    assert "api key" in e.subject.lower()
    unique_string = "We've issued you with the following API key:"
    assert unique_string in e.plain
    assert unique_string in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html

    push = push_collector.pop_for_user(normal_user.id, last=True)
    assert push.content.title == "API key created"
    assert push.content.body == "Details were sent to you via email."


def test_GetChats(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        res = api.GetChats(admin_pb2.GetChatsReq(user=normal_user.username))
    assert res.user.user_id == normal_user.id
    assert res.user.username == normal_user.username
    assert res.user.name == normal_user.name
    # New user should have no chats
    assert len(res.host_requests) == 0
    assert len(res.group_chats) == 0


def test_badges(db, push_collector: PushCollector):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        # can add a badge
        assert "swagster" not in api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username)).badges
        with mock_notification_email() as mock:
            res = api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="swagster"))
        assert "swagster" in res.badges

        # badge emails are disabled by default
        mock.assert_not_called()

        push = push_collector.pop_for_user(normal_user.id, last=True)
        assert push.content.title == "New profile badge: Swagster"
        assert push.content.body == "The Swagster badge was added to your profile."

        # can't add/edit special tags
        with pytest.raises(grpc.RpcError) as e:
            api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="founder"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "Admins cannot edit that badge."

        # double add badge
        with pytest.raises(grpc.RpcError) as e:
            api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="swagster"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The user already has that badge."

        # can remove badge
        assert "swagster" in api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username)).badges
        with mock_notification_email() as mock:
            res = api.RemoveBadge(admin_pb2.RemoveBadgeReq(user=normal_user.username, badge_id="swagster"))
        assert "swagster" not in res.badges

        # badge emails are disabled by default
        mock.assert_not_called()

        push = push_collector.pop_for_user(normal_user.id, last=True)
        assert push.content.title == "Profile badge removed"
        assert push.content.body == "The Swagster badge was removed from your profile."

        # not found on user
        with pytest.raises(grpc.RpcError) as e:
            api.RemoveBadge(admin_pb2.RemoveBadgeReq(user=normal_user.username, badge_id="swagster"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The user does not have that badge."

        # not found in general
        with pytest.raises(grpc.RpcError) as e:
            api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="nonexistentbadge"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Badge not found."


def test_DeleteEvent(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with session_scope() as session:
        create_community(session, 0, 2, "Community", [normal_user], [], None)

    start_time = now() + timedelta(hours=2)
    end_time = start_time + timedelta(hours=3)
    with events_session(normal_token) as api:
        res = api.CreateEvent(
            events_pb2.CreateEventReq(
                title="Dummy Title",
                content="Dummy content.",
                photo_key=None,
                offline_information=events_pb2.OfflineEventInformation(
                    address="Near Null Island",
                    lat=0.1,
                    lng=0.2,
                ),
                start_time=Timestamp_from_datetime(start_time),
                end_time=Timestamp_from_datetime(end_time),
                timezone="UTC",
            )
        )
        event_id = res.event_id
        assert not res.is_deleted

    with session_scope() as session:
        with real_admin_session(super_token) as api:
            api.DeleteEvent(
                admin_pb2.DeleteEventReq(
                    event_id=event_id,
                )
            )
            occurrence = session.get_one(EventOccurrence, ident=event_id)
            assert occurrence.is_deleted


def test_ListUserIds(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        res = api.ListUserIds(
            admin_pb2.ListUserIdsReq(
                start_time=Timestamp_from_datetime(datetime(2000, 1, 1)), end_time=Timestamp_from_datetime(now())
            )
        )
        assert len(res.user_ids) == 2
        assert sorted(res.user_ids) == sorted([super_user.id, normal_user.id])

    with real_admin_session(super_token) as api:
        res = api.ListUserIds(
            admin_pb2.ListUserIdsReq(start_time=Timestamp_from_datetime(now()), end_time=Timestamp_from_datetime(now()))
        )
        assert res.user_ids == []


def test_EditReferenceText(db):
    super_user, super_token = generate_user(is_superuser=True)
    test_new_text = "New Text"

    user1, user1_token = generate_user()
    user2, user2_token = generate_user()
    make_friends(user1, user2)

    with session_scope() as session:
        with references_session(user1_token) as api:
            reference = api.WriteFriendReference(
                references_pb2.WriteFriendReferenceReq(
                    to_user_id=user2.id, text="Old Text", private_text="", was_appropriate=True, rating=1
                )
            )

        with real_admin_session(super_token) as admin_api:
            admin_api.EditReferenceText(
                admin_pb2.EditReferenceTextReq(reference_id=reference.reference_id, new_text=test_new_text)
            )

        session.expire_all()

        modified_reference = session.execute(
            select(Reference).where(Reference.id == reference.reference_id)
        ).scalar_one()
        assert modified_reference.text == test_new_text


def test_DeleteReference(db):
    super_user, super_token = generate_user(is_superuser=True)

    user1, user1_token = generate_user()
    user2, user2_token = generate_user()
    make_friends(user1, user2)

    with references_session(user1_token) as api:
        reference = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id, text="Old Text", private_text="", was_appropriate=True, rating=1
            )
        )

    with references_session(user1_token) as api:
        assert api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references

    with real_admin_session(super_token) as admin_api:
        admin_api.DeleteReference(admin_pb2.DeleteReferenceReq(reference_id=reference.reference_id))

    with references_session(user1_token) as api:
        assert not api.ListReferences(references_pb2.ListReferencesReq(from_user_id=user1.id)).references

    with session_scope() as session:
        modified_reference = session.execute(
            select(Reference).where(Reference.id == reference.reference_id)
        ).scalar_one()
        assert modified_reference.is_deleted


def test_GetUserReferences(db):
    super_user, super_token = generate_user(is_superuser=True)

    user1, user1_token = generate_user()
    user2, user2_token = generate_user()
    user3, user3_token = generate_user()
    make_friends(user1, user2)
    make_friends(user1, user3)
    make_friends(user2, user3)

    # user1 writes reference about user2
    with references_session(user1_token) as api:
        ref1 = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user2.id,
                text="Reference from user1 to user2",
                private_text="",
                was_appropriate=True,
                rating=1,
            )
        )

    # user2 writes reference about user1
    with references_session(user2_token) as api:
        ref2 = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user1.id,
                text="Reference from user2 to user1",
                private_text="Private note",
                was_appropriate=True,
                rating=0.8,
            )
        )

    # user3 writes reference about user1
    with references_session(user3_token) as api:
        ref3 = api.WriteFriendReference(
            references_pb2.WriteFriendReferenceReq(
                to_user_id=user1.id,
                text="Reference from user3 to user1",
                private_text="",
                was_appropriate=False,
                rating=0.5,
            )
        )

    # Delete ref3
    with real_admin_session(super_token) as admin_api:
        admin_api.DeleteReference(admin_pb2.DeleteReferenceReq(reference_id=ref3.reference_id))

    # Test GetUserReferences for user1
    with real_admin_session(super_token) as admin_api:
        res = admin_api.GetUserReferences(admin_pb2.GetUserReferencesReq(user=user1.username))

        # user1 wrote 1 reference
        assert len(res.references_from) == 1
        assert res.references_from[0].reference_id == ref1.reference_id
        assert res.references_from[0].from_user_id == user1.id
        assert res.references_from[0].to_user_id == user2.id
        assert res.references_from[0].text == "Reference from user1 to user2"
        assert res.references_from[0].is_deleted is False

        # user1 received 2 references (including the deleted one)
        assert len(res.references_to) == 2
        # Ordered by id descending, so ref3 comes first
        assert res.references_to[0].reference_id == ref3.reference_id
        assert res.references_to[0].is_deleted is True
        assert res.references_to[0].was_appropriate is False

        assert res.references_to[1].reference_id == ref2.reference_id
        assert res.references_to[1].private_text == "Private note"
        assert res.references_to[1].rating == 0.8
        assert res.references_to[1].is_deleted is False


def test_GetUserReferences_not_found(db):
    super_user, super_token = generate_user(is_superuser=True)

    with real_admin_session(super_token) as admin_api:
        with pytest.raises(grpc.RpcError) as e:
            admin_api.GetUserReferences(admin_pb2.GetUserReferencesReq(user="nonexistent"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND


def test_AddUsersToModerationUserList(db):
    super_user, super_token = generate_user(is_superuser=True)
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    user4, _ = generate_user()
    user5, _ = generate_user()
    moderation_list_id = add_users_to_new_moderation_list([user1])

    with session_scope() as session:
        with real_admin_session(super_token) as api:
            # Test adding users to a non-existent moderation list (should raise an error)
            with pytest.raises(grpc.RpcError) as e:
                api.AddUsersToModerationUserList(
                    admin_pb2.AddUsersToModerationUserListReq(users=[user2.username], moderation_list_id=999),
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert "Moderation user list not found." == e.value.details()

            # Test with non-existent user (should raise an error)
            with pytest.raises(grpc.RpcError) as e:
                api.AddUsersToModerationUserList(
                    admin_pb2.AddUsersToModerationUserListReq(users=[user1.username, "nonexistent"]),
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert "Couldn't find that user." == e.value.details()

            # Test successful creation of new moderation list (no moderation_list_id provided)
            res = api.AddUsersToModerationUserList(
                admin_pb2.AddUsersToModerationUserListReq(users=[user1.username, user2.username, user3.username]),
            )
            assert res.moderation_list_id > 0
            with session_scope() as session:
                moderation_user_list = session.get(ModerationUserList, res.moderation_list_id)
                assert moderation_user_list is not None
                assert len(moderation_user_list.users) == 3
                assert {user1.id, user2.id, user3.id}.issubset({user.id for user in moderation_user_list.users})

            # Test list endpoint returns same moderation list with same members not repeated
            listRes = api.ListModerationUserLists(admin_pb2.ListModerationUserListsReq(user=user2.username))
            assert len(listRes.moderation_lists) == 1
            assert listRes.moderation_lists[0].moderation_list_id == res.moderation_list_id
            assert len(listRes.moderation_lists[0].member_ids) == 3
            assert {user1.id, user2.id, user3.id}.issubset(listRes.moderation_lists[0].member_ids)

            # Test user can be in multiple moderation lists
            listRes3 = api.ListModerationUserLists(admin_pb2.ListModerationUserListsReq(user=user1.username))
            assert len(listRes3.moderation_lists) == 2

            # Test adding users to an existing moderation list
            res2 = api.AddUsersToModerationUserList(
                admin_pb2.AddUsersToModerationUserListReq(
                    users=[user4.username, user5.username], moderation_list_id=moderation_list_id
                ),
            )
            assert res2.moderation_list_id == moderation_list_id
            with session_scope() as session:
                moderation_user_list = session.get_one(ModerationUserList, moderation_list_id)
                assert len(moderation_user_list.users) == 3
                assert {user1.id, user4.id, user5.id}.issubset({user.id for user in moderation_user_list.users})

            # Test list user moderation lists endpoint returns the right moderation list
            listRes2 = api.ListModerationUserLists(admin_pb2.ListModerationUserListsReq(user=user5.username))
            assert len(listRes2.moderation_lists) == 1
            assert listRes2.moderation_lists[0].moderation_list_id == moderation_list_id
            assert len(listRes2.moderation_lists[0].member_ids) == 3
            assert {user1.id, user4.id, user5.id}.issubset(listRes2.moderation_lists[0].member_ids)


def test_RemoveUserFromModerationUserList(db):
    super_user, super_token = generate_user(is_superuser=True)
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()
    moderation_list_id = add_users_to_new_moderation_list([user1, user2])

    with real_admin_session(super_token) as api:
        # Test with non-existent user (should raise error)
        with pytest.raises(grpc.RpcError) as e:
            api.RemoveUserFromModerationUserList(admin_pb2.RemoveUserFromModerationUserListReq(user="nonexistent"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert "Couldn't find that user." == e.value.details()

        # Test without providing moderation list id (should raise error)
        with pytest.raises(grpc.RpcError) as e:
            api.RemoveUserFromModerationUserList(admin_pb2.RemoveUserFromModerationUserListReq(user=user2.username))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert "Missing moderation user list id." == e.value.details()

        # Test removing user that's not in the provided moderation list (should raise error)
        with pytest.raises(grpc.RpcError) as e:
            api.RemoveUserFromModerationUserList(
                admin_pb2.RemoveUserFromModerationUserListReq(
                    user=user3.username, moderation_list_id=moderation_list_id
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert "User is not in the moderation user list." == e.value.details()

        # Test successful removal
        api.RemoveUserFromModerationUserList(
            admin_pb2.RemoveUserFromModerationUserListReq(user=user1.username, moderation_list_id=moderation_list_id)
        )
        with session_scope() as session:
            moderation_user_list = session.get_one(ModerationUserList, moderation_list_id)
            assert user1.id not in {user.id for user in moderation_user_list.users}
            assert user2.id in {user.id for user in moderation_user_list.users}

            # Test list user moderation lists endpoint returns right number of moderation lists
            listRes = api.ListModerationUserLists(admin_pb2.ListModerationUserListsReq(user=user1.username))
            assert len(listRes.moderation_lists) == 0
            listRes2 = api.ListModerationUserLists(admin_pb2.ListModerationUserListsReq(user=user2.username))
            assert len(listRes2.moderation_lists) == 1

        # Test removing all users from moderation list should also delete the moderation list
        api.RemoveUserFromModerationUserList(
            admin_pb2.RemoveUserFromModerationUserListReq(user=user2.username, moderation_list_id=moderation_list_id)
        )
        with session_scope() as session:
            assert session.get(ModerationUserList, moderation_list_id) is None


def test_admin_delete_account_url(db, push_collector: PushCollector):
    super_user, super_token = generate_user(is_superuser=True)

    user, token = generate_user()
    user_id = user.id

    with real_admin_session(super_token) as admin_api:
        url = admin_api.CreateAccountDeletionLink(
            admin_pb2.CreateAccountDeletionLinkReq(user=user.username)
        ).account_deletion_confirm_url

    assert push_collector.count_for_user(user_id) == 0

    with session_scope() as session:
        token_o = session.execute(select(AccountDeletionToken)).scalar_one()
        token = token_o.token
        assert token_o.user.id == user_id
        assert url == f"http://localhost:3000/delete-account?token={token}"

    with mock_notification_email() as mock:
        with auth_api_session() as (auth_api, metadata_interceptor):
            auth_api.ConfirmDeleteAccount(
                auth_pb2.ConfirmDeleteAccountReq(
                    token=token,
                )
            )

    push = push_collector.pop_for_user(user_id, last=True)
    assert push.content.title == "Account deleted"
    assert push.content.body == "You can restore it within 7 days using the link we emailed you."
    mock.assert_called_once()
    e = email_fields(mock)


def test_SetLastDonated(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user(last_donated=None)

    with real_admin_session(super_token) as api:
        # user starts with no last_donated
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == normal_user.id)).scalar_one()
            assert user.last_donated is None

        # can set last_donated
        donation_time = now() - timedelta(days=30)
        res = api.SetLastDonated(
            admin_pb2.SetLastDonatedReq(
                user=normal_user.username,
                last_donated=Timestamp_from_datetime(donation_time),
            )
        )

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == normal_user.id)).scalar_one()
            assert user.last_donated is not None
            # check timestamp is close (within a second)
            assert abs((user.last_donated - donation_time).total_seconds()) < 1

        # can clear last_donated by not setting the field
        res = api.SetLastDonated(admin_pb2.SetLastDonatedReq(user=normal_user.username))

        with session_scope() as session:
            user = session.execute(select(User).where(User.id == normal_user.id)).scalar_one()
            assert user.last_donated is None

        # user not found
        with pytest.raises(grpc.RpcError) as e:
            api.SetLastDonated(admin_pb2.SetLastDonatedReq(user="nonexistent"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."


def test_admin_actions_level(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    with real_admin_session(super_token) as api:
        # Default level is NORMAL
        res = api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note="normal note"))
        assert res.admin_actions[0].level == admin_pb2.ADMIN_ACTION_LEVEL_NORMAL

        # Explicitly set to DEBUG
        res = api.AddAdminNote(
            admin_pb2.AddAdminNoteReq(
                user=normal_user.username,
                admin_note="debug note",
                level=admin_pb2.ADMIN_ACTION_LEVEL_DEBUG,
            )
        )
        assert len(res.admin_actions) == 2
        assert res.admin_actions[1].level == admin_pb2.ADMIN_ACTION_LEVEL_DEBUG

        # Explicitly set to HIGH
        res = api.AddAdminNote(
            admin_pb2.AddAdminNoteReq(
                user=normal_user.username,
                admin_note="high note",
                level=admin_pb2.ADMIN_ACTION_LEVEL_HIGH,
            )
        )
        assert len(res.admin_actions) == 3
        assert res.admin_actions[2].level == admin_pb2.ADMIN_ACTION_LEVEL_HIGH


def test_admin_actions_on_mutations(db, push_collector: PushCollector):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    original_gender = normal_user.gender
    original_birthdate = normal_user.birthdate

    with real_admin_session(super_token) as api:
        # ChangeUserGender
        res = api.ChangeUserGender(admin_pb2.ChangeUserGenderReq(user=normal_user.username, gender="Machine"))
        assert any(
            a.action_type == "change_gender" and a.note == f"Changed from '{original_gender}' to 'Machine'"
            for a in res.admin_actions
        )

        # ChangeUserBirthdate
        res = api.ChangeUserBirthdate(
            admin_pb2.ChangeUserBirthdateReq(user=normal_user.username, birthdate="1990-01-01")
        )
        assert any(
            a.action_type == "change_birthdate" and a.note == f"Changed from {original_birthdate} to 1990-01-01"
            for a in res.admin_actions
        )

        # SetPassportSexGenderException
        res = api.SetPassportSexGenderException(
            admin_pb2.SetPassportSexGenderExceptionReq(user=normal_user.username, passport_sex_gender_exception=True)
        )
        assert any(
            a.action_type == "set_passport_sex_gender_exception" and a.note == "Changed from False to True"
            for a in res.admin_actions
        )

        # SendModNote with notify
        res = api.SendModNote(
            admin_pb2.SendModNoteReq(
                user=normal_user.username, content="Please update your profile", internal_id="test1"
            )
        )
        assert any(
            a.action_type == "send_mod_note" and a.note == "Notify user: Yes\n\nPlease update your profile"
            for a in res.admin_actions
        )

        # SendModNote with do_not_notify
        res = api.SendModNote(
            admin_pb2.SendModNoteReq(
                user=normal_user.username,
                content="Silent note",
                internal_id="test2",
                do_not_notify=True,
            )
        )
        assert any(
            a.action_type == "send_mod_note" and a.note == "Notify user: No\n\nSilent note" for a in res.admin_actions
        )

        # DeleteUser
        res = api.DeleteUser(admin_pb2.DeleteUserReq(user=normal_user.username))
        assert any(a.action_type == "delete_user" for a in res.admin_actions)
        assert any(
            a.action_type == "delete_user" and a.level == admin_pb2.ADMIN_ACTION_LEVEL_HIGH for a in res.admin_actions
        )

        # RecoverDeletedUser
        res = api.RecoverDeletedUser(admin_pb2.RecoverDeletedUserReq(user=normal_user.username))
        assert any(a.action_type == "recover_user" for a in res.admin_actions)

        # MarkUserNeedsLocationUpdate
        res = api.MarkUserNeedsLocationUpdate(admin_pb2.MarkUserNeedsLocationUpdateReq(user=normal_user.username))
        assert any(
            a.action_type == "mark_needs_location_update" and a.note == "Marked user as needing location update"
            for a in res.admin_actions
        )

        # SetLastDonated
        res = api.SetLastDonated(
            admin_pb2.SetLastDonatedReq(
                user=normal_user.username,
                last_donated=Timestamp_from_datetime(now()),
            )
        )
        assert any(a.action_type == "set_last_donated" for a in res.admin_actions)


def test_create_admin_tag(db):
    super_user, super_token = generate_user(is_superuser=True)

    with real_admin_session(super_token) as api:
        res = api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="test-tag"))
        assert res.tag == "test-tag"
        assert res.admin_tag_id > 0


def test_create_admin_tag_duplicate(db):
    super_user, super_token = generate_user(is_superuser=True)

    with real_admin_session(super_token) as api:
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="test-tag"))
        with pytest.raises(grpc.RpcError) as e:
            api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="test-tag"))
        assert e.value.code() == grpc.StatusCode.ALREADY_EXISTS
        assert e.value.details() == "That admin tag already exists."


def test_create_admin_tag_empty(db):
    super_user, super_token = generate_user(is_superuser=True)

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag=""))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The admin tag cannot be empty."

        with pytest.raises(grpc.RpcError) as e:
            api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="   "))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "The admin tag cannot be empty."


def test_list_admin_tags(db):
    super_user, super_token = generate_user(is_superuser=True)

    with real_admin_session(super_token) as api:
        # Empty initially
        res = api.ListAdminTags(admin_pb2.ListAdminTagsReq())
        assert len(res.tags) == 0

        # Add some tags
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="bravo"))
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="alpha"))

        res = api.ListAdminTags(admin_pb2.ListAdminTagsReq())
        assert len(res.tags) == 2
        # Ordered alphabetically
        assert res.tags[0].tag == "alpha"
        assert res.tags[1].tag == "bravo"


def test_add_admin_tag_to_user(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    with real_admin_session(super_token) as api:
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="vip"))

        res = api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=normal_user.username, tag="vip"))
        assert "vip" in res.admin_tags
        assert any(a.action_type == "add_tag" and a.tag == "vip" for a in res.admin_actions)


def test_add_admin_tag_to_user_duplicate(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    with real_admin_session(super_token) as api:
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="vip"))
        api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=normal_user.username, tag="vip"))

        with pytest.raises(grpc.RpcError) as e:
            api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=normal_user.username, tag="vip"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The user already has that admin tag."


def test_add_admin_tag_to_user_tag_not_found(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=normal_user.username, tag="nonexistent"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Admin tag not found."


def test_remove_admin_tag_from_user(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    with real_admin_session(super_token) as api:
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="vip"))
        api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=normal_user.username, tag="vip"))

        res = api.RemoveAdminTagFromUser(admin_pb2.RemoveAdminTagFromUserReq(user=normal_user.username, tag="vip"))
        assert "vip" not in res.admin_tags
        assert any(a.action_type == "remove_tag" and a.tag == "vip" for a in res.admin_actions)


def test_remove_admin_tag_from_user_not_assigned(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()

    with real_admin_session(super_token) as api:
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="vip"))

        with pytest.raises(grpc.RpcError) as e:
            api.RemoveAdminTagFromUser(admin_pb2.RemoveAdminTagFromUserReq(user=normal_user.username, tag="vip"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "The user does not have that admin tag."


def test_search_users_by_admin_tag(db):
    super_user, super_token = generate_user(is_superuser=True)
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    with real_admin_session(super_token) as api:
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="vip"))
        api.CreateAdminTag(admin_pb2.CreateAdminTagReq(tag="flagged"))

        api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=user1.username, tag="vip"))
        api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=user2.username, tag="vip"))
        api.AddAdminTagToUser(admin_pb2.AddAdminTagToUserReq(user=user2.username, tag="flagged"))

        # Search for users with "vip" tag
        res = api.SearchUsers(admin_pb2.SearchUsersReq(admin_tags=["vip"]))
        user_ids = {u.user_id for u in res.users}
        assert user1.id in user_ids
        assert user2.id in user_ids
        assert user3.id not in user_ids

        # Search for users with both "vip" AND "flagged" tags (AND logic)
        res = api.SearchUsers(admin_pb2.SearchUsersReq(admin_tags=["vip", "flagged"]))
        user_ids = {u.user_id for u in res.users}
        assert user2.id in user_ids
        assert user1.id not in user_ids

        # Search for non-existent tag returns no results
        res = api.SearchUsers(admin_pb2.SearchUsersReq(admin_tags=["nonexistent"]))
        assert len(res.users) == 0


def test_search_users_by_admin_note(db):
    super_user, super_token = generate_user(is_superuser=True)
    user1, _ = generate_user()
    user2, _ = generate_user()

    with real_admin_session(super_token) as api:
        api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=user1.username, admin_note="suspicious activity"))
        api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=user2.username, admin_note="normal user"))

        # Search by admin action log content (ilike)
        res = api.SearchUsers(admin_pb2.SearchUsersReq(admin_action_log="%suspicious%"))
        user_ids = {u.user_id for u in res.users}
        assert user1.id in user_ids
        assert user2.id not in user_ids


# community invite feature tested in test_events.py
# SendBlogPostNotification tested in test_notifications.py
# MarkUserNeedsLocationUpdate tested in test_jail.py
