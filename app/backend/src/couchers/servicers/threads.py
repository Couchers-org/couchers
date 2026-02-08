import logging

import grpc
import sqlalchemy.exc
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from couchers.context import CouchersContext, make_background_user_context
from couchers.db import session_scope
from couchers.jobs.enqueue import queue_job
from couchers.models import Comment, Discussion, Event, EventOccurrence, Reply, Thread, User
from couchers.models.notifications import NotificationTopicAction
from couchers.notifications.notify import notify
from couchers.proto import notification_data_pb2, threads_pb2, threads_pb2_grpc
from couchers.proto.internal import jobs_pb2
from couchers.servicers.api import user_model_to_pb
from couchers.servicers.blocking import is_not_visible
from couchers.sql import where_users_column_visible
from couchers.utils import Timestamp_from_datetime

logger = logging.getLogger(__name__)

# Since the API exposes a single ID space regardless of nesting level,
# we construct the API id by appending the nesting level to the
# database ID.


def pack_thread_id(database_id: int, depth: int) -> int:
    return database_id * 10 + depth


def unpack_thread_id(thread_id: int) -> tuple[int, int]:
    """Returns (database_id, depth) tuple."""
    return divmod(thread_id, 10)


def total_num_responses(session: Session, database_id: int) -> int:
    """Return the total number of comments and replies to the thread with
    database id database_id.
    """
    comments = select(func.count()).select_from(Comment).where(Comment.thread_id == database_id)
    replies = (
        select(func.count())
        .select_from(Reply)
        .join(Comment, Comment.id == Reply.comment_id)
        .where(Comment.thread_id == database_id)
    )
    return session.execute(comments).scalar_one() + session.execute(replies).scalar_one()


def thread_to_pb(session: Session, database_id: int) -> threads_pb2.Thread:
    return threads_pb2.Thread(
        thread_id=pack_thread_id(database_id, 0),
        num_responses=total_num_responses(session, database_id),
    )


def generate_reply_notifications(payload: jobs_pb2.GenerateReplyNotificationsPayload) -> None:
    from couchers.servicers.discussions import discussion_to_pb
    from couchers.servicers.events import event_to_pb

    with session_scope() as session:
        database_id, depth = unpack_thread_id(payload.thread_id)
        if depth == 1:
            # this is a top-level Comment on a Thread attached to event, discussion, etc
            comment = session.execute(select(Comment).where(Comment.id == database_id)).scalar_one()
            thread = session.execute(select(Thread).where(Thread.id == comment.thread_id)).scalar_one()
            author_user = session.execute(select(User).where(User.id == comment.author_user_id)).scalar_one()
            # reply object for notif
            reply = threads_pb2.Reply(
                thread_id=payload.thread_id,
                content=comment.content,
                author_user_id=comment.author_user_id,
                created_time=Timestamp_from_datetime(comment.created),
                num_replies=0,
            )
            # figure out if the thread is related to an event or discussion
            event = session.execute(select(Event).where(Event.thread_id == thread.id)).scalar_one_or_none()
            discussion = session.execute(
                select(Discussion).where(Discussion.thread_id == thread.id)
            ).scalar_one_or_none()
            if event:
                # thread is an event thread
                occurrence = event.occurrences.order_by(EventOccurrence.id.desc()).limit(1).one()
                subscribed_user_ids = [user.id for user in event.subscribers]
                attending_user_ids = [user.user_id for user in occurrence.attendances]

                for user_id in set(subscribed_user_ids + attending_user_ids):
                    if is_not_visible(session, user_id, comment.author_user_id):
                        continue
                    if user_id == comment.author_user_id:
                        continue
                    context = make_background_user_context(user_id=user_id)
                    notify(
                        session,
                        user_id=user_id,
                        topic_action=NotificationTopicAction.event__comment,
                        key=str(occurrence.id),
                        data=notification_data_pb2.EventComment(
                            reply=reply,
                            event=event_to_pb(session, occurrence, context),
                            author=user_model_to_pb(author_user, session, context),
                        ),
                        moderation_state_id=occurrence.moderation_state_id,
                    )
            elif discussion:
                # community discussion thread
                cluster = discussion.owner_cluster

                if not cluster.is_official_cluster:
                    raise NotImplementedError("Shouldn't have discussions under groups, only communities")

                for user_id in [discussion.creator_user_id]:
                    if is_not_visible(session, user_id, comment.author_user_id):
                        continue
                    if user_id == comment.author_user_id:
                        continue

                    context = make_background_user_context(user_id=user_id)
                    notify(
                        session,
                        user_id=user_id,
                        topic_action=NotificationTopicAction.discussion__comment,
                        key=str(discussion.id),
                        data=notification_data_pb2.DiscussionComment(
                            reply=reply,
                            discussion=discussion_to_pb(session, discussion, context),
                            author=user_model_to_pb(author_user, session, context),
                        ),
                    )
            else:
                raise NotImplementedError("I can only do event and discussion threads for now")
        elif depth == 2:
            # this is a second-level reply to a comment
            db_reply = session.execute(select(Reply).where(Reply.id == database_id)).scalar_one()
            # the comment we're replying to
            parent_comment = session.execute(select(Comment).where(Comment.id == db_reply.comment_id)).scalar_one()
            context = make_background_user_context(user_id=db_reply.author_user_id)
            thread_replies_author_user_ids = (
                session.execute(
                    where_users_column_visible(
                        select(Reply.author_user_id).where(Reply.comment_id == parent_comment.id),
                        context,
                        Reply.author_user_id,
                    )
                )
                .scalars()
                .all()
            )
            thread_user_ids = set(thread_replies_author_user_ids)
            if not is_not_visible(session, parent_comment.author_user_id, db_reply.author_user_id):
                thread_user_ids.add(parent_comment.author_user_id)

            author_user = session.execute(select(User).where(User.id == db_reply.author_user_id)).scalar_one()

            user_ids_to_notify = set(thread_user_ids) - {db_reply.author_user_id}

            reply = threads_pb2.Reply(
                thread_id=payload.thread_id,
                content=db_reply.content,
                author_user_id=db_reply.author_user_id,
                created_time=Timestamp_from_datetime(db_reply.created),
                num_replies=0,
            )

            event = session.execute(
                select(Event).where(Event.thread_id == parent_comment.thread_id)
            ).scalar_one_or_none()
            discussion = session.execute(
                select(Discussion).where(Discussion.thread_id == parent_comment.thread_id)
            ).scalar_one_or_none()
            if event:
                # thread is an event thread
                occurrence = event.occurrences.order_by(EventOccurrence.id.desc()).limit(1).one()
                for user_id in user_ids_to_notify:
                    context = make_background_user_context(user_id=user_id)
                    notify(
                        session,
                        user_id=user_id,
                        topic_action=NotificationTopicAction.thread__reply,
                        key=str(occurrence.id),
                        data=notification_data_pb2.ThreadReply(
                            reply=reply,
                            event=event_to_pb(session, occurrence, context),
                            author=user_model_to_pb(author_user, session, context),
                        ),
                        moderation_state_id=occurrence.moderation_state_id,
                    )
            elif discussion:
                # community discussion thread
                for user_id in user_ids_to_notify:
                    context = make_background_user_context(user_id=user_id)
                    notify(
                        session,
                        user_id=user_id,
                        topic_action=NotificationTopicAction.thread__reply,
                        key=str(discussion.id),
                        data=notification_data_pb2.ThreadReply(
                            reply=reply,
                            discussion=discussion_to_pb(session, discussion, context),
                            author=user_model_to_pb(author_user, session, context),
                        ),
                    )
            else:
                raise NotImplementedError("I can only do event and discussion threads for now")
        else:
            raise Exception("Unknown depth")


