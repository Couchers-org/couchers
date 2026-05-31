"""
Seam to the OTA package registry. The real registry is built separately; until it lands the stub
returns None and native_updates falls back to the client-reported timestamps.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class OtaPackage:
    update_id: str
    created_at: datetime


class OtaRegistry(Protocol):
    def get_package(self, *, platform: str, update_id: str) -> OtaPackage | None: ...


class _StubOtaRegistry:
    def get_package(self, *, platform: str, update_id: str) -> OtaPackage | None:
        return None


_registry: OtaRegistry = _StubOtaRegistry()


def get_ota_registry() -> OtaRegistry:
    return _registry
