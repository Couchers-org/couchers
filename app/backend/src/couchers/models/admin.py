import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class AdminActionLevel(enum.Enum):
    debug = enum.auto()
    normal = enum.auto()
    high = enum.auto()


class AdminAction(Base, kw_only=True):
    __tablename__ = "admin_actions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    admin_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    action_type: Mapped[str] = mapped_column(String)
    level: Mapped[AdminActionLevel] = mapped_column(Enum(AdminActionLevel), server_default="normal")

    note: Mapped[str | None] = mapped_column(String, default=None)
    tag: Mapped[str | None] = mapped_column(String, default=None)

    admin_user: Mapped[User] = relationship(init=False, foreign_keys="AdminAction.admin_user_id")
    target_user: Mapped[User] = relationship(init=False, foreign_keys="AdminAction.target_user_id")

    __table_args__ = (Index("ix_admin_actions_target_created", target_user_id, created),)


class AdminTag(Base, kw_only=True):
    __tablename__ = "admin_tags"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    tag: Mapped[str] = mapped_column(String, unique=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)


class UserAdminTag(Base, kw_only=True):
    __tablename__ = "user_admin_tags"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    admin_tag_id: Mapped[int] = mapped_column(ForeignKey("admin_tags.id"), index=True)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    user: Mapped[User] = relationship(init=False, foreign_keys="UserAdminTag.user_id")
    admin_tag: Mapped[AdminTag] = relationship(init=False)

    __table_args__ = (UniqueConstraint("user_id", "admin_tag_id"),)
