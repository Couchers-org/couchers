"""
Stripping fields marked sensitive (see proto/annotations.proto) out of the requests and responses we log.
"""

from copy import deepcopy
from dataclasses import dataclass
from functools import cache
from typing import overload

from google.protobuf.descriptor import Descriptor
from google.protobuf.message import Message

from couchers.proto import annotations_pb2


@cache
def _descriptor_has_sensitive(descriptor: Descriptor) -> bool:
    """Whether this message type transitively contains any field marked sensitive."""
    seen: set[Descriptor] = set()
    stack = [descriptor]
    while stack:
        d = stack.pop()
        if d in seen:
            continue
        seen.add(d)
        for f in d.fields:
            if f.GetOptions().Extensions[annotations_pb2.sensitive]:
                return True
            if f.message_type is not None:
                stack.append(f.message_type)
    return False


@dataclass(frozen=True, slots=True)
class _SanitizePlan:
    fields_to_clear: tuple[str, ...]
    fields_to_recurse: tuple[tuple[str, bool], ...]  # (field name, is_repeated)


@cache
def _sanitize_plan(descriptor: Descriptor) -> _SanitizePlan:
    """For a message type, the fields to clear and the subfields worth recursing into."""
    clear = []
    recurse = []
    for f in descriptor.fields:
        if f.GetOptions().Extensions[annotations_pb2.sensitive]:
            clear.append(f.name)
        elif f.message_type is not None and _descriptor_has_sensitive(f.message_type):
            recurse.append((f.name, f.is_repeated))
    return _SanitizePlan(fields_to_clear=tuple(clear), fields_to_recurse=tuple(recurse))


def _sanitize_message(message: Message) -> None:
    plan = _sanitize_plan(message.DESCRIPTOR)
    for name in plan.fields_to_clear:
        message.ClearField(name)
    for name, is_repeated in plan.fields_to_recurse:
        submessage = getattr(message, name)
        if not submessage:
            continue
        if is_repeated:
            for msg in submessage:
                _sanitize_message(msg)
        else:
            _sanitize_message(submessage)


@overload
def sanitized_bytes(proto: Message) -> bytes: ...
@overload
def sanitized_bytes(proto: None) -> None: ...
def sanitized_bytes(proto: Message | None) -> bytes | None:
    """
    Remove fields marked sensitive and return serialized bytes.

    Sensitivity is static per message type, so the descriptor analysis is cached: messages whose type has no
    sensitive field anywhere serialize directly without a copy or walk.
    """
    if not proto:
        return None

    if not _descriptor_has_sensitive(proto.DESCRIPTOR):
        return proto.SerializeToString()

    new_proto = deepcopy(proto)
    _sanitize_message(new_proto)
    return new_proto.SerializeToString()
