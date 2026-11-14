from sqlalchemy import select

from couchers.context import CouchersContext
from couchers.models import Comment, Discussion
from couchers.sql import where_moderated_content_visible, where_users_column_visible


def has_visible_comments(context: CouchersContext):
    return (
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
