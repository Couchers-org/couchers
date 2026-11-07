from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.models import Cluster, ClusterSubscription, Comment, Discussion
from couchers.sql import where_moderated_content_visible, where_users_column_visible


def get_discussions(
    session: Session,
    context: CouchersContext,
    page_size: int,
    next_page_id: int,
    owner_cluster_id: int | None = None,
    user_id: int | None = None,
) -> tuple[list[Discussion], str | None]:
    has_visible_comments = (
        where_moderated_content_visible(
            where_users_column_visible(
                select(Comment.thread_id)
                .select_from(Comment)
                .where(Comment.thread_id == Discussion.thread_id)
                .where(Comment.deleted == None),
                context,
                Comment.author_user_id,
            ),
            context,
            Comment,
            is_list_operation=True,
        )
        .correlate(Discussion)
        .exists()
    )

    query = (
        select(Discussion)
        .where((Discussion.deleted == None) | has_visible_comments)
        .where(Discussion.id <= next_page_id)
        .order_by(Discussion.id.desc())
        .limit(page_size + 1)
    )

    if owner_cluster_id is not None:
        query = query.where(Discussion.owner_cluster_id == owner_cluster_id)

    if user_id is not None:
        query = (
            query.join(Cluster, Cluster.id == Discussion.owner_cluster_id)
            .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
            .where(ClusterSubscription.user_id == user_id)
            .where(Cluster.is_official_cluster)
            .where(Cluster.small_community_features_enabled)
        )

    discussions = (
        session.execute(
            where_moderated_content_visible(
                query,
                context,
                Discussion,
                is_list_operation=True,
            )
        )
        .scalars()
        .all()
    )

    next_page_token = str(discussions[page_size].id) if len(discussions) > page_size else None

    return list(discussions[:page_size]), next_page_token
