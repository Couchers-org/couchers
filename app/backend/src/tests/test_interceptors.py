from concurrent import futures
from contextlib import contextmanager

import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.interceptors import ErrorSanitizationInterceptor, TracingInterceptor
from couchers.metrics import CODE_LABEL, EXCEPTION_LABEL, METHOD_LABEL, servicer_duration_histogram
from couchers.models import APICall
from couchers.utils import now
from proto import auth_pb2
from tests.test_fixtures import db, testconfig


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@contextmanager
def interceptor_dummy_api(
    TestRpc,
    interceptors,
    service_name="testing.Test",
    method_name="TestRpc",
    request_type=empty_pb2.Empty,
    response_type=empty_pb2.Empty,
):
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=interceptors)
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())

        # manually add the handler
        rpc_method_handlers = {
            method_name: grpc.unary_unary_rpc_method_handler(
                TestRpc,
                request_deserializer=request_type.FromString,
                response_serializer=response_type.SerializeToString,
            )
        }
        generic_handler = grpc.method_handlers_generic_handler(service_name, rpc_method_handlers)
        server.add_generic_rpc_handlers((generic_handler,))
        server.start()

        try:
            with grpc.secure_channel(f"localhost:{port}", grpc.local_channel_credentials()) as channel:
                call_rpc = channel.unary_unary(
                    f"/{service_name}/{method_name}",
                    request_serializer=request_type.SerializeToString,
                    response_deserializer=response_type.FromString,
                )
                yield call_rpc
        finally:
            server.stop(None).wait()


def _get_count_from_histogram():
    metrics = servicer_duration_histogram.collect()
    servicer_histogram = [m for m in metrics if m.name == "servicer_duration"][0]
    return [s for s in servicer_histogram.samples if s.name == "servicer_duration_count"][0]


def _check_histogram_labels(method, exception, code, count):
    histogram_count = _get_count_from_histogram()
    assert histogram_count.value == count
    assert histogram_count.labels[METHOD_LABEL] == method
    assert histogram_count.labels[EXCEPTION_LABEL] == exception
    assert histogram_count.labels[CODE_LABEL] == code
    servicer_duration_histogram.clear()


def test_logging_interceptor_ok():
    def TestRpc(request, context):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty())


def test_logging_interceptor_all_ignored():
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

        with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
            with pytest.raises(grpc.RpcError) as e:
                call_rpc(empty_pb2.Empty())
            assert e.value.code() == status_code
            assert e.value.details() == message


def test_logging_interceptor_assertion():
    def TestRpc(request, context):
        assert False

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_logging_interceptor_div0():
    def TestRpc(request, context):
        1 / 0

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_logging_interceptor_raise():
    def TestRpc(request, context):
        raise Exception()

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_logging_interceptor_raise_custom():
    class _TestingException(Exception):
        pass

    def TestRpc(request, context):
        raise _TestingException("This is a custom exception")

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == errors.UNKNOWN_ERROR


def test_tracing_interceptor_ok(db):
    def TestRpc(request, context):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[TracingInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty())

    with session_scope() as session:
        trace = session.query(APICall).one()
        assert trace.method == "/testing.Test/TestRpc"
        assert not trace.status_code
        assert not trace.user_id
        assert len(trace.request) == 0
        assert len(trace.response) == 0
        assert not trace.traceback

    _check_histogram_labels("/testing.Test/TestRpc", "", "", 1)


def test_tracing_interceptor_sensitive(db):
    def TestRpc(request, context):
        return auth_pb2.AuthReq(user="this is not secret", password="this is secret")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[TracingInterceptor()],
        request_type=auth_pb2.CompleteSignupReq,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        call_rpc(auth_pb2.CompleteSignupReq(signup_token="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.query(APICall).one()
        assert trace.method == "/testing.Test/TestRpc"
        assert not trace.status_code
        assert not trace.user_id
        assert not trace.traceback
        req = auth_pb2.CompleteSignupReq.FromString(trace.request)
        assert not req.signup_token
        assert req.username == "not removed"
        res = auth_pb2.AuthReq.FromString(trace.response)
        assert res.user == "this is not secret"
        assert not res.password

    _check_histogram_labels("/testing.Test/TestRpc", "", "", 1)


def test_tracing_interceptor_exception(db):
    def TestRpc(request, context):
        raise Exception("Some error message")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[TracingInterceptor()],
        request_type=auth_pb2.CompleteSignupReq,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        with pytest.raises(Exception):
            call_rpc(auth_pb2.CompleteSignupReq(signup_token="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.query(APICall).one()
        assert trace.method == "/testing.Test/TestRpc"
        assert not trace.status_code
        assert not trace.user_id
        assert "Some error message" in trace.traceback
        req = auth_pb2.CompleteSignupReq.FromString(trace.request)
        assert not req.signup_token
        assert req.username == "not removed"
        assert not trace.response

    _check_histogram_labels("/testing.Test/TestRpc", "Exception", "", 1)


def test_tracing_interceptor_abort(db):
    def TestRpc(request, context):
        context.abort(grpc.StatusCode.FAILED_PRECONDITION, "now a grpc abort")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[TracingInterceptor()],
        request_type=auth_pb2.CompleteSignupReq,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        with pytest.raises(Exception):
            call_rpc(auth_pb2.CompleteSignupReq(signup_token="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.query(APICall).one()
        assert trace.method == "/testing.Test/TestRpc"
        assert trace.status_code == "FAILED_PRECONDITION"
        assert not trace.user_id
        assert "now a grpc abort" in trace.traceback
        req = auth_pb2.CompleteSignupReq.FromString(trace.request)
        assert not req.signup_token
        assert req.username == "not removed"
        assert not trace.response

    _check_histogram_labels("/testing.Test/TestRpc", "Exception", "FAILED_PRECONDITION", 1)
