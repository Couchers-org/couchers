from datetime import date, datetime
from re import match

import grpc
import pytest
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import session_scope
from couchers.models import AccountDeletionToken, Cluster, ContentReport, EventOccurrence, Node, Reference, UserSession
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime, now, parse_date, timedelta
from proto import admin_pb2, auth_pb2, events_pb2, references_pb2, reporting_pb2
from tests.test_communities import create_community
from tests.test_fixtures import (  # noqa
    auth_api_session,
    db,
    email_fields,
    events_session,
    generate_user,
    get_user_id_and_token,
    mock_notification_email,
    push_collector,
    real_admin_session,
    references_session,
    reporting_session,
    testconfig,
)


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


def test_ChangeUserGender(db, push_collector):
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

    push_collector.assert_user_has_single_matching(
        normal_user.id,
        title="Your gender was changed",
        body="Your gender on Couchers.org was changed to Machine by an admin.",
    )


def test_ChangeUserBirthdate(db, push_collector):
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

    push_collector.assert_user_has_single_matching(
        normal_user.id,
        title="Your date of birth was changed",
        body="Your date of birth on Couchers.org was changed to Friday 25 May 1990 by an admin.",
    )


def test_BanUser(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    admin_note = "A good reason"
    utc_regex = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00"
    prefix_regex = rf"\n\[{utc_regex}\] \(id: {super_user.id}, username: {super_user.username}\)"

    with real_admin_session(super_token) as api:
        res = api.BanUser(admin_pb2.BanUserReq(user=normal_user.username, admin_note=admin_note))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert res.banned
    assert not res.deleted
    assert match(rf"^{prefix_regex} {admin_note}\n$", res.admin_note)


def test_UnbanUser(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    admin_note = "A good reason"
    utc_regex = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00"
    prefix_regex = rf"\n\[{utc_regex}\] \(id: {super_user.id}, username: {super_user.username}\)"

    with real_admin_session(super_token) as api:
        res = api.UnbanUser(admin_pb2.UnbanUserReq(user=normal_user.username, admin_note=admin_note))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted
    assert match(rf"^{prefix_regex} {admin_note}\n$", res.admin_note)


def test_AddAdminNote(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    admin_note1 = "User reported strange behavior"
    admin_note2 = "Insert private information here"
    utc_regex = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}\+00:00"
    prefix_regex = rf"\n\[{utc_regex}\] \(id: {super_user.id}, username: {super_user.username}\)"

    with real_admin_session(super_token) as api:
        res = api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note=admin_note1))
    assert res.user_id == normal_user.id
    assert res.username == normal_user.username
    assert res.email == normal_user.email
    assert res.gender == normal_user.gender
    assert parse_date(res.birthdate) == normal_user.birthdate
    assert not res.banned
    assert not res.deleted
    assert match(rf"^{prefix_regex} {admin_note1}\n$", res.admin_note)

    with real_admin_session(super_token) as api:
        res = api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note=admin_note2))
    assert match(rf"^{prefix_regex} {admin_note1}\n{prefix_regex} {admin_note2}\n$", res.admin_note)


def test_AddAdminNote_blank(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, _ = generate_user()
    empty_admin_note = "  \t  \n "

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.AddAdminNote(admin_pb2.AddAdminNoteReq(user=normal_user.username, admin_note=empty_admin_note))
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.ADMIN_NOTE_CANT_BE_EMPTY


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
        id_by_description = dict(session.execute(select(ContentReport.description, ContentReport.id)).all())

    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.GetContentReport(admin_pb2.GetContentReportReq(content_report_id=-1))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.CONTENT_REPORT_NOT_FOUND

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


def test_CreateApiKey(db, push_collector):
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
        api_key = session.execute(
            select(UserSession)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == True)
            .where(UserSession.user_id == normal_user.id)
        ).scalar_one()

        assert api_key.token in e.plain
        assert api_key.token in e.html

    assert e.recipient == normal_user.email
    assert "api key" in e.subject.lower()
    unique_string = "We've issued you with the following API key:"
    assert unique_string in e.plain
    assert unique_string in e.html
    assert "support@couchers.org" in e.plain
    assert "support@couchers.org" in e.html

    push_collector.assert_user_has_single_matching(
        normal_user.id, title="An API key was created for your account", body="Details were sent to you via email."
    )


VALID_GEOJSON_MULTIPOLYGON = """
    {
      "type": "MultiPolygon",
      "coordinates":
       [
        [
          [
            [
              -73.98114904754641,
              40.7470284264813
            ],
            [
              -73.98314135177611,
              40.73416844413217
            ],
            [
              -74.00538969848634,
              40.734314779027144
            ],
            [
              -74.00479214294432,
              40.75027851544338
            ],
            [
              -73.98114904754641,
              40.7470284264813
            ]
          ]
        ]
      ]
    }
"""

POINT_GEOJSON = """
{ "type": "Point", "coordinates": [100.0, 0.0] }
"""


