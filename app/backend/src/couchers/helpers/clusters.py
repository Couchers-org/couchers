from collections.abc import Sequence

from geoalchemy2.shape import from_shape
from shapely.geometry.base import BaseGeometry
from sqlalchemy.orm import Session

from couchers.models import (
    Cluster,
    ClusterRole,
    ClusterSubscription,
    Node,
    NodeType,
    Page,
    PageType,
    PageVersion,
    Thread,
)

CHILD_NODE_TYPE = {
    None: NodeType.world,
    NodeType.world: NodeType.macroregion,
    NodeType.macroregion: NodeType.region,
    NodeType.region: NodeType.subregion,
    NodeType.subregion: NodeType.locality,
    NodeType.locality: NodeType.sublocality,
}

DEFAULT_PAGE_CONTENT = "There is nothing here yet..."
DEFAULT_PAGE_TITLE_TEMPLATE = "Main page for the {name} {type}"


def create_node(session: Session, geom: BaseGeometry, parent_node_id: int | None, node_type: NodeType) -> Node:
    node = Node(geom=from_shape(geom), parent_node_id=parent_node_id, node_type=node_type)
    session.add(node)
    session.flush()
    return node


def create_cluster(
    session: Session,
    parent_node_id: int,
    name: str,
    description: str,
    creator_user_id: int,
    admin_ids: Sequence[int],
    is_community: bool,
) -> Cluster:
    cluster_type = "community" if is_community else "group"
    cluster = Cluster(
        name=name,
        description=description,
        parent_node_id=parent_node_id,
        is_official_cluster=is_community,
    )
    session.add(cluster)
    session.flush()
    thread = Thread()
    session.add(thread)
    session.flush()
    main_page = Page(
        parent_node_id=cluster.parent_node_id,
        creator_user_id=creator_user_id,
        owner_cluster_id=cluster.id,
        type=PageType.main_page,
        thread_id=thread.id,
    )
    session.add(main_page)
    session.flush()
    page_version = PageVersion(
        page_id=main_page.id,
        editor_user_id=creator_user_id,
        title=DEFAULT_PAGE_TITLE_TEMPLATE.format(name=name, type=cluster_type),
        content=DEFAULT_PAGE_CONTENT,
    )
    session.add(page_version)
    for admin_id in admin_ids:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=admin_id,
                cluster_id=cluster.id,
                role=ClusterRole.admin,
            )
        )
    return cluster
