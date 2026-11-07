from sqlalchemy import select
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.models import Comment, Discussion
from couchers.sql import where_moderated_content_visible, where_users_column_visible


def get_discussions(
    session: Session,
    context: CouchersContext,
    page_size: int,
    page_token: str,
    owner_cluster_id: int | None = None,
) -> tuple[list[Discussion], str | None]:
    next_page_id = int(page_token) if page_token else 2**63 - 1
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
