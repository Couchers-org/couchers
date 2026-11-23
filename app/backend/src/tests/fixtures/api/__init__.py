"""
Exposes backend APIs 1-to-1 as functions providing:

- Strongly typed parameters
- Encapsulation of protobuf encoding boilerplate, e.g. StringWrapper
- Neutral parameter defaults so tests only need to be explicit about relevant arguments
- Where it avoids boilerplate, convenience functionality such as moderation approval as part of object creation.

Backend API integration tests use these functions,
so they must map directly to corresponding backend APIs,
and avoid direct database manipulation or similar shortcuts.
"""

# Reexport submodules such that tests can import "api" and then use "api.events.create_event".
from . import communities as communities
from . import conversations as conversations
from . import discussions as discussions
from . import events as events
from . import notifications as notifications
from . import threads as threads
