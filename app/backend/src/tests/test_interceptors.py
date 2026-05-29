from collections.abc import Callable, Generator
from concurrent import futures
from contextlib import contextmanager
from datetime import timedelta
from typing import Any
from unittest.mock import Mock, patch

import grpc
import pytest
from google.protobuf import empty_pb2
from google.protobuf.descriptor import ServiceDescriptor
from google.protobuf.descriptor_pool import DescriptorPool
from sqlalchemy import select, update

from couchers.constants import (
    MISSING_AUTH_LEVEL_ERROR_MESSAGE,
    NONEXISTENT_API_CALL_ERROR_MESSAGE,
    UNKNOWN_ERROR_MESSAGE,
)
from couchers.crypto import b64encode, random_hex, simple_encrypt
from couchers.db import session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.interceptors import (
    AbortError,
    BadHeaders,
    CouchersMiddlewareInterceptor,
    ErrorSanitizationInterceptor,
    UserAuthInfo,
    check_permissions,
    find_auth_level,
    parse_headers,
    validate_auth_level,
)
from couchers.metrics import servicer_duration_histogram, servicer_setup_errors_counter
from couchers.models import APICall, User, UserActivity, UserSession
from couchers.proto import account_pb2, admin_pb2, annotations_pb2, api_pb2, auth_pb2
from couchers.servicers.account import Account
from couchers.servicers.api import API
from couchers.utils import generate_sofa_cookie, now, parse_sofa_cookie
from tests.fixtures.db import generate_user
from tests.fixtures.sessions import real_admin_session


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


@contextmanager
def interceptor_dummy_api(
    rpc,
    interceptors,
    service_name="org.couchers.auth.Auth",
    method_name="SignupFlow",
    request_type=empty_pb2.Empty,
    response_type=empty_pb2.Empty,
    creds=None,
) -> Generator[Callable[..., Any]]:
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
                yield channel.unary_unary(
                    f"/{service_name}/{method_name}",
                    request_serializer=request_type.SerializeToString,
                    response_deserializer=response_type.FromString,
                )
        finally:
            server.stop(None).wait()


def _get_histogram_labels_value(method, logged_in, exception, code):
    metrics = servicer_duration_histogram.collect()
    servicer_histogram = [m for m in metrics if m.name == "couchers_servicer_duration_seconds"][0]
    histogram_counts = [
        s
        for s in servicer_histogram.samples
        if s.name == "couchers_servicer_duration_seconds_count"
        and s.labels["method"] == method
        and s.labels["logged_in"] == logged_in
        and s.labels["code"] == code
        and s.labels["exception"] == exception
    ]
    if len(histogram_counts) == 0:
        return 0
    return histogram_counts[0].value


def _get_setup_errors_value(method, exception):
    metrics = servicer_setup_errors_counter.collect()
    counter = [m for m in metrics if m.name == "couchers_servicer_setup_errors"][0]
    samples = [
        s
        for s in counter.samples
        if s.name == "couchers_servicer_setup_errors_total"
        and s.labels["method"] == method
        and s.labels["exception"] == exception
    ]
    if len(samples) == 0:
        return 0
    return samples[0].value


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
            context.abort(status_code, message)  # noqa: B023

        with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
            with pytest.raises(grpc.RpcError) as e:
                call_rpc(empty_pb2.Empty())
            assert e.value.code() == status_code
            assert e.value.details() == message


def test_logging_interceptor_assertion():
    def TestRpc(request, context):
        raise AssertionError()

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == "An unknown backend error occurred. Please consider filing a bug!"


def test_logging_interceptor_div0():
    def TestRpc(request, context):
        1 / 0  # noqa: B018

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == "An unknown backend error occurred. Please consider filing a bug!"


def test_logging_interceptor_raise():
    def TestRpc(request, context):
        raise Exception()

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == "An unknown backend error occurred. Please consider filing a bug!"


def test_logging_interceptor_raise_custom():
    class _TestingException(Exception):
        pass

    def TestRpc(request, context):
        raise _TestingException("This is a custom exception")

    with interceptor_dummy_api(TestRpc, interceptors=[ErrorSanitizationInterceptor()]) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == "An unknown backend error occurred. Please consider filing a bug!"


