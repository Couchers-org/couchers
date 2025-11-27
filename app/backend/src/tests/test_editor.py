import grpc
import pytest

from couchers.db import session_scope
from couchers.models import (
    Cluster,
    Node,
)
from couchers.proto import editor_pb2
from couchers.sql import couchers_select as select
from tests.test_fixtures import db, generate_user, real_editor_session, testconfig  # noqa


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
