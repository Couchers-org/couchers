from concurrent import futures
from contextlib import contextmanager

import grpc
import pytest
from google.protobuf import empty_pb2
from test_admin import _admin_session

from couchers import errors
from couchers.crypto import random_hex
from couchers.db import session_scope
from couchers.interceptors import AuthValidatorInterceptor, ErrorSanitizationInterceptor, TracingInterceptor
from couchers.metrics import CODE_LABEL, EXCEPTION_LABEL, METHOD_LABEL, servicer_duration_histogram
from couchers.models import APICall, UserSession
from couchers.servicers.account import Account
from couchers.sql import couchers_select as select
from proto import account_pb2, admin_pb2, auth_pb2
from tests.test_fixtures import db, generate_user, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@contextmanager
def interceptor_dummy_api(
    rpc,
    interceptors,
    service_name="testing.Test",
    method_name="TestRpc",
    request_type=empty_pb2.Empty,
    response_type=empty_pb2.Empty,
    creds=None,
):
    with futures.ThreadPoolExecutor(1) as executor:
        server = grpc.server(executor, interceptors=interceptors)
        port = server.add_secure_port("localhost:0", grpc.local_server_credentials())

        # manually add the handler
        rpc_method_handlers = {
            method_name: grpc.unary_unary_rpc_method_handler(
                rpc,
                request_deserializer=request_type.FromString,
                response_serializer=response_type.SerializeToString,
            )
        }
        generic_handler = grpc.method_handlers_generic_handler(service_name, rpc_method_handlers)
        server.add_generic_rpc_handlers((generic_handler,))
        server.start()

        try:
            with grpc.secure_channel(f"localhost:{port}", creds or grpc.local_channel_credentials()) as channel:
                call_rpc = channel.unary_unary(
                    f"/{service_name}/{method_name}",
                    request_serializer=request_type.SerializeToString,
                    response_deserializer=response_type.FromString,
                )
                yield call_rpc
        finally:
            server.stop(None).wait()


def _check_histogram_labels(method, exception, code, count):
    metrics = servicer_duration_histogram.collect()
    servicer_histogram = [m for m in metrics if m.name == "servicer_duration"][0]
    histogram_count = [
        s
        for s in servicer_histogram.samples
        if s.name == "servicer_duration_count"
        and s.labels[METHOD_LABEL] == method
        and s.labels[EXCEPTION_LABEL] == exception
        and s.labels[CODE_LABEL] == code
    ][0]
    assert histogram_count.value == count
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


