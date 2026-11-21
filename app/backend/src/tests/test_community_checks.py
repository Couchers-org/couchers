import json
from dataclasses import dataclass
from datetime import timedelta

import grpc
import pytest
from google.protobuf import empty_pb2
from sqlalchemy import func, select, update

from couchers.db import session_scope
from couchers.helpers.community_checks import Issue, find_issues
from couchers.models import Cluster, CommunityCheckRun, CommunityIssue, Node, NodeType, User
from couchers.proto import communities_pb2, editor_pb2
from couchers.utils import Timestamp_from_datetime, create_coordinate, now
from tests.fixtures.db import generate_user
from tests.fixtures.misc import process_jobs
from tests.fixtures.rpc_errors import expect_rpc_error
from tests.fixtures.sessions import real_editor_session


def box(x0: float, y0: float, x1: float, y1: float) -> str:
    return f"MULTIPOLYGON((({x0} {y0}, {x1} {y0}, {x1} {y1}, {x0} {y1}, {x0} {y0})))"


def add_community(
    parent_id: int | None, node_type: NodeType, name: str, geom: str, *, official_cluster: bool = True
) -> int:
    with session_scope() as session:
        node = Node(parent_node_id=parent_id, node_type=node_type, geom=func.ST_GeomFromText(geom, 4326))
        session.add(node)
        session.flush()
        if official_cluster:
            session.add(Cluster(parent_node_id=node.id, name=name, description="", is_official_cluster=True))
        return node.id


def move_boundary(node_id: int, geom: str) -> None:
    with session_scope() as session:
        session.execute(update(Node).where(Node.id == node_id).values(geom=func.ST_GeomFromText(geom, 4326)))


@dataclass
class World:
    world: int
    continent: int
    country: int
    city: int


@pytest.fixture
def world(db) -> World:
    world = add_community(None, NodeType.world, "Global", box(-180, -89, 180, 89))
    continent = add_community(world, NodeType.macroregion, "Continent", box(0, 0, 40, 40))
    country = add_community(continent, NodeType.region, "Country", box(0, 0, 10, 10))
    city = add_community(country, NodeType.locality, "City", box(1, 1, 1.5, 1.5))
    return World(world, continent, country, city)


def find() -> list[Issue]:
    with session_scope() as session:
        return sorted(find_issues(session), key=lambda issue: str(issue.key))


def key(issue: Issue) -> tuple[str, int, int | None]:
    return (issue.rule, issue.community.id, issue.other.id if issue.other else None)


def found() -> list[tuple[str, int, int | None]]:
    return [key(issue) for issue in find()]


def test_clean_hierarchy_passes(world: World):
    assert found() == []


def test_city_reaching_outside_its_country(world: World):
    town = add_community(world.country, NodeType.locality, "Border town", box(9.8, 1, 10.3, 1.5))

    [issue] = find()

    assert found() == [("outside_parent", town, world.country)]
    assert issue.share == pytest.approx(0.6, abs=0.01)
    assert issue.priority.name == "medium"


def test_overlapping_cities(world: World):
    neighbour = add_community(world.country, NodeType.locality, "Neighbour", box(1.2, 1, 1.65, 1.5))

    [issue] = find()

    assert found() == [("overlap", neighbour, world.city)]
    assert issue.share == pytest.approx(0.67, abs=0.01)
    assert issue.priority.name == "high"
    assert issue.area_geojson is not None
    assert json.loads(issue.area_geojson)["type"] == "Polygon"


def test_a_community_inside_another_below_it_is_not_an_overlap(world: World):
    add_community(world.city, NodeType.sublocality, "Old town", box(1.1, 1.1, 1.2, 1.2))

    assert found() == []


def test_countries_along_borders_are_low_priority(world: World):
    neighbour = add_community(world.continent, NodeType.region, "Neighbouring country", box(9.5, -1, 12, 2))
    town = add_community(neighbour, NodeType.locality, "Town across the border", box(9.8, 0.5, 10.4, 1))

    assert {key(issue): issue.priority.name for issue in find()} == {
        ("outside_parent", neighbour, world.continent): "low",
        ("overlap", neighbour, world.country): "low",
        ("overlap", town, world.country): "medium",
    }


def test_types(world: World):
    city = add_community(world.continent, NodeType.locality, "City under a continent", box(20, 20, 20.5, 20.5))
    state = add_community(world.country, NodeType.region, "State as big as its country", box(5, 5, 5.5, 5.5))

    assert found() == [("type_by_level", city, world.continent), ("type_not_below_parent", state, world.country)]


def test_parent_loop(world: World):
    a = add_community(None, NodeType.locality, "A", box(2, 2, 2.5, 2.5))
    b = add_community(a, NodeType.locality, "B", box(3, 3, 3.5, 3.5))
    with session_scope() as session:
        session.execute(update(Node).where(Node.id == a).values(parent_node_id=b))
    add_community(b, NodeType.sublocality, "Below the loop", box(3.1, 3.1, 3.2, 3.2))

    loops = [issue for issue in find() if issue.rule == "parent_loop"]

    assert [issue.community.id for issue in loops] == sorted([a, b], key=str)
    assert loops[0].details in (
        f"The parent links go round in a loop: A ({a}) → B ({b}) → A ({a}).",
        f"The parent links go round in a loop: B ({b}) → A ({a}) → B ({b}).",
    )


