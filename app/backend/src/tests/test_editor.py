import grpc
import pytest
from google.protobuf import empty_pb2
from google.protobuf.wrappers_pb2 import BoolValue, DoubleValue, StringValue
from sqlalchemy import select

from couchers.db import session_scope
from couchers.materialized_views import refresh_materialized_views_rapid
from couchers.models import (
    Cluster,
    Node,
    Volunteer,
)
from couchers.proto import editor_pb2
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import real_editor_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


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


def test_access_by_normal_user(db):
    """Normal users should not be able to access editor APIs"""
    normal_user, normal_token = generate_user()

    with real_editor_session(normal_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
        assert e.value.code() == grpc.StatusCode.PERMISSION_DENIED
        assert e.value.details() == "Permission denied"


def test_access_by_editor_user(db):
    """Editor users should be able to access editor APIs"""
    editor_user, editor_token = generate_user(is_editor=True)

    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"
            assert community.slug == "test-community"


def test_access_by_superuser(db):
    """Superusers (who are also editors) should be able to access editor APIs"""
    editor_user, editor_token = generate_user(is_editor=True)

    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"
            assert community.slug == "test-community"


def test_CreateCommunity_invalid_geojson(db):
    """CreateCommunity should reject invalid GeoJSON"""
    editor_user, editor_token = generate_user(is_editor=True)

    with real_editor_session(editor_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=POINT_GEOJSON,
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "GeoJson was not of type MultiPolygon."


def test_UpdateCommunity_invalid_geojson(db):
    """UpdateCommunity should reject invalid GeoJSON"""
    editor_user, editor_token = generate_user(is_editor=True)

    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()

            with pytest.raises(grpc.RpcError) as e:
                api.UpdateCommunity(
                    editor_pb2.UpdateCommunityReq(
                        community_id=community.parent_node_id,
                        name="test community 2",
                        description="community for testing 2",
                        geojson=POINT_GEOJSON,
                    )
                )
            assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
            assert e.value.details() == "GeoJson was not of type MultiPolygon."


def test_UpdateCommunity_invalid_id(db):
    """UpdateCommunity should reject invalid community IDs"""
    editor_user, editor_token = generate_user(is_editor=True)

    with real_editor_session(editor_token) as api:
        api.CreateCommunity(
            editor_pb2.CreateCommunityReq(
                name="test community",
                description="community for testing",
                admin_ids=[],
                geojson=VALID_GEOJSON_MULTIPOLYGON,
            )
        )

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateCommunity(
                editor_pb2.UpdateCommunityReq(
                    community_id=1000,
                    name="test community 1000",
                    description="community for testing 1000",
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Community not found."


def test_UpdateCommunity(db):
    """UpdateCommunity should successfully update a community"""
    editor_user, editor_token = generate_user(is_editor=True)

    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()

            api.UpdateCommunity(
                editor_pb2.UpdateCommunityReq(
                    community_id=community.parent_node_id,
                    name="test community updated",
                    description="community for testing updated",
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            session.commit()

            community_updated = session.execute(select(Cluster).where(Cluster.id == community.id)).scalar_one()
            assert community_updated.name == "test community updated"
            assert community_updated.description == "community for testing updated"
            assert community_updated.slug == "test-community-updated"


def test_CreateCommunity(db):
    with session_scope() as session:
        editor_user, editor_token = generate_user(is_editor=True)
        normal_user, normal_token = generate_user()
        with real_editor_session(editor_token) as api:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"
            assert community.slug == "test-community"


def test_UpdateCommunity2(db):
    editor_user, editor_token = generate_user(is_editor=True)

    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community",
                    description="community for testing",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community = session.execute(select(Cluster).where(Cluster.name == "test community")).scalar_one()
            assert community.description == "community for testing"

            api.CreateCommunity(
                editor_pb2.CreateCommunityReq(
                    name="test community 2",
                    description="community for testing 2",
                    admin_ids=[],
                    geojson=VALID_GEOJSON_MULTIPOLYGON,
                )
            )
            community_2 = session.execute(select(Cluster).where(Cluster.name == "test community 2")).scalar_one()

            api.UpdateCommunity(
                editor_pb2.UpdateCommunityReq(
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


def test_MakeUserVolunteer(db):
    """MakeUserVolunteer should successfully create a volunteer"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            res = api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer",
                    started_volunteering="2024-01-15",
                    hide_on_team_page=False,
                )
            )

            # Check response
            assert res.user_id == normal_user.id
            assert res.role == "Test Volunteer"
            assert res.started_volunteering == "2024-01-15"
            assert res.show_on_team_page is True
            assert res.username == normal_user.username
            assert res.name == normal_user.name

            volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer.role == "Test Volunteer"
            assert volunteer.started_volunteering.isoformat() == "2024-01-15"
            assert volunteer.show_on_team_page is True


def test_MakeUserVolunteer_default_values(db):
    """MakeUserVolunteer should use default values when not provided"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer",
                )
            )

            volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer.role == "Test Volunteer"
            assert volunteer.started_volunteering  # defaults to today
            assert volunteer.show_on_team_page is True  # hide_on_team_page defaults to False


def test_MakeUserVolunteer_hide_on_team_page(db):
    """MakeUserVolunteer should respect hide_on_team_page=True"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer",
                    hide_on_team_page=True,
                )
            )

            volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer.role == "Test Volunteer"
            assert volunteer.show_on_team_page is False  # hide_on_team_page=True means don't show


def test_MakeUserVolunteer_user_not_found(db):
    """MakeUserVolunteer should fail if user doesn't exist"""
    editor_user, editor_token = generate_user(is_editor=True)

    with real_editor_session(editor_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=999999,
                    role="Test Volunteer",
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Couldn't find that user."


def test_MakeUserVolunteer_already_volunteer(db):
    """MakeUserVolunteer should fail if user is already a volunteer"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        # Create volunteer first time
        api.MakeUserVolunteer(
            editor_pb2.MakeUserVolunteerReq(
                user_id=normal_user.id,
                role="Test Volunteer",
            )
        )

        # Try to create again
        with pytest.raises(grpc.RpcError) as e:
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer 2",
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == "This user is already a volunteer."


def test_MakeUserVolunteer_invalid_date(db):
    """MakeUserVolunteer should fail with invalid date format"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    with real_editor_session(editor_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer",
                    started_volunteering="invalid-date",
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid start date for volunteering."


def test_UpdateVolunteer(db):
    """UpdateVolunteer should successfully update volunteer fields"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            # Create volunteer first
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer",
                )
            )

            # Update volunteer
            res = api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=normal_user.id,
                    role=StringValue(value="Updated Volunteer"),
                    sort_key=DoubleValue(value=10.5),
                    started_volunteering=StringValue(value="2023-06-01"),
                    stopped_volunteering=StringValue(value="2024-12-31"),
                    show_on_team_page=BoolValue(value=False),
                )
            )

            # Check response
            assert res.user_id == normal_user.id
            assert res.role == "Updated Volunteer"
            assert res.sort_key == 10.5
            assert res.started_volunteering == "2023-06-01"
            assert res.stopped_volunteering == "2024-12-31"
            assert res.show_on_team_page is False
            assert res.username == normal_user.username

            volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer.role == "Updated Volunteer"
            assert volunteer.sort_key == 10.5
            assert volunteer.started_volunteering.isoformat() == "2023-06-01"
            assert volunteer.stopped_volunteering
            assert volunteer.stopped_volunteering.isoformat() == "2024-12-31"
            assert volunteer.show_on_team_page is False


def test_UpdateVolunteer_partial_update(db):
    """UpdateVolunteer should only update provided fields"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            # Create volunteer first
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=normal_user.id,
                    role="Test Volunteer",
                    started_volunteering="2024-01-01",
                )
            )

            # Update only role
            api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=normal_user.id,
                    role=StringValue(value="Updated Role"),
                )
            )

            volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer.role == "Updated Role"
            assert volunteer.started_volunteering.isoformat() == "2024-01-01"  # unchanged
            assert volunteer.show_on_team_page is True  # unchanged


def test_UpdateVolunteer_not_found(db):
    """UpdateVolunteer should fail if volunteer doesn't exist"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    with real_editor_session(editor_token) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=normal_user.id,
                    role=StringValue(value="Updated Volunteer"),
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == "Volunteer not found."


def test_UpdateVolunteer_invalid_started_date(db):
    """UpdateVolunteer should fail with invalid started_volunteering date"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        # Create volunteer first
        api.MakeUserVolunteer(
            editor_pb2.MakeUserVolunteerReq(
                user_id=normal_user.id,
                role="Test Volunteer",
            )
        )

        # Try to update with invalid date
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=normal_user.id,
                    started_volunteering=StringValue(value="invalid-date"),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid start date for volunteering."


def test_UpdateVolunteer_invalid_stopped_date(db):
    """UpdateVolunteer should fail with invalid stopped_volunteering date"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        # Create volunteer first
        api.MakeUserVolunteer(
            editor_pb2.MakeUserVolunteerReq(
                user_id=normal_user.id,
                role="Test Volunteer",
            )
        )

        # Try to update with invalid date
        with pytest.raises(grpc.RpcError) as e:
            api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=normal_user.id,
                    stopped_volunteering=StringValue(value="not-a-date"),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Invalid end date for volunteering."


def test_UpdateVolunteer_reinstate(db):
    """UpdateVolunteer should clear stopped_volunteering when reinstate_volunteer=True"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        api.MakeUserVolunteer(
            editor_pb2.MakeUserVolunteerReq(
                user_id=normal_user.id,
                role="Test Volunteer",
            )
        )

        # Set a stopped date first (make them a former volunteer)
        api.UpdateVolunteer(
            editor_pb2.UpdateVolunteerReq(
                user_id=normal_user.id,
                stopped_volunteering=StringValue(value="2024-12-31"),
            )
        )
        with session_scope() as session:
            volunteer_before = session.execute(
                select(Volunteer).where(Volunteer.user_id == normal_user.id)
            ).scalar_one()
            assert volunteer_before.stopped_volunteering is not None

        # Reinstate them
        res = api.UpdateVolunteer(
            editor_pb2.UpdateVolunteerReq(
                user_id=normal_user.id,
                reinstate_volunteer=True,
            )
        )
        assert not res.HasField("stopped_volunteering")

        with session_scope() as session:
            volunteer_after = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer_after.stopped_volunteering is None


def test_UpdateVolunteer_reinstate_already_current(db):
    """UpdateVolunteer with reinstate_volunteer=True on a current volunteer is a no-op"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        api.MakeUserVolunteer(
            editor_pb2.MakeUserVolunteerReq(
                user_id=normal_user.id,
                role="Test Volunteer",
            )
        )

        res = api.UpdateVolunteer(
            editor_pb2.UpdateVolunteerReq(
                user_id=normal_user.id,
                reinstate_volunteer=True,
            )
        )
        assert not res.HasField("stopped_volunteering")

        with session_scope() as session:
            volunteer = session.execute(select(Volunteer).where(Volunteer.user_id == normal_user.id)).scalar_one()
            assert volunteer.stopped_volunteering is None


def test_UpdateVolunteer_reinstate_conflict_with_stopped(db):
    """UpdateVolunteer should fail if reinstate_volunteer=True and stopped_volunteering is also set"""
    editor_user, editor_token = generate_user(is_editor=True)
    normal_user, normal_token = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        api.MakeUserVolunteer(
            editor_pb2.MakeUserVolunteerReq(
                user_id=normal_user.id,
                role="Test Volunteer",
            )
        )

        with pytest.raises(grpc.RpcError) as e:
            api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=normal_user.id,
                    reinstate_volunteer=True,
                    stopped_volunteering=StringValue(value="2024-12-31"),
                )
            )
        assert e.value.code() == grpc.StatusCode.INVALID_ARGUMENT
        assert e.value.details() == "Cannot reinstate a volunteer and set a stopped date at the same time."


def test_ListVolunteers(db):
    """ListVolunteers should return all current volunteers"""
    editor_user, editor_token = generate_user(is_editor=True)
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            # Create three volunteers
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=user1.id,
                    role="Volunteer 1",
                    started_volunteering="2024-01-15",
                )
            )
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=user2.id,
                    role="Volunteer 2",
                    started_volunteering="2023-06-01",
                )
            )
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=user3.id,
                    role="Volunteer 3",
                    started_volunteering="2024-03-20",
                )
            )

            # List volunteers (only current ones by default)
            res = api.ListVolunteers(editor_pb2.ListVolunteersReq(include_past=False))

            assert len(res.volunteers) == 3
            user_ids = {v.user_id for v in res.volunteers}
            assert user_ids == {user1.id, user2.id, user3.id}

            # Check that all fields are populated
            for volunteer in res.volunteers:
                assert volunteer.user_id > 0
                assert volunteer.role != ""
                assert volunteer.username != ""
                assert volunteer.name != ""
                assert volunteer.started_volunteering != ""
                assert volunteer.show_on_team_page is True


def test_ListVolunteers_with_past(db):
    """ListVolunteers should include past volunteers when requested"""
    editor_user, editor_token = generate_user(is_editor=True)
    user1, _ = generate_user()
    user2, _ = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            # Create current volunteer
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=user1.id,
                    role="Current Volunteer",
                )
            )

            # Create past volunteer
            api.MakeUserVolunteer(
                editor_pb2.MakeUserVolunteerReq(
                    user_id=user2.id,
                    role="Past Volunteer",
                )
            )
            api.UpdateVolunteer(
                editor_pb2.UpdateVolunteerReq(
                    user_id=user2.id,
                    stopped_volunteering=StringValue(value="2024-06-30"),
                )
            )

            # List only current volunteers
            res = api.ListVolunteers(editor_pb2.ListVolunteersReq(include_past=False))
            assert len(res.volunteers) == 1
            assert res.volunteers[0].user_id == user1.id
            assert not res.volunteers[0].HasField("stopped_volunteering")

            # List all volunteers (including past)
            res_with_past = api.ListVolunteers(editor_pb2.ListVolunteersReq(include_past=True))
            assert len(res_with_past.volunteers) == 2
            user_ids = {v.user_id for v in res_with_past.volunteers}
            assert user_ids == {user1.id, user2.id}

            # Find the past volunteer and verify stopped_volunteering is set
            past_volunteer = next(v for v in res_with_past.volunteers if v.user_id == user2.id)
            assert past_volunteer.stopped_volunteering == "2024-06-30"


def test_ListVolunteers_ordering(db):
    """ListVolunteers should respect sort_key ordering"""
    editor_user, editor_token = generate_user(is_editor=True)
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with session_scope() as session:
        with real_editor_session(editor_token) as api:
            # Create volunteers with different sort keys
            api.MakeUserVolunteer(editor_pb2.MakeUserVolunteerReq(user_id=user1.id, role="Volunteer 1"))
            api.UpdateVolunteer(editor_pb2.UpdateVolunteerReq(user_id=user1.id, sort_key=DoubleValue(value=30.0)))

            api.MakeUserVolunteer(editor_pb2.MakeUserVolunteerReq(user_id=user2.id, role="Volunteer 2"))
            api.UpdateVolunteer(editor_pb2.UpdateVolunteerReq(user_id=user2.id, sort_key=DoubleValue(value=10.0)))

            api.MakeUserVolunteer(editor_pb2.MakeUserVolunteerReq(user_id=user3.id, role="Volunteer 3"))
            api.UpdateVolunteer(editor_pb2.UpdateVolunteerReq(user_id=user3.id, sort_key=DoubleValue(value=20.0)))

            # List volunteers - should be ordered by sort_key ascending
            res = api.ListVolunteers(editor_pb2.ListVolunteersReq(include_past=False))
            assert len(res.volunteers) == 3
            assert res.volunteers[0].user_id == user2.id  # sort_key 10.0
            assert res.volunteers[1].user_id == user3.id  # sort_key 20.0
            assert res.volunteers[2].user_id == user1.id  # sort_key 30.0


def test_ListVolunteers_empty(db):
    """ListVolunteers should return empty list when no volunteers exist"""
    editor_user, editor_token = generate_user(is_editor=True)

    refresh_materialized_views_rapid(empty_pb2.Empty())
    with real_editor_session(editor_token) as api:
        res = api.ListVolunteers(editor_pb2.ListVolunteersReq(include_past=False))
        assert len(res.volunteers) == 0
