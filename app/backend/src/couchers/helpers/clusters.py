from typing import List

from geoalchemy2.shape import from_shape
from geoalchemy2.types import Geometry
from sqlalchemy.orm.session import Session

from couchers.db import session_scope
from couchers.models import Cluster, ClusterRole, ClusterSubscription, Node, Page, PageType, PageVersion, Thread

DEFAULT_PAGE_CONTENT = "There is nothing here yet..."
DEFAULT_PAGE_TITLE_TEMPLATE = "Main page for the {name} {type}"


def create_node(session, geom, parent_node_id):
    node = Node(geom=from_shape(geom), parent_node_id=parent_node_id)
    session.add(node)
    session.commit()
    return node


def create_cluster(
    session,
    parent_node_id: int,
    name: str,
    description: str,
    creator_user_id: int,
    admin_ids: List,
    members_ids: List,
    is_community: bool,
):
    type = "community" if is_community else "group"
    cluster = Cluster(
        name=name,
        description=description,
        parent_node_id=parent_node_id,
        is_official_cluster=is_community,
    )
    session.add(cluster)
    session.commit()
    main_page = Page(
        parent_node=cluster.parent_node,
        creator_user_id=creator_user_id,
        owner_cluster=cluster,
        type=PageType.main_page,
        thread=Thread(),
    )
    session.add(main_page)
    session.commit()
    page_version = PageVersion(
        page=main_page,
        editor_user_id=creator_user_id,
        title=DEFAULT_PAGE_TITLE_TEMPLATE.format(name=name, type=type),
        content=DEFAULT_PAGE_CONTENT,
    )
    session.add(page_version)
    cluster.cluster_subscriptions.append(
        ClusterSubscription(
            user_id=creator_user_id,
            role=ClusterRole.admin,
        )
    )
    for admin_id in admin_ids:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=admin_id,
                role=ClusterRole.admin,
            )
        )
    for member_id in members_ids:
        cluster.cluster_subscriptions.append(
            ClusterSubscription(
                user_id=member_id,
                role=ClusterRole.member,
            )
        )
    return cluster