def test_tracing_interceptor_ok_open(db):
    val = _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "", "")

    def TestRpc(request, context, session):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[CouchersMiddlewareInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty())

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/org.couchers.auth.Auth/SignupFlow"
        assert not trace.status_code
        assert not trace.user_id
        assert trace.request is not None
        assert len(trace.request) == 0
        assert trace.response is not None
        assert len(trace.response) == 0
        assert not trace.traceback

    assert _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "", "") == val + 1


def test_tracing_interceptor_sensitive(db):
    val = _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "", "")

    def TestRpc(request, context, session):
        return auth_pb2.AuthReq(user="this is not secret", password="this is secret")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[CouchersMiddlewareInterceptor()],
        request_type=auth_pb2.SignupFlowReq,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        call_rpc(
            auth_pb2.SignupFlowReq(account=auth_pb2.SignupAccount(password="should be removed", username="not removed"))
        )

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/org.couchers.auth.Auth/SignupFlow"
        assert not trace.status_code
        assert not trace.user_id
        assert not trace.traceback
        assert trace.request is not None
        req = auth_pb2.SignupFlowReq.FromString(trace.request)
        assert not req.account.password
        assert req.account.username == "not removed"
        assert trace.response
        res = auth_pb2.AuthReq.FromString(trace.response)
        assert res.user == "this is not secret"
        assert not res.password

    assert _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "", "") == val + 1


def test_tracing_interceptor_sensitive_ping(db):
    user, token = generate_user()

    with interceptor_dummy_api(
        API().GetUser,
        interceptors=[CouchersMiddlewareInterceptor()],
        request_type=api_pb2.GetUserReq,
        response_type=api_pb2.User,
        service_name="org.couchers.api.core.API",
        method_name="GetUser",
    ) as call_rpc:
        call_rpc(api_pb2.GetUserReq(user=user.username), metadata=(("cookie", f"couchers-sesh={token}"),))


def test_tracing_interceptor_exception(db):
    val = _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "Exception", "")

    def TestRpc(request, context, session):
        raise Exception("Some error message")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[CouchersMiddlewareInterceptor()],
        request_type=auth_pb2.SignupAccount,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        with pytest.raises(Exception, match="Some error message"):
            call_rpc(auth_pb2.SignupAccount(password="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/org.couchers.auth.Auth/SignupFlow"
        assert not trace.status_code
        assert not trace.user_id
        assert trace.traceback
        assert "Some error message" in trace.traceback
        assert trace.request is not None
        req = auth_pb2.SignupAccount.FromString(trace.request)
        assert not req.password
        assert req.username == "not removed"
        assert not trace.response

    assert _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "Exception", "") == val + 1


def test_setup_phase_exception_observed(db):
    method = "/org.couchers.auth.Auth/SignupFlow"
    val = _get_setup_errors_value(method, "ValueError")

    def TestRpc(request, context, session):
        return empty_pb2.Empty()

    with (
        patch("couchers.interceptors.LocalizationContext", side_effect=ValueError("expected only letters")),
        patch("couchers.interceptors.sentry_sdk") as mock_sentry,
        interceptor_dummy_api(TestRpc, interceptors=[CouchersMiddlewareInterceptor()]) as call_rpc,
    ):
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.INTERNAL
        assert e.value.details() == UNKNOWN_ERROR_MESSAGE
        mock_sentry.capture_exception.assert_called_once()

    assert _get_setup_errors_value(method, "ValueError") == val + 1


def test_tracing_interceptor_abort(db):
    val = _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "Exception", "FAILED_PRECONDITION")

    def TestRpc(request, context, session):
        context.abort(grpc.StatusCode.FAILED_PRECONDITION, "now a grpc abort")

    with interceptor_dummy_api(
        TestRpc,
        interceptors=[CouchersMiddlewareInterceptor()],
        request_type=auth_pb2.SignupAccount,
        response_type=auth_pb2.AuthReq,
    ) as call_rpc:
        with pytest.raises(Exception, match="now a grpc abort"):
            call_rpc(auth_pb2.SignupAccount(password="should be removed", username="not removed"))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.method == "/org.couchers.auth.Auth/SignupFlow"
        assert trace.status_code == "FAILED_PRECONDITION"
        assert not trace.user_id
        assert trace.traceback
        assert "now a grpc abort" in trace.traceback
        assert trace.request is not None
        req = auth_pb2.SignupAccount.FromString(trace.request)
        assert not req.password
        assert req.username == "not removed"
        assert not trace.response

    assert (
        _get_histogram_labels_value("/org.couchers.auth.Auth/SignupFlow", "False", "Exception", "FAILED_PRECONDITION")
        == val + 1
    )


