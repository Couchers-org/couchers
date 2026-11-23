"""
Exposes backend APIs 1-to-1 as functions providing:

- Strongly typed parameters
- Encapsulation of protobuf encoding boilerplate, e.g. StringWrapper
- Neutral parameter defaults so tests only need to be explicit about relevant arguments
- Where it avoids boilerplate, convenience functionality such as moderation approval as part of object creation.

The point is to support integration tests of backend APIs,
so functions should correspond and delegate to a backend API,
and avoid manipulating the database directly.
"""

# Reexport submodules such that tests can import "api" and then use "api.events.create_event".
from . import conversations as conversations
from . import events as events
from . import notifications as notifications