def test_tracing_interceptor_ok_open(db):
    def TestRpc(request, context):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[TracingInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty())

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
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
        request_type=auth_pb2.SignupAccount,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        call_rpc(auth_pb2.SignupAccount(password="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/testing.Test/TestRpc"
        assert not trace.status_code
        assert not trace.user_id
        assert not trace.traceback
        req = auth_pb2.SignupAccount.FromString(trace.request)
        assert not req.password
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
        request_type=auth_pb2.SignupAccount,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        with pytest.raises(Exception):
            call_rpc(auth_pb2.SignupAccount(password="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/testing.Test/TestRpc"
        assert not trace.status_code
        assert not trace.user_id
        assert "Some error message" in trace.traceback
        req = auth_pb2.SignupAccount.FromString(trace.request)
        assert not req.password
        assert req.username == "not removed"
        assert not trace.response

    _check_histogram_labels("/testing.Test/TestRpc", "Exception", "", 1)


def test_tracing_interceptor_abort(db):
    def TestRpc(request, context):
        context.abort(grpc.StatusCode.FAILED_PRECONDITION, "now a grpc abort")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[TracingInterceptor()],
        request_type=auth_pb2.SignupAccount,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        with pytest.raises(Exception):
            call_rpc(auth_pb2.SignupAccount(password="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/testing.Test/TestRpc"
        assert trace.status_code == "FAILED_PRECONDITION"
        assert not trace.user_id
        assert "now a grpc abort" in trace.traceback
        req = auth_pb2.SignupAccount.FromString(trace.request)
        assert not req.password
        assert req.username == "not removed"
        assert not trace.response

    _check_histogram_labels("/testing.Test/TestRpc", "Exception", "FAILED_PRECONDITION", 1)


def test_auth_interceptor(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()

    with _admin_session(super_token) as api:
        api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=user.username))

    with session_scope() as session:
        api_session = session.execute(select(UserSession).where(UserSession.is_api_key == True)).scalar_one()
        api_key = api_session.token

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [AuthValidatorInterceptor()],
        "request_type": empty_pb2.Empty,
        "response_type": account_pb2.GetAccountInfoRes,
    }

    # no creds, no go for secure APIs
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # can auth with cookie
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res1 = call_rpc(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}"),))
    assert res1.username == user.username

    # can't auth with wrong cookie
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={random_hex(32)}"),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # can auth with api key
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res2 = call_rpc(empty_pb2.Empty(), metadata=(("authorization", f"Bearer {api_key}"),))
    assert res2.username == user.username

    # can't auth with wrong api key
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(("authorization", f"Bearer {random_hex(32)}"),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # can auth with grpc helper (they do the same as above)
    comp_creds = grpc.composite_channel_credentials(
        grpc.local_channel_credentials(), grpc.access_token_call_credentials(api_key)
    )
    with interceptor_dummy_api(**rpc_def, creds=comp_creds) as call_rpc:
        res3 = call_rpc(empty_pb2.Empty())
    assert res3.username == user.username

    # can't auth with both
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(
                empty_pb2.Empty(),
                metadata=(
                    ("cookie", f"couchers-sesh={token}"),
                    ("authorization", f"Bearer {api_key}"),
                ),
            )
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == 'Both "cookie" and "authorization" in request'

    # malformed bearer
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(("authorization", f"bearer {api_key}"),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"


def test_tracing_interceptor_auth_cookies(db):
    user, token = generate_user()

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [TracingInterceptor(), AuthValidatorInterceptor()],
        "request_type": empty_pb2.Empty,
        "response_type": account_pb2.GetAccountInfoRes,
    }

    # with cookies
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res1 = call_rpc(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}"),))
    assert res1.username == user.username

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/org.couchers.api.account.Account/GetAccountInfo"
        assert not trace.status_code
        assert trace.user_id == user.id
        assert not trace.is_api_key
        assert len(trace.request) == 0
        assert not trace.traceback


def test_tracing_interceptor_auth_api_key(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()

    with _admin_session(super_token) as api:
        api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=user.username))

    with session_scope() as session:
        api_session = session.execute(select(UserSession).where(UserSession.is_api_key == True)).scalar_one()
        api_key = api_session.token

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [TracingInterceptor(), AuthValidatorInterceptor()],
        "request_type": empty_pb2.Empty,
        "response_type": account_pb2.GetAccountInfoRes,
    }

    # with api key
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res1 = call_rpc(empty_pb2.Empty(), metadata=(("authorization", f"Bearer {api_key}"),))
    assert res1.username == user.username

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/org.couchers.api.account.Account/GetAccountInfo"
        assert not trace.status_code
        assert trace.user_id == user.id
        assert trace.is_api_key
        assert len(trace.request) == 0
        assert not trace.traceback


def test_auth_levels(db):
    def TestRpc(request, context):
        return empty_pb2.Empty()

    def gen_args(service, method):
        return {
            "rpc": TestRpc,
            "service_name": service,
            "method_name": method,
            "interceptors": [AuthValidatorInterceptor()],
            "request_type": empty_pb2.Empty,
            "response_type": empty_pb2.Empty,
        }

    # superuser
    _, super_token = generate_user(is_superuser=True)
    # normal user
    _, normal_token = generate_user()
    # jailed user
    _, jailed_token = generate_user(accepted_tos=0)
    # open user
    open_token = ""

    # pick some rpcs here with the right auth levels
    open_args = gen_args("org.couchers.resources.Resources", "GetTermsOfService")
    jailed_args = gen_args("org.couchers.jail.Jail", "JailInfo")
    secure_args = gen_args("org.couchers.api.account.Account", "GetAccountInfo")
    admin_args = gen_args("org.couchers.admin.Admin", "GetUserDetails")

    # pairs to check
    checks = [
        # name, args, token, works?, code, message
        # open token only works on open servicers
        ("open x open", open_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x jailed", open_token, jailed_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x secure", open_token, secure_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x admin", open_token, admin_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        # jailed works on jailed and open
        ("jailed x open", jailed_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("jailed x jailed", jailed_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("jailed x secure", jailed_token, secure_args, False, grpc.StatusCode.UNAUTHENTICATED, "Permission denied"),
        ("jailed x admin", jailed_token, admin_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        # normal works on all but admin
        ("normal x open", normal_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("normal x jailed", normal_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("normal x secure", normal_token, secure_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("normal x admin", normal_token, admin_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        # superuser works on all
        ("super x open", super_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("super x jailed", super_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("super x secure", super_token, secure_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("super x admin", super_token, admin_args, True, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
    ]

    for name, token, args, should_work, code, message in checks:
        print(f"Testing (token x args) = ({name}), {should_work=}")
        metadata = (("cookie", f"couchers-sesh={token}"),)
        with interceptor_dummy_api(**args) as call_rpc:
            if should_work:
                call_rpc(empty_pb2.Empty(), metadata=metadata)
            else:
                with pytest.raises(grpc.RpcError) as e:
                    call_rpc(empty_pb2.Empty(), metadata=metadata)
                assert e.value.code() == code
                assert e.value.details() == message

    # a non-existent RPC
    nonexistent = gen_args("org.couchers.nonexistent.NA", "GetNothing")

    with interceptor_dummy_api(**nonexistent) as call_rpc:
        with pytest.raises(Exception) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.UNIMPLEMENTED
        assert e.value.details() == "API call does not exist. Please refresh and try again."

    # an RPC without a service level
    invalid_args = gen_args("org.couchers.media.Media", "UploadConfirmation")

    with interceptor_dummy_api(**invalid_args) as call_rpc:
        with pytest.raises(Exception) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == "Internal authentication error."