def cookie_auth(token: str) -> tuple[str, str]:
    return "cookie", f"couchers-sesh={token}"


def api_auth(token: str) -> tuple[str, str]:
    return "authorization", f"Bearer {token}"


def test_auth_interceptor(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()
    deleted_user, deleted_token = generate_user(delete_user=True)

    with real_admin_session(super_token) as api:
        api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=user.username))

    with session_scope() as session:
        api_key = session.execute(select(UserSession.token).where(UserSession.is_api_key)).scalar_one()

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [CouchersMiddlewareInterceptor()],
        "request_type": empty_pb2.Empty,
        "response_type": account_pb2.GetAccountInfoRes,
    }

    # no creds, no-go for secure APIs
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty())
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # can auth with cookie
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res1 = call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))
    assert res1.username == user.username

    with session_scope() as session:
        api_calls = session.execute(select(UserActivity.api_calls).where(UserActivity.user_id == user.id)).scalar_one()
        assert api_calls == 1

    # can't auth with a wrong cookie
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(random_hex(32)),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # can auth with an api key
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res2 = call_rpc(empty_pb2.Empty(), metadata=(api_auth(api_key),))
    assert res2.username == user.username

    with session_scope() as session:
        api_calls = session.execute(select(UserActivity.api_calls).where(UserActivity.user_id == user.id)).scalar_one()
        assert api_calls == 2

    # can't auth with a wrong api key
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(api_auth(random_hex(32)),))
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
            call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token), api_auth(api_key)))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == 'Both "cookie" and "authorization" in request'

    # malformed bearer
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(("authorization", f"bearer {api_key}"),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # Invisible (deleted) user
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(deleted_token),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # Invalid (expired) session
    long_ago = now() - timedelta(weeks=100)
    with session_scope() as session:
        session.execute(update(UserSession).values(last_seen=long_ago).where(UserSession.token == token))

    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # API key token, but session is for session cookie (probably impossible, but...)
    with session_scope() as session:
        session.execute(update(UserSession).values(last_seen=now(), is_api_key=True).where(UserSession.token == token))

    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        with pytest.raises(grpc.RpcError) as e:
            call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))
        assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED
        assert e.value.details() == "Unauthorized"

    # Check that metadata are updated
    six_minutes_ago = now() - timedelta(minutes=6)
    with session_scope() as session:
        # Return the session to normal
        user_session = session.execute(select(UserSession).where(UserSession.token == token)).scalar_one()
        user_session.is_api_key = False
        api_calls = user_session.api_calls

    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res4 = call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))
        assert res4.username == user.username

    with session_scope() as session:
        user_session = session.execute(select(UserSession).where(UserSession.token == token)).scalar_one()
        assert user_session.api_calls == api_calls + 1
        assert user_session.last_seen > now() - timedelta(seconds=1)

        # Simulate user inactivity, so last_active is updated on the next api call.
        session.execute(update(User).values(last_active=six_minutes_ago).where(User.id == user.id))

    # Check that last_active is updated if it wasn't updated in a while.
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))

    with session_scope() as session:
        last_active = session.execute(select(User.last_active).where(User.id == user.id)).scalar_one()
        assert last_active > now() - timedelta(seconds=1)

    # Check that last_active is untouched (since it was already updated recently)
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))

    with session_scope() as session:
        last_active_2 = session.execute(select(User.last_active).where(User.id == user.id)).scalar_one()
        assert last_active_2 == last_active

    # Check that activity is split by IP.
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token), ("x-couchers-real-ip", "1.1.1.1")))

    with session_scope() as session:
        api_calls = session.execute(
            select(UserActivity.api_calls).where(UserActivity.ip_address == "1.1.1.1")
        ).scalar_one()
        assert api_calls == 1

    # Check that activity is split in time bins.
    # Update all UserActivity to be in the far past so that a new row is inserted on the next request.
    with session_scope() as session:
        session.execute(update(UserActivity).values(period=long_ago).where(UserActivity.user_id == user.id))

    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        call_rpc(empty_pb2.Empty(), metadata=(cookie_auth(token),))

    with session_scope() as session:
        api_calls = session.execute(
            select(UserActivity.api_calls)
            .where(UserActivity.user_id == user.id)
            .order_by(UserActivity.id.desc())
            .limit(1)
        ).scalar_one()
        assert api_calls == 1


