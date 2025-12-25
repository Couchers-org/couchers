from collections.abc import Sequence

from geoalchemy2.shape import from_shape
from shapely.geometry.base import BaseGeometry
from sqlalchemy.orm import Session

from couchers.models import Cluster, ClusterRole, ClusterSubscription, Node, Page, PageType, PageVersion, Thread

DEFAULT_PAGE_CONTENT = "There is nothing here yet..."
DEFAULT_PAGE_TITLE_TEMPLATE = "Main page for the {name} {type}"


def create_node(session: Session, geom: BaseGeometry, parent_node_id: int | None) -> Node:
    node = Node(geom=from_shape(geom), parent_node_id=parent_node_id)
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
    main_page = Page(
        parent_node=cluster.parent_node,
        creator_user_id=creator_user_id,
        owner_cluster=cluster,
        type=PageType.main_page,
        thread=Thread(),
    )
    session.add(main_page)
    session.flush()
    page_version = PageVersion(
        page=main_page,
        editor_user_id=creator_user_id,
        title=DEFAULT_PAGE_TITLE_TEMPLATE.format(name=name, type=cluster_type),
        content=DEFAULT_PAGE_CONTENT,
    )
    session.add(page_version)
    for admin_id in admin_ids:
        cluster.cluster_subscriptions.append(  # type: ignore[attr-defined]
            ClusterSubscription(
                user_id=admin_id,
                role=ClusterRole.admin,
            )
        )
    return cluster
