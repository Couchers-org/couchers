import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from couchers.models.base import Base, communities_seq
from couchers.models.moderation import ModerationObjectType

if TYPE_CHECKING:
    from couchers.models import Cluster, User


class Discussion(Base, kw_only=True):
    """
    forum board
    """

    __tablename__ = "discussions"
    __moderation_author_column__ = "creator_user_id"
    __moderation_object_type__ = ModerationObjectType.discussion

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value(), init=False
    )

    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), unique=True)
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    last_edited: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    owner_cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    slug: Mapped[str] = column_property(func.slugify(title))

    thread: Mapped[Thread] = relationship(init=False, backref="discussion", uselist=False)

    subscribers: Mapped[list[User]] = relationship(
        init=False, backref="discussions", secondary="discussion_subscriptions", viewonly=True
    )

    creator_user: Mapped[User] = relationship(
        init=False, backref="created_discussions", foreign_keys="Discussion.creator_user_id"
    )
    owner_cluster: Mapped[Cluster] = relationship(init=False, back_populates="owned_discussions", uselist=False)


class DiscussionSubscription(Base, kw_only=True):
    """
    users subscriptions to discussions
    """

    __tablename__ = "discussion_subscriptions"
    __table_args__ = (UniqueConstraint("discussion_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    discussion_id: Mapped[int] = mapped_column(ForeignKey("discussions.id"), index=True)
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    left: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    user: Mapped[User] = relationship(init=False, backref="discussion_subscriptions")
    discussion: Mapped[Discussion] = relationship(init=False, backref="discussion_subscriptions")


class Thread(Base, kw_only=True):
    """
    Thread
    """

    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)


class Comment(Base, kw_only=True):
    """
    Comment
    """

    __tablename__ = "comments"
    __moderation_author_column__ = "author_user_id"
    __moderation_object_type__ = ModerationObjectType.comment

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), index=True)
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    last_edited: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    thread: Mapped[Thread] = relationship(init=False, backref="comments")


class Reply(Base, kw_only=True):
    """
    Reply
    """

    __tablename__ = "replies"
    __moderation_author_column__ = "author_user_id"
    __moderation_object_type__ = ModerationObjectType.reply

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    comment_id: Mapped[int] = mapped_column(ForeignKey("comments.id"), index=True)
    moderation_state_id: Mapped[int] = mapped_column(ForeignKey("moderation_states.id"), index=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    last_edited: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    comment: Mapped[Comment] = relationship(init=False, backref="replies")


class ContentChangeType(enum.Enum):
    edit = enum.auto()
    delete = enum.auto()


class DiscussionVersion(Base, kw_only=True):
    """
    audit log of edits and deletions to discussions
    """

    __tablename__ = "discussion_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    discussion_id: Mapped[int] = mapped_column(ForeignKey("discussions.id"), index=True)
    editor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    change_type: Mapped[ContentChangeType] = mapped_column(Enum(ContentChangeType))
    old_title: Mapped[str | None] = mapped_column(String, default=None)
    new_title: Mapped[str | None] = mapped_column(String, default=None)
    old_content: Mapped[str | None] = mapped_column(String, default=None)
    new_content: Mapped[str | None] = mapped_column(String, default=None)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    discussion: Mapped[Discussion] = relationship(init=False, backref="versions")
    editor_user: Mapped[User] = relationship(
        init=False, backref="edited_discussions", foreign_keys="DiscussionVersion.editor_user_id"
    )


class CommentVersion(Base, kw_only=True):
    """
    audit log of edits and deletions to comments
    """

    __tablename__ = "comment_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    comment_id: Mapped[int] = mapped_column(ForeignKey("comments.id"), index=True)
    editor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    change_type: Mapped[ContentChangeType] = mapped_column(Enum(ContentChangeType))
    old_content: Mapped[str | None] = mapped_column(String, default=None)
    new_content: Mapped[str | None] = mapped_column(String, default=None)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    comment: Mapped[Comment] = relationship(init=False, backref="versions")
    editor_user: Mapped[User] = relationship(
        init=False, backref="edited_comments", foreign_keys="CommentVersion.editor_user_id"
    )


class ReplyVersion(Base, kw_only=True):
    """
    audit log of edits and deletions to replies
    """

    __tablename__ = "reply_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    reply_id: Mapped[int] = mapped_column(ForeignKey("replies.id"), index=True)
    editor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    change_type: Mapped[ContentChangeType] = mapped_column(Enum(ContentChangeType))
    old_content: Mapped[str | None] = mapped_column(String, default=None)
    new_content: Mapped[str | None] = mapped_column(String, default=None)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    reply: Mapped[Reply] = relationship(init=False, backref="versions")
    editor_user: Mapped[User] = relationship(
        init=False, backref="edited_replies", foreign_keys="ReplyVersion.editor_user_id"
    )


class ClusterDiscussionAssociation(Base, kw_only=True):
    """
    discussions related to clusters
    """

    __tablename__ = "cluster_discussion_associations"
    __table_args__ = (UniqueConstraint("discussion_id", "cluster_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    discussion_id: Mapped[int] = mapped_column(ForeignKey("discussions.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    discussion: Mapped[Discussion] = relationship(init=False, backref="cluster_discussion_associations")
    cluster: Mapped[Cluster] = relationship(init=False, backref="cluster_discussion_associations")