def test_missing_parent_and_official_cluster(world: World):
    floating = add_community(None, NodeType.locality, "Floating", box(100, 50, 100.5, 50.5))
    nameless = add_community(world.country, NodeType.locality, "Nameless", box(3, 3, 3.5, 3.5), official_cluster=False)

    assert found() == [("missing_parent", floating, None), ("official_cluster", nameless, None)]


def test_duplicate_and_invalid_boundaries(world: World):
    copy = add_community(world.country, NodeType.locality, "City", box(1, 1, 1.5, 1.5))
    bowtie = add_community(
        world.country, NodeType.locality, "Bowtie", "MULTIPOLYGON(((5 5, 5.5 5.5, 5.5 5, 5 5.5, 5 5)))"
    )

    assert found() == [("duplicate_boundary", copy, world.city), ("invalid_boundary", bowtie, None)]


def test_oversized_city(world: World):
    sprawl = add_community(world.country, NodeType.locality, "Sprawl", box(5, 5, 7, 7))
    add_community(world.country, NodeType.subregion, "Large island", box(2, 5, 4, 7))

    assert found() == [("oversized_city", sprawl, None)]
    assert [issue.priority.name for issue in find()] == ["low"]


def test_a_city_across_the_date_line_is_measured_where_it_is(world: World):
    nation = add_community(world.continent, NodeType.region, "Island nation", box(179, 0, 180.5, 1))
    add_community(nation, NodeType.locality, "Island town", box(179.9, 0.2, 180.2, 0.5))

    assert [issue for issue in find() if issue.rule == "oversized_city"] == []


def test_issues_stay_open_until_fixed_and_are_served(world: World):
    editor, editor_token = generate_user(is_editor=True)
    neighbour = add_community(world.country, NodeType.locality, "Neighbour", box(1.2, 1, 1.65, 1.5))

    with real_editor_session(editor_token) as api:
        res = api.ListCommunityIssues(editor_pb2.ListCommunityIssuesReq())
        assert not res.HasField("last_run")
        assert list(res.open_issues) == []

        api.RunCommunityChecks(empty_pb2.Empty())
        process_jobs()
        with session_scope() as session:
            first_seen = session.execute(select(CommunityIssue.first_seen)).scalar_one()

        api.RunCommunityChecks(empty_pb2.Empty())
        process_jobs()
        with session_scope() as session:
            issue = session.execute(select(CommunityIssue)).scalar_one()
            assert issue.first_seen == first_seen
            assert issue.last_seen > first_seen
            assert issue.resolved is None

        res = api.ListCommunityIssues(editor_pb2.ListCommunityIssuesReq())
        [served] = res.open_issues
        assert served.rule == "overlap"
        assert served.priority == editor_pb2.COMMUNITY_ISSUE_PRIORITY_HIGH
        assert served.community.community_id == neighbour
        assert served.community.name == "Neighbour"
        assert served.community.node_type == communities_pb2.NODE_TYPE_LOCALITY
        assert served.other.community_id == world.city
        assert served.other.slug == "city"
        assert served.share.value == pytest.approx(0.67, abs=0.01)
        assert json.loads(served.area_geojson)["type"] == "Polygon"
        assert not served.HasField("resolved")

        move_boundary(neighbour, box(2, 1, 2.5, 1.5))
        api.RunCommunityChecks(empty_pb2.Empty())
        process_jobs()

        res = api.ListCommunityIssues(editor_pb2.ListCommunityIssuesReq())
        assert list(res.open_issues) == []
        assert list(res.resolved_issues) == []
        assert res.last_run.open_issues == 0

        res = api.ListCommunityIssues(
            editor_pb2.ListCommunityIssuesReq(resolved_since=Timestamp_from_datetime(now() - timedelta(hours=1)))
        )
        assert [issue.community.community_id for issue in res.resolved_issues] == [neighbour]
        assert res.resolved_issues[0].HasField("resolved")

        res = api.ListCommunityIssues(editor_pb2.ListCommunityIssuesReq(resolved_since=Timestamp_from_datetime(now())))
        assert list(res.resolved_issues) == []

    with session_scope() as session:
        assert session.execute(
            select(CommunityCheckRun.open_issues).order_by(CommunityCheckRun.id)
        ).scalars().all() == [
            1,
            1,
            0,
        ]


def test_active_users_outside_localities(world: World):
    generate_user(geom=create_coordinate(1.2, 1.2))
    generate_user(geom=create_coordinate(5, 5))
    inactive, _ = generate_user(geom=create_coordinate(5, 5))
    banned, _ = generate_user(geom=create_coordinate(5, 5))
    with session_scope() as session:
        session.execute(update(User).where(User.id == inactive.id).values(last_active=now() - timedelta(days=100)))
        session.execute(update(User).where(User.id == banned.id).values(banned_at=now()))

    editor, editor_token = generate_user(is_editor=True, geom=create_coordinate(1.3, 1.3))
    with real_editor_session(editor_token) as api:
        api.RunCommunityChecks(empty_pb2.Empty())
        process_jobs()
        res = api.ListCommunityIssues(editor_pb2.ListCommunityIssuesReq())

    assert res.last_run.active_users == 3
    assert res.last_run.active_users_outside_localities == 1


def test_normal_users_cannot_see_community_issues(db):
    _, token = generate_user()

    with real_editor_session(token) as api:
        with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED, "Permission denied"):
            api.ListCommunityIssues(editor_pb2.ListCommunityIssuesReq())
        with expect_rpc_error(grpc.StatusCode.PERMISSION_DENIED, "Permission denied"):
            api.RunCommunityChecks(empty_pb2.Empty())