def test_tracing_interceptor_auth_cookies(db):
    user, token = generate_user()

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [CouchersMiddlewareInterceptor()],
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
        assert trace.request is not None
        assert len(trace.request) == 0
        assert not trace.traceback


def test_tracing_interceptor_auth_api_key(db):
    super_user, super_token = generate_user(is_superuser=True)
    user, token = generate_user()

    with real_admin_session(super_token) as api:
        api.CreateApiKey(admin_pb2.CreateApiKeyReq(user=user.username))

    with session_scope() as session:
        api_key = session.execute(select(UserSession.token).where(UserSession.is_api_key)).scalar_one()

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [CouchersMiddlewareInterceptor()],
        "request_type": empty_pb2.Empty,
        "response_type": account_pb2.GetAccountInfoRes,
    }

    # with api key
    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res1 = call_rpc(empty_pb2.Empty(), metadata=(("authorization", f"Bearer {api_key}"),))
    assert res1.username == user.username

    with session_scope() as session:
        trace = session.execute(
            select(APICall).where(APICall.method == "/org.couchers.api.account.Account/GetAccountInfo")
        ).scalar_one()
        assert trace.method == "/org.couchers.api.account.Account/GetAccountInfo"
        assert not trace.status_code
        assert trace.user_id == user.id
        assert trace.is_api_key
        assert trace.request is not None
        assert len(trace.request) == 0
        assert not trace.traceback


