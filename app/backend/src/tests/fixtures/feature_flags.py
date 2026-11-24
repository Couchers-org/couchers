from typing import Any


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

    def __init__(self, features: dict[str, Any]) -> None:
        self._features = features

    def set(self, key: str, value: Any) -> None:
        """Make `key` resolve to `value` for every user (logged in or anonymous)."""
        self._features[key] = {"defaultValue": value}

    def set_definition(self, key: str, definition: dict[str, Any]) -> None:
        """Set a raw GrowthBook feature definition, for exercising rollouts/experiments."""
        self._features[key] = definition
