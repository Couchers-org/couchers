from collections.abc import Callable, Generator
from contextlib import contextmanager

import grpc
import pytest


@contextmanager
def expect_rpc_error(
    code: grpc.StatusCode,
    details: str | Callable[[str], bool] | None = None,
) -> Generator[pytest.ExceptionInfo[grpc.RpcError]]:
    """
    Asserts that the body raises a grpc.RpcError with the given status code.

    If `details` is a string, the error details must match it exactly.
    If it is a callable, it is called with the error details and must return True.

    Yields the pytest.ExceptionInfo, whose `value` is populated once the block exits, for any further checks.

    Example:
        with expect_rpc_error(grpc.StatusCode.NOT_FOUND, "Couldn't find that user."):
            api.GetUser(api_pb2.GetUserReq(user="nonexistent"))
    """
    with pytest.raises(grpc.RpcError) as exc_info:
        yield exc_info

    error = exc_info.value
    assert error.code() == code, f"Expected status {code}, got {error.code()} with details {error.details()!r}"

    if details is None:
        return

    actual_details = error.details() or ""
    if isinstance(details, str):
        assert actual_details == details, f"Expected error details {details!r}, got {actual_details!r}"
    else:
        assert details(actual_details), f"Error details {actual_details!r} did not match the predicate"