class Threads(threads_pb2_grpc.ThreadsServicer):
    def GetThread(
        self, request: threads_pb2.GetThreadReq, context: CouchersContext, session: Session
    ) -> threads_pb2.GetThreadRes:
        database_id, depth = unpack_thread_id(request.thread_id)
        page_size = request.page_size if 0 < request.page_size < 100000 else 1000
        page_start = unpack_thread_id(int(request.page_token))[0] if request.page_token else 2**50

        if depth == 0:
            if not session.execute(select(Thread).where(Thread.id == database_id)).scalar_one_or_none():
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "thread_not_found")

            res = session.execute(
                select(Comment, func.count(Reply.id))
                .outerjoin(Reply, Reply.comment_id == Comment.id)
                .where(Comment.thread_id == database_id)
                .where(Comment.id < page_start)
                .group_by(Comment.id)
                .order_by(Comment.created.desc())
                .limit(page_size + 1)
            ).all()
            replies = [
                threads_pb2.Reply(
                    thread_id=pack_thread_id(r.id, 1),
                    content=r.content,
                    author_user_id=r.author_user_id,
                    created_time=Timestamp_from_datetime(r.created),
                    num_replies=n,
                )
                for r, n in res[:page_size]
            ]

        elif depth == 1:
            if not session.execute(select(Comment).where(Comment.id == database_id)).scalar_one_or_none():
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "thread_not_found")

            res = (
                session.execute(  # type: ignore[assignment]
                    select(Reply)
                    .where(Reply.comment_id == database_id)
                    .where(Reply.id < page_start)
                    .order_by(Reply.created.desc())
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            replies = [
                threads_pb2.Reply(
                    thread_id=pack_thread_id(r.id, 2),
                    content=r.content,
                    author_user_id=r.author_user_id,
                    created_time=Timestamp_from_datetime(r.created),
                    num_replies=0,
                )
                for r in res[:page_size]
            ]

        else:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "thread_not_found")

        if len(res) > page_size:
            # There's more!
            next_page_token = str(replies[-1].thread_id)
        else:
            next_page_token = ""

        return threads_pb2.GetThreadRes(replies=replies, next_page_token=next_page_token)

    def PostReply(
        self, request: threads_pb2.PostReplyReq, context: CouchersContext, session: Session
    ) -> threads_pb2.PostReplyRes:
        content = request.content.strip()

        if content == "":
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_comment")

        database_id, depth = unpack_thread_id(request.thread_id)
        if depth == 0:
            object_to_add: Comment | Reply = Comment(
                thread_id=database_id, author_user_id=context.user_id, content=content
            )
        elif depth == 1:
            object_to_add = Reply(comment_id=database_id, author_user_id=context.user_id, content=content)
        else:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "thread_not_found")
        session.add(object_to_add)
        try:
            session.flush()
        except sqlalchemy.exc.IntegrityError:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "thread_not_found")

        thread_id = pack_thread_id(object_to_add.id, depth + 1)

        queue_job(
            session,
            job=generate_reply_notifications,
            payload=jobs_pb2.GenerateReplyNotificationsPayload(
                thread_id=thread_id,
            ),
        )

        return threads_pb2.PostReplyRes(thread_id=thread_id)
