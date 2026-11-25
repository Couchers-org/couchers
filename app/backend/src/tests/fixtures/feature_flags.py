from typing import Any

from couchers import experimentation


class Flags:
    """Test handle for setting feature flag values in file-override mode; see the `flags` fixture."""

    def __init__(self, values: dict[str, Any]) -> None:
        self._values = values

    def set_boolean(self, key: str, value: bool) -> None:
        self._values[key] = value

    def set_string(self, key: str, value: str) -> None:
        self._values[key] = value

    def set_integer(self, key: str, value: int) -> None:
        self._values[key] = value

    def set_float(self, key: str, value: float) -> None:
        self._values[key] = value

    def set_object(self, key: str, value: Any) -> None:
        self._values[key] = value


class FeatureFlags:
    """Test handle for controlling feature flag values; see the `feature_flags` fixture."""

    def __init__(self) -> None:
        self._features: dict[str, Any] = {}
        self._apply()

    def set(self, key: str, value: Any) -> None:
        """Make `key` resolve to `value` for every user (logged in or anonymous)."""
        self.set_definition(key, {"defaultValue": value})

    def set_definition(self, key: str, definition: dict[str, Any]) -> None:
        """Set a raw GrowthBook feature definition, for exercising rollouts/experiments."""
        self._features[key] = definition
        self._apply()

    def _apply(self) -> None:
        experimentation._apply_response({"features": dict(self._features), "savedGroups": {}})
