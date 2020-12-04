from concurrent import futures
from contextlib import contextmanager

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.crypto import random_hex
from couchers.interceptors import ErrorSanitizationInterceptor
from tests.test_fixtures import testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@contextmanager
def error_sanitizing_interceptor_dummy_api(TestRpc):
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=[ErrorSanitizationInterceptor()])
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())

        # manually add the handler
        rpc_method_handlers = {
            "TestRpc": grpc.unary_unary_rpc_method_handler(
                TestRpc,
                request_deserializer=empty_pb2.Empty.FromString,
                response_serializer=empty_pb2.Empty.SerializeToString,
            )
        }
        generic_handler = grpc.method_handlers_generic_handler("testing.Test", rpc_method_handlers)
        server.add_generic_rpc_handlers((generic_handler,))
        server.start()

        try:
            with grpc.secure_channel(f"localhost:{port}", grpc.local_channel_credentials()) as channel:
                call_rpc = channel.unary_unary(
                    "/testing.Test/TestRpc",
                    request_serializer=empty_pb2.Empty.SerializeToString,
                    response_deserializer=empty_pb2.Empty.FromString,
                )
                yield call_rpc
        finally:
            server.stop(None).wait()


def test_interceptor_ok():
    def TestRpc(request, context):
        return empty_pb2.Empty()

    with error_sanitizing_interceptor_dummy_api(TestRpc) as call_rpc:
        call_rpc(empty_pb2.Empty())


def test_interceptor_all_ignored():
    # error codes that should not be touched by the interceptor
    pass_through_status_codes = [
        # we can't abort with OK
        # grpc.StatusCode.OK,
        grpc.StatusCode.CANCELLED,
        grpc.StatusCode.UNKNOWN,
        grpc.StatusCode.INVALID_ARGUMENT,
        grpc.StatusCode.DEADLINE_EXCEEDED,
        grpc.StatusCode.NOT_FOUND,
        grpc.StatusCode.ALREADY_EXISTS,
        grpc.StatusCode.PERMISSION_DENIED,
        grpc.StatusCode.UNAUTHENTICATED,
        grpc.StatusCode.RESOURCE_EXHAUSTED,
        grpc.StatusCode.FAILED_PRECONDITION,
        grpc.StatusCode.ABORTED,
        grpc.StatusCode.OUT_OF_RANGE,
        grpc.StatusCode.UNIMPLEMENTED,
        grpc.StatusCode.INTERNAL,
        grpc.StatusCode.UNAVAILABLE,
        grpc.StatusCode.DATA_LOSS,
    ]

    for status_code in pass_through_status_codes:
        message = random_hex()

        def TestRpc(request, context):
            context.abort(status_code, message)

        with error_sanitizing_interceptor_dummy_api(TestRpc) as call_rpc:
            with pytest.raises(grpc.RpcError) as e:
                call_rpc(empty_pb2.Empty())
            assert e.value.code() == status_code
            assert e.value.details() == message


def test_interceptor_assertion():
    def TestRpc(request, context):
        assert False

    with error_sanitizing_interceptor_dummy_api(TestRpc) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_interceptor_div0():
    def TestRpc(request, context):
        1 / 0

    with error_sanitizing_interceptor_dummy_api(TestRpc) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_interceptor_raise():
    def TestRpc(request, context):
        raise Exception("This is a custom exception")

    with error_sanitizing_interceptor_dummy_api(TestRpc) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_interceptor_raise_custom():
    class _TestingException(Exception):
        pass

    def TestRpc(request, context):
        raise _TestingException("This is a custom exception")

    with error_sanitizing_interceptor_dummy_api(TestRpc) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR
