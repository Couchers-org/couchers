from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from couchers.models.base import Base, communities_seq

if TYPE_CHECKING:
    from couchers.models import Cluster, User


class Discussion(Base, kw_only=True):
    """
    forum board
    """

    __tablename__ = "discussions"

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value(), init=False
    )

    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), unique=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

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

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), index=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    thread: Mapped[Thread] = relationship(init=False, backref="comments")


class Reply(Base, kw_only=True):
    """
    Reply
    """

    __tablename__ = "replies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)

    comment_id: Mapped[int] = mapped_column(ForeignKey("comments.id"), index=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    comment: Mapped[Comment] = relationship(init=False, backref="replies")


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
