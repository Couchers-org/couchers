"""
Reading our custom proto annotations (see proto/annotations.proto) off the descriptor pool.

Everything that knows how descriptors, service/method options and extensions fit together lives here, so
callers work in terms of "the auth level for this method" rather than in terms of protobuf machinery.

The lookups are cached on (pool, method). The pool is a process-wide singleton and the set of methods is
fixed by the descriptors, so the cache is bounded by the API surface. functools.cache does not store
exceptions, so a request naming a method that doesn't exist raises every time and never accumulates.
"""

from functools import cache
from typing import Any, cast

import grpc
from google.protobuf.descriptor import MethodDescriptor, ServiceDescriptor
from google.protobuf.descriptor_pool import DescriptorPool
from google.protobuf.message import Message

from couchers.constants import (
    MISSING_AUTH_LEVEL_ERROR_MESSAGE,
    NONEXISTENT_API_CALL_ERROR_MESSAGE,
)
from couchers.middleware_errors import CallRejectedError
from couchers.proto import annotations_pb2
from couchers.proto.annotations_pb2 import AuthLevel


def split_method(method: str) -> tuple[str, str]:
    """Split a gRPC method path, e.g. "/org.couchers.api.core.API/GetUser", into service and method names."""
    _, service_name, method_name = method.split("/")
    return service_name, method_name


def find_service(pool: DescriptorPool, service_name: str) -> ServiceDescriptor:
    try:
        return cast(ServiceDescriptor, pool.FindServiceByName(service_name))  # type: ignore[no-untyped-call]
    except KeyError:
        raise CallRejectedError(NONEXISTENT_API_CALL_ERROR_MESSAGE, grpc.StatusCode.UNIMPLEMENTED) from None


def find_method(pool: DescriptorPool, method: str) -> MethodDescriptor:
    service_name, method_name = split_method(method)
    return cast(MethodDescriptor, find_service(pool, service_name).FindMethodByName(method_name))  # type: ignore[no-untyped-call]


def service_extension(pool: DescriptorPool, service_name: str, extension: Any) -> Message:
    """The value of a service-level extension; protobuf returns the default instance when it isn't set."""
    return cast(Message, find_service(pool, service_name).GetOptions().Extensions[extension])


def method_extension(pool: DescriptorPool, method: str, extension: Any) -> Message:
    """The value of a method-level extension; protobuf returns the default instance when it isn't set."""
    return cast(Message, find_method(pool, method).GetOptions().Extensions[extension])


def optional_field(message: Message, field: str) -> int | None:
    """Read an optional scalar field, honouring proto field presence, so an explicit 0 differs from unset."""
    return getattr(message, field) if message.HasField(field) else None


@cache
def find_auth_level(pool: DescriptorPool, method: str) -> AuthLevel.ValueType:
    service_name, _ = split_method(method)
    level = find_service(pool, service_name).GetOptions().Extensions[annotations_pb2.auth_level]
    validate_auth_level(level)
    return level


def validate_auth_level(auth_level: AuthLevel.ValueType) -> None:
    # if unknown auth level, then it wasn't set and something's wrong
    if auth_level == annotations_pb2.AUTH_LEVEL_UNKNOWN:
        raise CallRejectedError(MISSING_AUTH_LEVEL_ERROR_MESSAGE, grpc.StatusCode.INTERNAL)

    if auth_level not in {
        annotations_pb2.AUTH_LEVEL_OPEN,
        annotations_pb2.AUTH_LEVEL_JAILED,
        annotations_pb2.AUTH_LEVEL_SECURE,
        annotations_pb2.AUTH_LEVEL_EDITOR,
        annotations_pb2.AUTH_LEVEL_ADMIN,
    }:
        raise CallRejectedError(MISSING_AUTH_LEVEL_ERROR_MESSAGE, grpc.StatusCode.INTERNAL)
