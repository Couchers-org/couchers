import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class OTAPlatform(enum.Enum):
    ios = enum.auto()
    android = enum.auto()


class OTAPackage(Base, kw_only=True):
    """A published, signed Expo Updates OTA bundle the backend can serve to compatible native builds.

    The signed manifest bytes live on the CDN (under `version`); this row only records which bundle is
    available and how recent it is, so the backend can resolve a request and fetch the bytes verbatim.
    """

    __tablename__ = "ota_packages"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    platform: Mapped[OTAPlatform] = mapped_column(Enum(OTAPlatform))
    # The Expo build fingerprint this bundle was cut for (the manifest's runtimeVersion / the build's
    # expo-runtime-version). A build only accepts a manifest whose runtimeVersion equals its own, so
    # (platform, fingerprint) is the compatibility key. Many store builds can share one fingerprint;
    # they're all OTA-compatible with the same bundles.
    fingerprint: Mapped[str] = mapped_column(String)
    # The immutable CDN path component the signed manifest is published under, e.g. v1.3.<commit>.<sha>.
    # The backend fetches {cdn_root}/{version}/{platform}/manifest.
    version: Mapped[str] = mapped_column(String)
    # The manifest's `createdAt` — the publish/stamp time (NOT a build or git-commit time). It's the
    # rollout-ordering lever: the newest one for a fingerprint wins, and a rollback rolls *forward* by
    # republishing the good bundle re-stamped with a fresh, newer createdAt so it sorts newest.
    manifest_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # The manifest's own `id` (content-derived uuid), for reference. NOT unique: a re-stamped rollback
    # reuses the same bundle content and so can repeat an id.
    manifest_id: Mapped[str] = mapped_column(String)

    # Stops handing this bundle to NEW check-ins; it can't reclaim devices already on it (they only move
    # forward in createdAt). Use it to stop the bleeding while a re-stamped rollback is published.
    banned: Mapped[bool] = mapped_column(Boolean, server_default="false", init=False)
    banned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    banned_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    banned_reason: Mapped[str | None] = mapped_column(String, default=None)

    creator_user: Mapped[User] = relationship(init=False, foreign_keys="OTAPackage.creator_user_id")
    banned_by_user: Mapped[User | None] = relationship(init=False, foreign_keys="OTAPackage.banned_by_user_id")

    __table_args__ = (
        UniqueConstraint("platform", "version", name="uq_ota_packages_platform_version"),
        # Resolution filters on (platform, fingerprint) and takes the newest by manifest_created_at.
        Index("ix_ota_packages_resolve", "platform", "fingerprint", "manifest_created_at"),
    )
