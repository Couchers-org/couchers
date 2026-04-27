import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import func

from couchers.db import session_scope
from couchers.models import (
    ActivenessProbe,
    ActivenessProbeStatus,
    Cluster,
    FriendRelationship,
    FriendStatus,
    ModerationObjectType,
    ModerationState,
    ModerationVisibility,
    Node,
    NodeType,
    Page,
    PageType,
    PageVersion,
    Thread,
)
from couchers.utils import create_polygon_lat_lng, to_multi
from tests.fixtures.db import generate_user
from tests.test_communities import create_1d_polygon, create_community


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_node_constraints(db):
    # check we can't have two official clusters for a given node
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            node = Node(geom=to_multi(create_1d_polygon(0, 2)), node_type=NodeType.world)
            session.add(node)
            session.flush()
            cluster1 = Cluster(
                name="Testing community, cluster 1",
                description="Testing community description",
                parent_node_id=node.id,
                is_official_cluster=True,
            )
            session.add(cluster1)
            cluster2 = Cluster(
                name="Testing community, cluster 2",
                description="Testing community description",
                parent_node_id=node.id,
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
            thread = Thread()
            session.add(thread)
            session.flush()
            page = Page(
                parent_node_id=c_id,
                # note no owner
                creator_user_id=user.id,
                type=PageType.guide,
                thread_id=thread.id,
            )
            session.add(page)
            session.flush()
            session.add(
                PageVersion(
                    page_id=page.id,
                    editor_user_id=user.id,
                    title="Title",
                    content="Content",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "one_owner" in str(e.value)

    with session_scope() as session:
        node = Node(
            geom=to_multi(create_polygon_lat_lng([[0, 0], [0, 2], [2, 2], [2, 0], [0, 0]])), node_type=NodeType.world
        )
        session.add(node)
        session.flush()
        cluster = Cluster(
            name="Testing Community",
            description="Description for testing community",
            parent_node_id=node.id,
        )
        session.add(cluster)
        session.flush()
        cluster_parent_id = cluster.parent_node_id
        cluster_id = cluster.id

    # check we can't create a page with two owners
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            thread = Thread()
            session.add(thread)
            session.flush()
            page = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                owner_user_id=user.id,
                type=PageType.guide,
                thread_id=thread.id,
            )
            session.add(page)
            session.flush()
            session.add(
                PageVersion(
                    page_id=page.id,
                    editor_user_id=user.id,
                    title="Title",
                    content="Content",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "one_owner" in str(e.value)

    # main page must be owned by the right cluster
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            thread = Thread()
            session.add(thread)
            session.flush()
            main_page = Page(
                parent_node_id=cluster_parent_id,
                # note owner is not cluster
                creator_user_id=user.id,
                owner_user_id=user.id,
                type=PageType.main_page,
                thread_id=thread.id,
            )
            session.add(main_page)
            session.flush()
            session.add(
                PageVersion(
                    page_id=main_page.id,
                    editor_user_id=user.id,
                    title="Main page for the testing community",
                    content="Empty.",
                )
            )
    assert "violates check constraint" in str(e.value)
    assert "main_page_owned_by_cluster" in str(e.value)

    # can only have one main page
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            thread1 = Thread()
            session.add(thread1)
            session.flush()
            main_page1 = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                type=PageType.main_page,
                thread_id=thread1.id,
            )
            session.add(main_page1)
            session.flush()
            session.add(
                PageVersion(
                    page_id=main_page1.id,
                    editor_user_id=user.id,
                    title="Main page 1 for the testing community",
                    content="Empty.",
                )
            )
            thread2 = Thread()
            session.add(thread2)
            session.flush()
            main_page2 = Page(
                parent_node_id=cluster_parent_id,
                creator_user_id=user.id,
                owner_cluster_id=cluster_id,
                type=PageType.main_page,
                thread_id=thread2.id,
            )
            session.add(main_page2)
            session.flush()
            session.add(
                PageVersion(
                    page_id=main_page2.id,
                    editor_user_id=user.id,
                    title="Main page 2 for the testing community",
                    content="Empty.",
                )
            )
    assert "violates unique constraint" in str(e.value)
    assert "ix_pages_owner_cluster_id_type" in str(e.value)


def test_activeness_probes_cant_have_multiple(db):
    # can't have two active activeness probes for a given user
    user, token = generate_user()

    with session_scope() as session:
        # we can create one
        first_probe = ActivenessProbe(user_id=user.id)
        session.add(first_probe)
        session.commit()

        # change it to expired
        first_probe.response = ActivenessProbeStatus.expired
        first_probe.responded = func.now()
        session.commit()

        # can create another one
        session.add(ActivenessProbe(user_id=user.id))
        session.commit()

    # can't create one more
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            session.add(ActivenessProbe(user_id=user.id))
    assert "violates unique constraint" in str(e.value)


def _add_friend_relationship(session, from_user_id, to_user_id, status):
    moderation_state = ModerationState(
        object_type=ModerationObjectType.friend_request,
        object_id=0,
        visibility=ModerationVisibility.visible,
    )
    session.add(moderation_state)
    session.flush()
    fr = FriendRelationship(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        status=status,
        moderation_state_id=moderation_state.id,
    )
    session.add(fr)
    session.flush()
    moderation_state.object_id = fr.id
    return fr


def test_friend_relationship_unique_active_pair(db):
    # can't have two active (pending/accepted) FriendRelationship rows for the same user pair,
    # regardless of direction
    user1, _ = generate_user()
    user2, _ = generate_user()
    user3, _ = generate_user()

    # baseline: one pending relationship is fine
    with session_scope() as session:
        _add_friend_relationship(session, user1.id, user2.id, FriendStatus.pending)

    # can't add a second active row in the same direction
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            _add_friend_relationship(session, user1.id, user2.id, FriendStatus.pending)
    assert "violates unique constraint" in str(e.value)
    assert "uq_friend_relationships_active_pair" in str(e.value)

    # can't add a second active row in the reverse direction either
    with pytest.raises(IntegrityError) as e:
        with session_scope() as session:
            _add_friend_relationship(session, user2.id, user1.id, FriendStatus.accepted)
    assert "violates unique constraint" in str(e.value)
    assert "uq_friend_relationships_active_pair" in str(e.value)

    # a cancelled or rejected row for the same pair is allowed alongside the active one
    with session_scope() as session:
        _add_friend_relationship(session, user1.id, user2.id, FriendStatus.cancelled)
        _add_friend_relationship(session, user2.id, user1.id, FriendStatus.rejected)

    # and active rows for different pairs are unaffected
    with session_scope() as session:
        _add_friend_relationship(session, user1.id, user3.id, FriendStatus.pending)
        _add_friend_relationship(session, user3.id, user2.id, FriendStatus.accepted)
