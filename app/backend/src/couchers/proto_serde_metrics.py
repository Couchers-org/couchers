from collections.abc import Callable
from functools import wraps
from time import perf_counter_ns
from typing import Any

from google._upb import _message as upb_message
from google.protobuf.internal import api_implementation

from couchers.metrics import observe_in_proto_serde_histogram

_METHODS = {
    "SerializeToString": "serialize",
    "SerializePartialToString": "serialize",
    "ParseFromString": "deserialize",
    "MergeFromString": "deserialize",
}

_installed = False


def _timed_method(orig: Callable[..., Any], direction: str) -> Callable[..., Any]:
    @wraps(orig)
    def wrapped(self: Any, *args: Any, **kwargs: Any) -> Any:
        t0 = perf_counter_ns()
        result = orig(self, *args, **kwargs)
        observe_in_proto_serde_histogram(self.DESCRIPTOR.full_name, direction, (perf_counter_ns() - t0) / 1e9)
        return result

    return wrapped


def _timed_from_string(orig: Any) -> classmethod[Any, [bytes], Any]:
    def wrapped(cls: Any, data: bytes) -> Any:
        t0 = perf_counter_ns()
        result = orig.__get__(None, cls)(data)
        observe_in_proto_serde_histogram(cls.DESCRIPTOR.full_name, "deserialize", (perf_counter_ns() - t0) / 1e9)
        return result

    return classmethod(wrapped)


def install_proto_serde_metrics() -> None:
    # Code that looks up one of these methods on a message class before this runs keeps the untimed original. gRPC does
    # that when servicers are added to a server, so this must run before then.
    global _installed
    if _installed:
        return
    assert api_implementation.Type() == "upb", "timing proto (de)serialization relies on the upb protobuf backend"

    # The originals come from the class dict because getattr would bind the FromString classmethod to the base class
    originals = upb_message.Message.__dict__
    replacements: dict[str, Any] = {
        name: _timed_method(originals[name], direction) for name, direction in _METHODS.items()
    }
    replacements["FromString"] = _timed_from_string(originals["FromString"])
    for name, replacement in replacements.items():
        setattr(upb_message.Message, name, replacement)
    _installed = True
