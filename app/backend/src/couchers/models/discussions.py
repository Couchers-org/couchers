from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, backref, column_property, mapped_column, relationship

from couchers.models.base import Base, communities_seq

if TYPE_CHECKING:
    from couchers.models import Cluster, User


class Discussion(Base):
    """
    forum board
    """

    __tablename__ = "discussions"

    id: Mapped[int] = mapped_column(
        BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value()
    )

    title: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), unique=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    owner_cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    slug: Mapped[str] = column_property(func.slugify(title))

    thread: Mapped["Thread"] = relationship("Thread", backref="discussion", uselist=False)

    subscribers: Mapped[list["User"]] = relationship(
        "User", backref="discussions", secondary="discussion_subscriptions", viewonly=True
    )

    creator_user: Mapped["User"] = relationship(
        "User", backref="created_discussions", foreign_keys="Discussion.creator_user_id"
    )
    owner_cluster: Mapped["Cluster"] = relationship(
        "Cluster", backref=backref("owned_discussions", lazy="dynamic"), uselist=False
    )


class DiscussionSubscription(Base):
    """
    users subscriptions to discussions
    """

    __tablename__ = "discussion_subscriptions"
    __table_args__ = (UniqueConstraint("discussion_id", "user_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    discussion_id: Mapped[int] = mapped_column(ForeignKey("discussions.id"), index=True)
    joined: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    left: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship("User", backref="discussion_subscriptions")
    discussion: Mapped["Discussion"] = relationship("Discussion", backref="discussion_subscriptions")


class Thread(Base):
    """
    Thread
    """

    __tablename__ = "threads"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Comment(Base):
    """
    Comment
    """

    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    thread_id: Mapped[int] = mapped_column(ForeignKey("threads.id"), index=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    thread: Mapped["Thread"] = relationship("Thread", backref="comments")


class Reply(Base):
    """
    Reply
    """

    __tablename__ = "replies"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    comment_id: Mapped[int] = mapped_column(ForeignKey("comments.id"), index=True)
    author_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String)  # CommonMark without images
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    deleted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    comment: Mapped["Comment"] = relationship("Comment", backref="replies")


class ClusterDiscussionAssociation(Base):
    """
    discussions related to clusters
    """

    __tablename__ = "cluster_discussion_associations"
    __table_args__ = (UniqueConstraint("discussion_id", "cluster_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    discussion_id: Mapped[int] = mapped_column(ForeignKey("discussions.id"), index=True)
    cluster_id: Mapped[int] = mapped_column(ForeignKey("clusters.id"), index=True)

    discussion: Mapped["Discussion"] = relationship("Discussion", backref="cluster_discussion_associations")
    cluster: Mapped["Cluster"] = relationship("Cluster", backref="cluster_discussion_associations")
