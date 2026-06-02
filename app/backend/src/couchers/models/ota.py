import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class OTAPlatform(enum.Enum):
    ios = enum.auto()
    android = enum.auto()


class OTAPackage(Base, kw_only=True):
    # The signed manifest bytes live on the CDN under `version`; this row only records which bundle is
    # available and how recent it is, so the backend can resolve a request and fetch the bytes verbatim.
    __tablename__ = "ota_packages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    platform: Mapped[OTAPlatform] = mapped_column(Enum(OTAPlatform))
    # The manifest's runtimeVersion / build's expo-runtime-version. A build only accepts a manifest whose
    # runtimeVersion equals its own, so (platform, fingerprint) is the compatibility key.
    fingerprint: Mapped[str] = mapped_column(String)
    # The CDN path component the signed manifest is published under, e.g. v1.3.<commit>.<sha>.
    version: Mapped[str] = mapped_column(String)
    # The manifest's createdAt: the publish/stamp time used to order rollouts. A rollback rolls forward by
    # republishing the good bundle re-stamped with a newer createdAt so it sorts newest.
    manifest_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # Restamped to a fresh UUID on every publish — expo-updates skips updates whose id matches the
    # installed one, so reusing an id silently drops the publish.
    manifest_id: Mapped[str] = mapped_column(String)

    # Stops handing this bundle to new check-ins; can't reclaim devices already on it (they only move
    # forward in createdAt), so it's a stop-gap until a re-stamped rollback is published.
    banned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    banned_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    banned_reason: Mapped[str | None] = mapped_column(String, default=None)

    creator_user: Mapped[User] = relationship(init=False, foreign_keys="OTAPackage.creator_user_id")
    banned_by_user: Mapped[User | None] = relationship(init=False, foreign_keys="OTAPackage.banned_by_user_id")

    __table_args__ = (
        UniqueConstraint("platform", "version", name="uq_ota_packages_platform_version"),
        UniqueConstraint("platform", "manifest_id", name="uq_ota_packages_platform_manifest_id"),
        Index("ix_ota_packages_resolve", "platform", "fingerprint", "manifest_created_at"),
        # All three ban columns move together: either the package isn't banned, or every audit field
        # is filled in. Bans are irreversible (rolled forward by republishing) so the reason is
        # required.
        CheckConstraint(
            "(banned_at IS NULL AND banned_by_user_id IS NULL AND banned_reason IS NULL) "
            "OR (banned_at IS NOT NULL AND banned_by_user_id IS NOT NULL AND banned_reason IS NOT NULL)",
            name="ck_ota_packages_ban_columns_consistent",
        ),
    )