def test_auth_levels(db):
    def TestRpc(request, context, session):
        return empty_pb2.Empty()

    def gen_args(service, method):
        return {
            "rpc": TestRpc,
            "service_name": service,
            "method_name": method,
            "interceptors": [CouchersMiddlewareInterceptor()],
            "request_type": empty_pb2.Empty,
            "response_type": empty_pb2.Empty,
        }

    # superuser (note: superusers are automatically editors due to DB constraint)
    _, super_token = generate_user(is_superuser=True)
    # editor user
    _, editor_token = generate_user(is_editor=True)
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
    editor_args = gen_args("org.couchers.editor.Editor", "CreateCommunity")
    admin_args = gen_args("org.couchers.admin.Admin", "GetUserDetails")

    # pairs to check
    checks = [
        # name, args, token, works?, code, message
        # open token only works on open servicers
        ("open x open", open_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x jailed", open_token, jailed_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x secure", open_token, secure_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x editor", open_token, editor_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("open x admin", open_token, admin_args, False, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        # jailed works on jailed and open
        ("jailed x open", jailed_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("jailed x jailed", jailed_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("jailed x secure", jailed_token, secure_args, False, grpc.StatusCode.UNAUTHENTICATED, "Permission denied"),
        ("jailed x editor", jailed_token, editor_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        ("jailed x admin", jailed_token, admin_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        # normal works on all but editor and admin
        ("normal x open", normal_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("normal x jailed", normal_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("normal x secure", normal_token, secure_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("normal x editor", normal_token, editor_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        ("normal x admin", normal_token, admin_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        # editor works on all but admin
        ("editor x open", editor_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("editor x jailed", editor_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("editor x secure", editor_token, secure_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("editor x editor", editor_token, editor_args, True, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        ("editor x admin", editor_token, admin_args, False, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        # superuser works on all
        ("super x open", super_token, open_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("super x jailed", super_token, jailed_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("super x secure", super_token, secure_args, True, grpc.StatusCode.UNAUTHENTICATED, "Unauthorized"),
        ("super x editor", super_token, editor_args, True, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
        ("super x admin", super_token, admin_args, True, grpc.StatusCode.PERMISSION_DENIED, "Permission denied"),
    ]

    for name, token, args, should_work, code, message in checks:
        print(f"Testing (token x args) = ({name}), {should_work=}")
        metadata = (("cookie", f"couchers-sesh={token}"),)
        with interceptor_dummy_api(**args) as call_rpc:
            if should_work:
                call_rpc(empty_pb2.Empty(), metadata=metadata)
            else:
                with pytest.raises(grpc.RpcError) as err:
                    call_rpc(empty_pb2.Empty(), metadata=metadata)
                assert err.value.code() == code
                assert err.value.details() == message

    # a non-existent RPC
    nonexistent = gen_args("org.couchers.nonexistent.NA", "GetNothing")

    with interceptor_dummy_api(**nonexistent) as call_rpc:
        with pytest.raises(grpc.RpcError) as err:
            call_rpc(empty_pb2.Empty())
        assert err.value.code() == grpc.StatusCode.UNIMPLEMENTED
        assert err.value.details() == "API call does not exist. Please refresh and try again."

    # an RPC without a service level
    invalid_args = gen_args("org.couchers.media.Media", "UploadConfirmation")

    with interceptor_dummy_api(**invalid_args) as call_rpc:
        with pytest.raises(grpc.RpcError) as err:
            call_rpc(empty_pb2.Empty())
        assert err.value.code() == grpc.StatusCode.INTERNAL
        assert err.value.details() == "Internal authentication error."


def test_parse_headers_with_session_cookie():
    headers = {"cookie": "couchers-sesh=abc123; other-cookie=value"}
    result = parse_headers(headers)
    assert result.token == "abc123"
    assert result.is_api_key is False


def test_parse_headers_with_authorization_header():
    headers = {"authorization": "Bearer abc123"}
    result = parse_headers(headers)
    assert result.token == "abc123"
    assert result.is_api_key is True


def test_parse_headers_with_both_cookie_and_authorization():
    headers = {"cookie": "couchers-sesh=abc123", "authorization": "Bearer xyz789"}
    with pytest.raises(BadHeaders, match="Both cookies and authorization are present in headers"):
        parse_headers(headers)


def test_parse_headers_with_neither_cookie_nor_authorization():
    result = parse_headers({})
    assert result.token is None
    assert result.is_api_key is False


def test_parse_headers_with_all_optional_headers():
    headers = {
        "cookie": "couchers-sesh=abc123; couchers-user-id=42; NEXT_LOCALE=en",
        "x-couchers-real-ip": "192.168.1.1",
        "user-agent": "TestAgent/1.0",
    }
    result = parse_headers(headers)
    assert result.token == "abc123"
    assert result.is_api_key is False
    assert result.ip_address == "192.168.1.1"
    assert result.user_agent == "TestAgent/1.0"
    assert result.ui_lang == "en"
    assert result.user_id == "42"


def test_parse_headers_with_bytes_ip_address():
    headers: dict[str, str | bytes] = {
        "cookie": "couchers-sesh=abc123",
        "x-couchers-real-ip": b"192.168.1.1",
    }
    result = parse_headers(headers)
    assert result.ip_address is None


def test_parse_headers_with_bytes_user_agent():
    headers: dict[str, str | bytes] = {
        "cookie": "couchers-sesh=abc123",
        "user-agent": b"TestAgent/1.0",
    }
    result = parse_headers(headers)
    assert result.user_agent is None


def test_parse_headers_malformed_authorization():
    headers = {"authorization": "bearer abc123"}
    result = parse_headers(headers)
    assert result.token is None
    assert result.is_api_key is True


def test_find_auth_level_with_valid_service():
    pool = get_descriptor_pool()

    result = find_auth_level(pool, "/org.couchers.api.core.API/GetUser")
    assert result == annotations_pb2.AUTH_LEVEL_SECURE


def test_find_auth_level_with_nonexistent_service():
    pool = get_descriptor_pool()

    with pytest.raises(AbortError) as exc:
        find_auth_level(pool, "/org.couchers.nonexistent.Service/Method")
    assert exc.value.msg == NONEXISTENT_API_CALL_ERROR_MESSAGE
    assert exc.value.code == grpc.StatusCode.UNIMPLEMENTED


def test_find_auth_level_with_unknown_auth_level():
    pool = Mock(spec=DescriptorPool)
    service_desc = Mock(spec=ServiceDescriptor)
    service_options = Mock()
    service_options.Extensions = {annotations_pb2.auth_level: annotations_pb2.AUTH_LEVEL_UNKNOWN}
    service_desc.GetOptions.return_value = service_options
    pool.FindServiceByName.return_value = service_desc

    with pytest.raises(AbortError) as exc:
        find_auth_level(pool, "/org.couchers.api.core.API/GetUser")
    assert exc.value.msg == MISSING_AUTH_LEVEL_ERROR_MESSAGE
    assert exc.value.code == grpc.StatusCode.INTERNAL


def test_validate_auth_level_with_unknown():
    with pytest.raises(AbortError) as exc:
        validate_auth_level(annotations_pb2.AUTH_LEVEL_UNKNOWN)
    assert exc.value.msg == MISSING_AUTH_LEVEL_ERROR_MESSAGE
    assert exc.value.code == grpc.StatusCode.INTERNAL


def test_validate_auth_level_with_open():
    validate_auth_level(annotations_pb2.AUTH_LEVEL_OPEN)


def test_validate_auth_level_with_jailed():
    validate_auth_level(annotations_pb2.AUTH_LEVEL_JAILED)


def test_validate_auth_level_with_secure():
    validate_auth_level(annotations_pb2.AUTH_LEVEL_SECURE)


def test_validate_auth_level_with_editor():
    validate_auth_level(annotations_pb2.AUTH_LEVEL_EDITOR)


def test_validate_auth_level_with_admin():
    validate_auth_level(annotations_pb2.AUTH_LEVEL_ADMIN)


def test_check_auth_open_service_without_auth():
    check_permissions(None, annotations_pb2.AUTH_LEVEL_OPEN)


def test_check_auth_open_service_with_auth():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=False,
        is_editor=False,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_OPEN)


def test_check_auth_secure_service_without_auth():
    with pytest.raises(AbortError):
        check_permissions(None, annotations_pb2.AUTH_LEVEL_SECURE)


def test_check_auth_secure_service_with_normal_auth():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=False,
        is_editor=False,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_SECURE)


def test_check_auth_secure_service_with_jailed_user():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=True,
        is_editor=False,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    with pytest.raises(AbortError):
        check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_SECURE)


def test_check_auth_jailed_service_with_jailed_user():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=True,
        is_editor=False,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_JAILED)


def test_check_auth_jailed_service_without_auth():
    with pytest.raises(AbortError):
        check_permissions(None, annotations_pb2.AUTH_LEVEL_JAILED)


def test_check_auth_editor_service_without_editor():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=False,
        is_editor=False,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    with pytest.raises(AbortError):
        check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_EDITOR)


def test_check_auth_editor_service_with_editor():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=False,
        is_editor=True,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_EDITOR)


def test_check_auth_admin_service_without_superuser():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=False,
        is_editor=True,
        is_superuser=False,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    with pytest.raises(AbortError):
        check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_ADMIN)


def test_check_auth_admin_service_with_superuser():
    auth_info = UserAuthInfo(
        user_id=1,
        is_jailed=False,
        is_editor=True,
        is_superuser=True,
        token_expiry=now(),
        ui_language_preference="en",
        timezone="Etc/UTC",
        token="abc123",
        is_api_key=False,
    )
    check_permissions(auth_info, annotations_pb2.AUTH_LEVEL_ADMIN)


def test_check_auth_admin_service_without_auth():
    with pytest.raises(AbortError):
        check_permissions(None, annotations_pb2.AUTH_LEVEL_ADMIN)


def test_parse_sofa_cookie_valid():
    sofa_value, cookie_string = generate_sofa_cookie()
    cookie_value = cookie_string.split("=", 1)[1].split(";")[0]

    headers = {"cookie": f"sofa={cookie_value}"}
    result = parse_sofa_cookie(headers)
    assert result == sofa_value


def test_parse_sofa_cookie_missing():
    headers = {"cookie": "other-cookie=value"}
    result = parse_sofa_cookie(headers)
    assert result is None


def test_parse_sofa_cookie_no_cookies():
    headers: dict[str, str] = {}
    result = parse_sofa_cookie(headers)
    assert result is None


def test_parse_sofa_cookie_invalid_base64():
    headers = {"cookie": "sofa=not-valid-base64!!!"}
    result = parse_sofa_cookie(headers)
    assert result is None


def test_parse_sofa_cookie_invalid_encryption():
    headers = {"cookie": f"sofa={b64encode(b'invalid encrypted data')}"}
    result = parse_sofa_cookie(headers)
    assert result is None


def test_parse_sofa_cookie_invalid_proto():
    encrypted = simple_encrypt("sofa_cookie", b"not a valid proto")
    headers = {"cookie": f"sofa={b64encode(encrypted)}"}
    result = parse_sofa_cookie(headers)
    assert result is not None or result is None


def test_generate_sofa_cookie():
    sofa_value, cookie_string = generate_sofa_cookie()

    assert sofa_value
    assert isinstance(sofa_value, str)
    assert len(sofa_value) > 20

    assert "sofa=" in cookie_string
    assert "expires=" in cookie_string.lower()

    cookie_value = cookie_string.split("=", 1)[1].split(";")[0]
    headers = {"cookie": f"sofa={cookie_value}"}
    parsed_value = parse_sofa_cookie(headers)
    assert parsed_value == sofa_value


def test_parse_headers_with_sofa_cookie():
    sofa_value, cookie_string = generate_sofa_cookie()
    cookie_value = cookie_string.split("=", 1)[1].split(";")[0]

    headers = {
        "cookie": f"couchers-sesh=abc123; sofa={cookie_value}",
    }
    result = parse_headers(headers)
    assert result.token == "abc123"
    assert result.sofa == sofa_value


def test_parse_headers_without_sofa_cookie():
    headers = {
        "cookie": "couchers-sesh=abc123",
    }
    result = parse_headers(headers)
    assert result.token == "abc123"
    assert result.sofa is None


def test_sofa_cookie_logged_new(db):
    def TestRpc(request, context, session):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[CouchersMiddlewareInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty())

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.sofa is not None
        assert len(trace.sofa) > 20


def test_sofa_cookie_logged_existing(db):
    sofa_value, cookie_string = generate_sofa_cookie()
    cookie_value = cookie_string.split("=", 1)[1].split(";")[0]

    def TestRpc(request, context, session):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[CouchersMiddlewareInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty(), metadata=(("cookie", f"sofa={cookie_value}"),))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.sofa == sofa_value


def test_sofa_cookie_logged_invalid_generates_new(db):
    def TestRpc(request, context, session):
        return empty_pb2.Empty()

    with interceptor_dummy_api(TestRpc, interceptors=[CouchersMiddlewareInterceptor()]) as call_rpc:
        call_rpc(empty_pb2.Empty(), metadata=(("cookie", "sofa=invalid-cookie-value"),))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.sofa is not None
        assert trace.sofa != "invalid-cookie-value"
        assert len(trace.sofa) > 20


def test_sofa_cookie_with_authenticated_user(db):
    user, token = generate_user()
    sofa_value, cookie_string = generate_sofa_cookie()
    cookie_value = cookie_string.split("=", 1)[1].split(";")[0]

    account = Account()

    rpc_def = {
        "rpc": account.GetAccountInfo,
        "service_name": "org.couchers.api.account.Account",
        "method_name": "GetAccountInfo",
        "interceptors": [CouchersMiddlewareInterceptor()],
        "request_type": empty_pb2.Empty,
        "response_type": account_pb2.GetAccountInfoRes,
    }

    with interceptor_dummy_api(**rpc_def, creds=grpc.local_channel_credentials()) as call_rpc:
        res = call_rpc(empty_pb2.Empty(), metadata=(("cookie", f"couchers-sesh={token}; sofa={cookie_value}"),))
    assert res.username == user.username

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.user_id == user.id
        assert trace.sofa == sofa_value


def test_sofa_cookie_persists_on_exception(db):
    sofa_value, cookie_string = generate_sofa_cookie()
    cookie_value = cookie_string.split("=", 1)[1].split(";")[0]

    def TestRpc(request, context, session):
        raise Exception("Test error")

    with interceptor_dummy_api(TestRpc, interceptors=[CouchersMiddlewareInterceptor()]) as call_rpc:
        with pytest.raises(Exception, match="Test error"):
            call_rpc(empty_pb2.Empty(), metadata=(("cookie", f"sofa={cookie_value}"),))

    with session_scope() as session:
        trace = session.execute(select(APICall)).scalar_one()
        assert trace.sofa == sofa_value
        assert trace.traceback is not None
        assert "Test error" in trace.traceback
