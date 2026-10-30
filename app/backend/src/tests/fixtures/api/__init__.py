"""
This module exposes typed functions mapping 1-to-1 to backend APIs, encapsulating protobuf encoding boilerplate.
Functions have neutral defaults for tests that don't need specific parameter values.
"""

# Reexport submodules such that tests can import "api" and then use "api.events.create_event".
from . import events as events
