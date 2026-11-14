from collections.abc import Sequence

from geoalchemy2 import Geometry, WKBElement
from geoalchemy2.shape import from_shape
from shapely.geometry.base import BaseGeometry
from sqlalchemy import func, select, type_coerce
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
    User,
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


def busiest_user_neighbourhood_location(session: Session, node: Node) -> WKBElement:
    """
    The centre of the users within about a kilometre of the user inside the node who has the most such neighbours.
    For a city this is nearly always its centre, because searching for a city puts people there.
    """
    node_geom = select(Node.geom).where(Node.id == node.id).scalar_subquery()
    users = select(User.id, User.geom).where(User.is_visible).where(func.ST_Contains(node_geom, User.geom)).cte()
    user, neighbour = users.alias(), users.alias()
    busiest = (
        select(func.ST_Centroid(func.ST_Collect(neighbour.c.geom)))
        .select_from(user.join(neighbour, func.ST_DWithin(user.c.geom, neighbour.c.geom, 0.01)))
        .group_by(user.c.id)
        .order_by(func.count().desc())
        .limit(1)
        .scalar_subquery()
    )
    centre: WKBElement = session.execute(
        select(type_coerce(func.coalesce(busiest, func.ST_PointOnSurface(node_geom)), Geometry(srid=4326)))
    ).scalar_one()
    return centre


def create_cluster(
    session: Session,
    parent_node_id: int,
    name: str,
    description: str,
    creator_user_id: int,
    admin_ids: Sequence[int],
    is_community: bool,
    main_page_geom: WKBElement | None = None,
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
        geom=main_page_geom,
        address=name if main_page_geom is not None else None,
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
