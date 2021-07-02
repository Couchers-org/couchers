import pytest
from sqlalchemy.exc import IntegrityError

from couchers.db import session_scope
from couchers.models import Cluster, Node, Page, PageType, PageVersion, Thread
from couchers.utils import create_polygon_lat_lng, to_multi
from tests.test_communities import create_1d_polygon, create_community
from tests.test_fixtures import db, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_node_constraints(db):
    # check we can't have two official clusters for a given node
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            node = Node(geom=to_multi(create_1d_polygon(0, 2)))
            session.add(node)
            cluster1 = Cluster(
                name=f"Testing community, cluster 1",
                description=f"Testing community description",
                parent_node=node,
                is_official_cluster=True,
            )
            session.add(cluster1)
            cluster2 = Cluster(
                name=f"Testing community, cluster 2",
                description=f"Testing community description",
                parent_node=node,
                is_official_cluster=True,
            )
            session.add(cluster2)
    assert "violates unique constraint" in str(e.value)
    assert "ix_clusters_owner_parent_node_id_is_official_cluster" in str(e.value)


def test_page_constraints(db):
    user, token = generate_user()

    with session_scope() as session:
        c_id = create_community(session, 0, 2, "Root node", [user], [], None).id

    # check we can't create a page without an owner
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            page = Page(
                parent_node_id=c_id,
                # note no owner
                creator_user_id=user.id,
                type=PageType.guide,
                thread=Thread(),
            )
            session.add(page)
            session.add(
                PageVersion(
                    page=page,
                    editor_user_id=user.id,
                    title=f"Title",
                    content="Content",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "one_owner" in str(e.value)

    with session_scope() as session:
        node = Node(geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])))
        session.add(node)
        cluster = Cluster(
            name=f"Testing Community",
            description=f"Description for testing community",
            parent_node=node,
        )
        session.add(cluster)
        session.flush()
        cluster_parent_id = cluster.parent_node_id
        cluster_id = cluster.id

    # check we can't create a page with two owners
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            page = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                owner_user_id=user.id,
                type=PageType.guide,
                thread=Thread(),
            )
            session.add(page)
            session.add(
                PageVersion(
                    page=page,
                    editor_user_id=user.id,
                    title=f"Title",
                    content="Content",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "one_owner" in str(e.value)

    # main page must be owned by the right cluster
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            main_page = Page(
                parent_node_id=cluster_parent_id,
                # note owner is not cluster
                creator_user_id=user.id,
                owner_user_id=user.id,
                type=PageType.main_page,
                thread=Thread(),
            )
            session.add(main_page)
            session.add(
                PageVersion(
                    page=main_page,
                    editor_user_id=user.id,
                    title=f"Main page for the testing community",
                    content="Empty.",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "main_page_owned_by_cluster" in str(e.value)

    # can only have one main page
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            main_page1 = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                type=PageType.main_page,
                thread=Thread(),
            )
            session.add(main_page1)
            session.add(
                PageVersion(
                    page=main_page1,
                    editor_user_id=user.id,
                    title=f"Main page 1 for the testing community",
                    content="Empty.",
                )
            )
            main_page2 = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                type=PageType.main_page,
                thread=Thread(),
            )
            session.add(main_page2)
            session.add(
                PageVersion(
                    page=main_page2,
                    editor_user_id=user.id,
                    title=f"Main page 2 for the testing community",
                    content="Empty.",
                )
            )
    assert "violates unique constraint" in str(e.value)
    assert "ix_pages_owner_cluster_id_type" in str(e.value)
