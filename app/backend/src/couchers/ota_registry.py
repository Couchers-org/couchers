"""
Seam to the OTA package registry (registration / banning / tracking).

The real registry - which records every published OTA package and powers
GetNativeUpdateManifest's "is an update available, give it to me" path - is built
separately. The native update decision (couchers.native_updates) only needs to look a
running package up by id to get its authoritative publish time, so that is all this
seam exposes for now. The stub knows about no packages; until the real registry is
wired in, native_updates falls back to the client-reported timestamps.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class OtaPackage:
    update_id: str
    # When this package was published: the authoritative start of its OTA support window.
    created_at: datetime


class OtaRegistry(Protocol):
    def get_package(self, *, platform: str, update_id: str) -> OtaPackage | None:
        """Look up a published OTA package by id, or None if it isn't registered."""
        ...


class _StubOtaRegistry:
    """Placeholder until the real registry lands: knows about no packages."""

    def get_package(self, *, platform: str, update_id: str) -> OtaPackage | None:
        return None


_registry: OtaRegistry = _StubOtaRegistry()


def get_ota_registry() -> OtaRegistry:
    return _registry
