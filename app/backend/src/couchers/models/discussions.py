from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import backref, column_property, relationship

from couchers.models.base import Base, communities_seq


class Discussion(Base):
    """
    forum board
    """

    __tablename__ = "discussions"

    id = Column(BigInteger, communities_seq, primary_key=True, server_default=communities_seq.next_value())

    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    thread_id = Column(ForeignKey("threads.id"), nullable=False, unique=True)
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    creator_user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    owner_cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    slug = column_property(func.slugify(title))

    thread = relationship("Thread", backref="discussion", uselist=False)

    subscribers = relationship("User", backref="discussions", secondary="discussion_subscriptions", viewonly=True)

    creator_user = relationship("User", backref="created_discussions", foreign_keys="Discussion.creator_user_id")
    owner_cluster = relationship("Cluster", backref=backref("owned_discussions", lazy="dynamic"), uselist=False)


class DiscussionSubscription(Base):
    """
    users subscriptions to discussions
    """

    __tablename__ = "discussion_subscriptions"
    __table_args__ = (UniqueConstraint("discussion_id", "user_id"),)

    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    joined = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    left = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="discussion_subscriptions")
    discussion = relationship("Discussion", backref="discussion_subscriptions")


class Thread(Base):
    """
    Thread
    """

    __tablename__ = "threads"

    id = Column(BigInteger, primary_key=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)


class Comment(Base):
    """
    Comment
    """

    __tablename__ = "comments"

    id = Column(BigInteger, primary_key=True)

    thread_id = Column(ForeignKey("threads.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    thread = relationship("Thread", backref="comments")


class Reply(Base):
    """
    Reply
    """

    __tablename__ = "replies"

    id = Column(BigInteger, primary_key=True)

    comment_id = Column(ForeignKey("comments.id"), nullable=False, index=True)
    author_user_id = Column(ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)  # CommonMark without images
    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted = Column(DateTime(timezone=True), nullable=True)

    comment = relationship("Comment", backref="replies")


class ClusterDiscussionAssociation(Base):
    """
    discussions related to clusters
    """

    __tablename__ = "cluster_discussion_associations"
    __table_args__ = (UniqueConstraint("discussion_id", "cluster_id"),)

    id = Column(BigInteger, primary_key=True)

    discussion_id = Column(ForeignKey("discussions.id"), nullable=False, index=True)
    cluster_id = Column(ForeignKey("clusters.id"), nullable=False, index=True)

    discussion = relationship("Discussion", backref="cluster_discussion_associations")
    cluster = relationship("Cluster", backref="cluster_discussion_associations")