def test_CreateCommunity_invalid_geojson(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()
    with real_admin_session(super_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=POINT_GEOJSON,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == errors.NO_MULTIPOLYGON


def test_CreateCommunity(db):
    with session_scope() as session:
        super_user, super_token = generate_user(is_superuser=True)
        normal_user, normal_token = generate_user()
        with real_admin_session(super_token) as api:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"
            assert community.slug == "test-community"


def test_UpdateCommunity_invalid_geojson(db):
    super_user, super_token = generate_user(is_superuser=True)

    with session_scope() as session:
        with real_admin_session(super_token) as api:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()

            with pytest.raises(grpc.RpcError) as e:
                api.UpdateCommunity(
                    admin_pb2.UpdateCommunityReq(
                        community_id=community.parent_node_id,
                        name="test community 2",
                        description="community for testing 2",
                        geojson=POINT_GEOJSON,
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert e.value.details() == errors.NO_MULTIPOLYGON


def test_UpdateCommunity_invalid_id(db):
    super_user, super_token = generate_user(is_superuser=True)

    with session_scope() as session:
        with real_admin_session(super_token) as api:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )

            with pytest.raises(grpc.RpcError) as e:
                api.UpdateCommunity(
                    admin_pb2.UpdateCommunityReq(
                        community_id=1000,
                        name="test community 1000",
                        description="community for testing 1000",
                        geojson=VALID_GEOJSON_MULTIPOLYGON,
                    )
                )
            assert e.value.code() == grpc.StatusCode.NOT_FOUND
            assert e.value.details() == errors.COMMUNITY_NOT_FOUND


def test_UpdateCommunity(db):
    super_user, super_token = generate_user(is_superuser=True)

    with session_scope() as session:
        with real_admin_session(super_token) as api:
            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"

            api.CreateCommunity(
                admin_pb2.CreateCommunityReq(
                    name="test community 2",
                    description="community for testing 2",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community_2 = session.execute(select(Cluster).where(Cluster.name == "test community 2")).scalar_one()

            api.UpdateCommunity(
                admin_pb2.UpdateCommunityReq(
                    community_id=community.parent_node_id,
                    name="test community 2",
                    description="community for testing 2",
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                    parent_node_id=community_2.parent_node_id,
                )
            )
            session.commit()

            community_updated = session.execute(select(Cluster).where(Cluster.id == community.id)).scalar_one()
            assert community_updated.description == "community for testing 2"
            assert community_updated.slug == "test-community-2"

            node_updated = session.execute(select(Node).where(Node.id == community_updated.parent_node_id)).scalar_one()
            assert node_updated.parent_node_id == community_2.parent_node_id


def test_GetChats(db):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        res = api.GetChats(admin_pb2.GetChatsReq(user=normal_user.username))
    assert res.response


def test_badges(db, push_collector):
    super_user, super_token = generate_user(is_superuser=True)
    normal_user, normal_token = generate_user()

    with real_admin_session(super_token) as api:
        # can add a badge
        assert "volunteer" not in api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username)).badges
        with mock_notification_email() as mock:
            res = api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="volunteer"))
        assert "volunteer" in res.badges

        # badge emails are disabled by default
        mock.assert_not_called()

        push_collector.assert_user_has_single_matching(
            normal_user.id,
            title="The Active Volunteer badge was added to your profile",
            body="Check out your profile to see the new badge!",
        )

        # can't add/edit special tags
        with pytest.raises(grpc.RpcError) as e:
            api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="founder"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.ADMIN_CANNOT_EDIT_BADGE

        # double add badge
        with pytest.raises(grpc.RpcError) as e:
            api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="volunteer"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.USER_ALREADY_HAS_BADGE

        # can remove badge
        assert "volunteer" in api.GetUserDetails(admin_pb2.GetUserDetailsReq(user=normal_user.username)).badges
        with mock_notification_email() as mock:
            res = api.RemoveBadge(admin_pb2.RemoveBadgeReq(user=normal_user.username, badge_id="volunteer"))
        assert "volunteer" not in res.badges

        # badge emails are disabled by default
        mock.assert_not_called()

        push_collector.assert_user_push_matches_fields(
            normal_user.id,
            ix=1,
            title="The Active Volunteer badge was removed from your profile",
            body="You can see all your badges on your profile.",
        )

        # not found on user
        with pytest.raises(grpc.RpcError) as e:
            api.RemoveBadge(admin_pb2.RemoveBadgeReq(user=normal_user.username, badge_id="volunteer"))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.USER_DOES_NOT_HAVE_BADGE

        # not found in general
        with pytest.raises(grpc.RpcError) as e:
            api.AddBadge(admin_pb2.AddBadgeReq(user=normal_user.username, badge_id="nonexistentbadge"))
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.BADGE_NOT_FOUND


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
            occurrence = session.get(EventOccurrence, ident=event_id)
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
        ).scalar_one_or_none()
        assert modified_reference.text == test_new_text


def test_DeleteReference(db):
    super_user, super_token = generate_user(is_superuser=True)

    user1, user1_token = generate_user()
    user2, user2_token = generate_user()

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
        ).scalar_one_or_none()
        assert modified_reference.is_deleted


def test_admin_delete_account_url(db, push_collector):
    super_user, super_token = generate_user(is_superuser=True)

    user, token = generate_user()
    user_id = user.id

    with real_admin_session(super_token) as admin_api:
        url = admin_api.CreateAccountDeletionLink(
            admin_pb2.CreateAccountDeletionLinkReq(user=user.username)
        ).account_deletion_confirm_url

    push_collector.assert_user_has_count(user_id, 0)

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

    push_collector.assert_user_push_matches_fields(
        user_id,
        ix=0,
        title="Your Couchers.org account has been deleted",
        body="You can still undo this by following the link we emailed to you within 7 days.",
    )

    mock.assert_called_once()
    e = email_fields(mock)


# community invite feature tested in test_events.py
