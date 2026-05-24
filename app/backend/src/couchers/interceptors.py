import logging
from collections.abc import Callable, Mapping
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from os import getpid
from threading import get_ident
from time import perf_counter_ns
from traceback import format_exception
from typing import Any, NoReturn, cast, overload
from zoneinfo import ZoneInfo

import grpc
import sentry_sdk
from google.protobuf.descriptor import ServiceDescriptor
from google.protobuf.descriptor_pool import DescriptorPool
from google.protobuf.message import Message
from opentelemetry import trace
from sqlalchemy import Function, literal_column, select
from sqlalchemy.sql import and_, func

from couchers.base_url_override import use_base_url_override_for_user
from couchers.constants import (
    CALL_CANCELLED_ERROR_MESSAGE,
    COOKIES_AND_AUTH_HEADER_ERROR_MESSAGE,
    MISSING_AUTH_LEVEL_ERROR_MESSAGE,
    NONEXISTENT_API_CALL_ERROR_MESSAGE,
    PERMISSION_DENIED_ERROR_MESSAGE,
    UNAUTHORIZED_ERROR_MESSAGE,
    UNKNOWN_ERROR_MESSAGE,
)
from couchers.context import CouchersContext, make_interactive_context, make_media_context
from couchers.db import session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.i18n import LocalizationContext
from couchers.i18n.locales import DEFAULT_LOCALE
from couchers.metrics import observe_in_servicer_duration_histogram
from couchers.models import APICall, User, UserActivity, UserSession
from couchers.proto import annotations_pb2
from couchers.proto.annotations_pb2 import AuthLevel
from couchers.utils import (
    create_lang_cookie,
    create_session_cookies,
    generate_sofa_cookie,
    now,
    parse_api_key,
    parse_session_cookie,
    parse_sofa_cookie,
    parse_ui_lang_cookie,
    parse_user_id_cookie,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True, kw_only=True)
class UserAuthInfo:
    """Information about an authenticated user session."""

    user_id: int
    is_jailed: bool
    is_editor: bool
    is_superuser: bool
    token_expiry: datetime
    ui_language_preference: str | None
    timezone: str | None
    token: str = field(repr=False)
    is_api_key: bool


def _binned_now() -> Function[Any]:
    return func.date_bin(
        literal_column("interval '1 hour'"),
        func.now(),
        literal_column("'2000-01-01'::timestamptz"),
    )


def _try_get_and_update_user_details(
    token: str | None, is_api_key: bool, ip_address: str | None, user_agent: str | None
) -> UserAuthInfo | None:
    """
    Tries to get session and user info corresponding to this token.

    Also updates the user's last active time, token last active time, and increments API call count.

    Returns UserAuthInfo if a valid session is found, None otherwise.
    """
    if not token:
        return None

    with session_scope() as session:
        result = session.execute(
            select(User, UserSession, UserActivity)
            .select_from(UserSession)
            .join(User, User.id == UserSession.user_id)
            .outerjoin(
                UserActivity,
                and_(
                    UserActivity.user_id == User.id,
                    UserActivity.period == _binned_now(),
                    UserActivity.ip_address == ip_address,
                    UserActivity.user_agent == user_agent,
                ),
            )
            .where(User.is_visible)
            .where(UserSession.token == token)
            .where(UserSession.is_valid)
            .where(UserSession.is_api_key == is_api_key)
        ).one_or_none()

        if not result:
            return None

        user, user_session, user_activity = result._tuple()

        # update user last active time if it's been a while
        if now() - user.last_active > timedelta(minutes=5):
            user.last_active = func.now()

        # let's update the token
        user_session.last_seen = func.now()
        user_session.api_calls += 1

        if user_activity:
            user_activity.api_calls += 1
        else:
            session.add(
                UserActivity(
                    user_id=user.id,
                    period=_binned_now(),
                    ip_address=ip_address,
                    user_agent=user_agent,
                    api_calls=1,
                )
            )

        session.commit()

        return UserAuthInfo(
            user_id=user.id,
            is_jailed=user.is_jailed,
            is_editor=user.is_editor,
            is_superuser=user.is_superuser,
            token_expiry=user_session.expiry,
            ui_language_preference=user.ui_language_preference,
            timezone=user.timezone,
            token=token,
            is_api_key=is_api_key,
        )


def abort_handler[T, R](
    message: str,
    status_code: grpc.StatusCode,
) -> grpc.RpcMethodHandler[T, R]:
    def f(request: Any, context: CouchersContext) -> NoReturn:
        context.abort(status_code, message)

    return grpc.unary_unary_rpc_method_handler(f)


def unauthenticated_handler[T, R](
    message: str = UNAUTHORIZED_ERROR_MESSAGE,
    status_code: grpc.StatusCode = grpc.StatusCode.UNAUTHENTICATED,
) -> grpc.RpcMethodHandler[T, R]:
    return abort_handler(message, status_code)


@overload
def _sanitized_bytes(proto: Message) -> bytes: ...
@overload
def _sanitized_bytes(proto: None) -> None: ...
def _sanitized_bytes(proto: Message | None) -> bytes | None:
    """
    Remove fields marked sensitive and return serialized bytes
    """
    if not proto:
        return None

    new_proto = deepcopy(proto)

    def _sanitize_message(message: Message) -> None:
        for name, descriptor in message.DESCRIPTOR.fields_by_name.items():
            if descriptor.GetOptions().Extensions[annotations_pb2.sensitive]:
                message.ClearField(name)
            if descriptor.message_type:
                submessage = getattr(message, name)
                if not submessage:
                    continue
                if descriptor.is_repeated:
                    for msg in submessage:
                        _sanitize_message(msg)
                else:
                    _sanitize_message(submessage)

    _sanitize_message(new_proto)

    return new_proto.SerializeToString()


def _store_log(
    *,
    method: str,
    status_code: str | None = None,
    duration: float,
    user_id: int | None,
    is_api_key: bool,
    request: Message,
    response: Message | None,
    traceback: str | None = None,
    perf_report: str | None = None,
    ip_address: str | None,
    user_agent: str | None,
    sofa: str | None,
) -> None:
    req_bytes = _sanitized_bytes(request)
    res_bytes = _sanitized_bytes(response)
    with session_scope() as session:
        response_truncated = False
        truncate_res_bytes_length = 16 * 1024  # 16 kB
        if res_bytes and len(res_bytes) > truncate_res_bytes_length:
            res_bytes = res_bytes[:truncate_res_bytes_length]
            response_truncated = True
        session.add(
            APICall(
                is_api_key=is_api_key,
                method=method,
                status_code=status_code,
                duration=duration,
                user_id=user_id,
                request=req_bytes,
                response=res_bytes,
                response_truncated=response_truncated,
                traceback=traceback,
                perf_report=perf_report,
                ip_address=ip_address,
                user_agent=user_agent,
                sofa=sofa,
            )
        )
    logger.debug(f"{user_id=}, {method=}, {duration=} ms")


type Cont[T, R] = Callable[[grpc.HandlerCallDetails], grpc.RpcMethodHandler[T, R] | None]


class CouchersMiddlewareInterceptor(grpc.ServerInterceptor):
    """
    1. Does auth: extracts a session token from a cookie, and authenticates a user with that.

    Sets context.user_id and context.token if authenticated, otherwise
    terminates the call with an UNAUTHENTICATED error code.

    2. Makes sure cookies are in sync.

    3. Injects a session to get a database transaction.

    4. Measures and logs the time it takes to service each incoming call.
    """

    def __init__(self) -> None:
        self._pool = get_descriptor_pool()

    def intercept_service[T = Message, R = Message](
        self,
        continuation: Cont[T, R],
        handler_call_details: grpc.HandlerCallDetails,
    ) -> grpc.RpcMethodHandler[T, R]:
        start = perf_counter_ns()

        method = handler_call_details.method

        try:
            auth_level = find_auth_level(self._pool, method)
        except AbortError as ae:
            return abort_handler(ae.msg, ae.code)

        try:
            headers = parse_headers(dict(handler_call_details.invocation_metadata))
        except BadHeaders:
            return unauthenticated_handler(COOKIES_AND_AUTH_HEADER_ERROR_MESSAGE)

        auth_info = _try_get_and_update_user_details(
            headers.token, headers.is_api_key, headers.ip_address, headers.user_agent
        )

        try:
            check_permissions(auth_info, auth_level)
        except AbortError as ae:
            return unauthenticated_handler(ae.msg, ae.code)

        if not (handler := continuation(handler_call_details)):
            raise RuntimeError(f"No handler in '{method}'")

        if not (prev_function := handler.unary_unary):
            raise RuntimeError(f"No prev_function in '{method}', {handler}")

        if headers.sofa:
            sofa = headers.sofa
            new_sofa_cookie = None
        else:
            sofa, new_sofa_cookie = generate_sofa_cookie()

        loc_context = LocalizationContext(
            locale=(auth_info.ui_language_preference if auth_info else headers.ui_lang) or DEFAULT_LOCALE,
            timezone=ZoneInfo((auth_info and auth_info.timezone) or "Etc/UTC"),
        )

        def function_without_couchers_stuff(req: Message, grpc_context: grpc.ServicerContext) -> Message | None:
            couchers_context = make_interactive_context(
                grpc_context=grpc_context,
                user_id=auth_info.user_id if auth_info else None,
                is_api_key=auth_info.is_api_key if auth_info else False,
                token=auth_info.token if auth_info else None,
                localization=loc_context,
                sofa=sofa,
            )

            with session_scope() as session:
                try:
                    with use_base_url_override_for_user(session, auth_info.user_id if auth_info else None):
                        _res = prev_function(req, couchers_context, session)  # type: ignore[call-arg, arg-type]
                    res = cast(Message, _res)
                    finished = perf_counter_ns()
                    duration = (finished - start) / 1e6  # ms
                    _store_log(
                        method=method,
                        duration=duration,
                        user_id=couchers_context._user_id,
                        is_api_key=cast(bool, couchers_context._is_api_key),
                        request=req,
                        response=res,
                        ip_address=headers.ip_address,
                        user_agent=headers.user_agent,
                        sofa=sofa,
                    )
                    observe_in_servicer_duration_histogram(method, couchers_context._user_id, "", "", duration / 1000)
                except Exception as e:
                    finished = perf_counter_ns()
                    duration = (finished - start) / 1e6  # ms

                    if couchers_context._grpc_context:
                        context_code = couchers_context._grpc_context.code()  # type: ignore[attr-defined]
                        code = getattr(context_code, "name", None)
                    else:
                        code = None

                    traceback = "".join(format_exception(type(e), e, e.__traceback__))
                    _store_log(
                        method=method,
                        status_code=code,
                        duration=duration,
                        user_id=couchers_context._user_id,
                        is_api_key=cast(bool, couchers_context._is_api_key),
                        request=req,
                        response=None,
                        traceback=traceback,
                        ip_address=headers.ip_address,
                        user_agent=headers.user_agent,
                        sofa=sofa,
                    )
                    observe_in_servicer_duration_histogram(
                        method, couchers_context._user_id, code or "", type(e).__name__, duration / 1000
                    )

                    if not code:
                        sentry_sdk.set_tag("context", "servicer")
                        sentry_sdk.set_tag("method", method)
                        sentry_sdk.capture_exception(e)

                    raise e

            if auth_info and not auth_info.is_api_key:
                # check the two cookies are in sync & that language preference cookie is correct
                if headers.user_id != str(auth_info.user_id):
                    couchers_context.set_cookies(
                        create_session_cookies(auth_info.token, auth_info.user_id, auth_info.token_expiry)
                    )
                if auth_info.ui_language_preference and auth_info.ui_language_preference != headers.ui_lang:
                    couchers_context.set_cookies(create_lang_cookie(auth_info.ui_language_preference))

            if new_sofa_cookie:
                couchers_context.set_cookies([new_sofa_cookie])

            if not grpc_context.is_active():
                grpc_context.abort(grpc.StatusCode.INTERNAL, CALL_CANCELLED_ERROR_MESSAGE)

            couchers_context._send_cookies()

            return res

        return grpc.unary_unary_rpc_method_handler(
            function_without_couchers_stuff,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class CouchersHeaders:
    token: str | None = field(repr=False)
    is_api_key: bool
    ip_address: str | None
    user_agent: str | None
    ui_lang: str | None
    user_id: str | None
    sofa: str | None


def parse_headers(headers: Mapping[str, str | bytes]) -> CouchersHeaders:
    if "cookie" in headers and "authorization" in headers:
        # for security reasons, only one of "cookie" or "authorization" can be present
        raise BadHeaders("Both cookies and authorization are present in headers")
    elif "cookie" in headers:
        # the session token is passed in cookies, i.e., in the `cookie` header
        token, is_api_key = parse_session_cookie(headers), False
    elif "authorization" in headers:
        # the session token is passed in the `authorization` header
        token, is_api_key = parse_api_key(headers), True
    else:
        # no session found
        token, is_api_key = None, False

    ip_address = headers.get("x-couchers-real-ip")
    user_agent = headers.get("user-agent")

    ui_lang = parse_ui_lang_cookie(headers)
    user_id = parse_user_id_cookie(headers)
    sofa = parse_sofa_cookie(headers)

    return CouchersHeaders(
        token=token,
        is_api_key=is_api_key,
        ip_address=ip_address if isinstance(ip_address, str) else None,
        user_agent=user_agent if isinstance(user_agent, str) else None,
        ui_lang=ui_lang,
        user_id=user_id,
        sofa=sofa,
    )


class BadHeaders(Exception):
    pass


class AbortError(Exception):
    def __init__(self, msg: str, code: grpc.StatusCode):
        self.msg = msg
        self.code = code


def find_auth_level(pool: DescriptorPool, method: str) -> AuthLevel.ValueType:
    # method is of the form "/org.couchers.api.core.API/GetUser"
    _, service_name, method_name = method.split("/")

    try:
        service: ServiceDescriptor = pool.FindServiceByName(service_name)  # type: ignore[no-untyped-call]
        service_options = service.GetOptions()
    except KeyError:
        raise AbortError(NONEXISTENT_API_CALL_ERROR_MESSAGE, grpc.StatusCode.UNIMPLEMENTED) from None

    level = service_options.Extensions[annotations_pb2.auth_level]

    validate_auth_level(level)

    return level


def validate_auth_level(auth_level: AuthLevel.ValueType) -> None:
    # if unknown auth level, then it wasn't set and something's wrong
    if auth_level == annotations_pb2.AUTH_LEVEL_UNKNOWN:
        raise AbortError(MISSING_AUTH_LEVEL_ERROR_MESSAGE, grpc.StatusCode.INTERNAL)

    if auth_level not in {
        annotations_pb2.AUTH_LEVEL_OPEN,
        annotations_pb2.AUTH_LEVEL_JAILED,
        annotations_pb2.AUTH_LEVEL_SECURE,
        annotations_pb2.AUTH_LEVEL_EDITOR,
        annotations_pb2.AUTH_LEVEL_ADMIN,
    }:
        raise AbortError(MISSING_AUTH_LEVEL_ERROR_MESSAGE, grpc.StatusCode.INTERNAL)


def check_permissions(auth_info: UserAuthInfo | None, auth_level: AuthLevel.ValueType) -> None:
    if not auth_info:
        # if this isn't an open service, fail
        if auth_level != annotations_pb2.AUTH_LEVEL_OPEN:
            raise AbortError(UNAUTHORIZED_ERROR_MESSAGE, grpc.StatusCode.UNAUTHENTICATED)
    else:
        # a valid user session was found - check permissions
        if auth_level == annotations_pb2.AUTH_LEVEL_ADMIN and not auth_info.is_superuser:
            raise AbortError(PERMISSION_DENIED_ERROR_MESSAGE, grpc.StatusCode.PERMISSION_DENIED)

        if auth_level == annotations_pb2.AUTH_LEVEL_EDITOR and not auth_info.is_editor:
            raise AbortError(PERMISSION_DENIED_ERROR_MESSAGE, grpc.StatusCode.PERMISSION_DENIED)

        # if the user is jailed and this isn't an open or jailed service, fail
        if auth_info.is_jailed and auth_level not in [
            annotations_pb2.AUTH_LEVEL_OPEN,
            annotations_pb2.AUTH_LEVEL_JAILED,
        ]:
            raise AbortError(PERMISSION_DENIED_ERROR_MESSAGE, grpc.StatusCode.UNAUTHENTICATED)


class MediaInterceptor(grpc.ServerInterceptor):
    """
    Extracts an "Authorization: Bearer <hex>" header and calls the
    is_authorized function. Terminates the call with an HTTP error
    code if not authorized.

    Also adds a session to called APIs.
    """

    def __init__(self, is_authorized: Callable[[str], bool]):
        self._is_authorized = is_authorized

    def intercept_service[T, R](
        self,
        continuation: Cont[T, R],
        handler_call_details: grpc.HandlerCallDetails,
    ) -> grpc.RpcMethodHandler[T, R]:
        handler = continuation(handler_call_details)
        if not handler:
            raise RuntimeError("No handler")

        prev_func = handler.unary_unary
        if not prev_func:
            raise RuntimeError(f"No prev_function, {handler}")

        metadata = dict(handler_call_details.invocation_metadata)

        token = parse_api_key(metadata)

        if not token or not self._is_authorized(token):
            return unauthenticated_handler()

        def function_without_session(request: T, grpc_context: grpc.ServicerContext) -> R:
            with session_scope() as session:
                return prev_func(request, make_media_context(grpc_context), session)  # type: ignore[call-arg, arg-type]

        return grpc.unary_unary_rpc_method_handler(
            function_without_session,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class OTelInterceptor(grpc.ServerInterceptor):
    """
    OpenTelemetry tracing
    """

    def __init__(self) -> None:
        self.tracer = trace.get_tracer(__name__)

    def intercept_service[T, R](
        self,
        continuation: Cont[T, R],
        handler_call_details: grpc.HandlerCallDetails,
    ) -> grpc.RpcMethodHandler[T, R]:
        handler = continuation(handler_call_details)
        if not handler:
            raise RuntimeError("No handler")

        prev_func = handler.unary_unary
        if not prev_func:
            raise RuntimeError(f"No prev_function, {handler}")

        method = handler_call_details.method

        # method is of the form "/org.couchers.api.core.API/GetUser"
        _, service_name, method_name = method.split("/")

        headers = dict(handler_call_details.invocation_metadata)

        def tracing_function(request: T, context: grpc.ServicerContext) -> R:
            with self.tracer.start_as_current_span("handler") as rollspan:
                rollspan.set_attribute("rpc.method_full", method)
                rollspan.set_attribute("rpc.service", service_name)
                rollspan.set_attribute("rpc.method", method_name)

                rollspan.set_attribute("rpc.thread", get_ident())
                rollspan.set_attribute("rpc.pid", getpid())

                res = prev_func(request, context)

                rollspan.set_attribute("web.user_agent", headers.get("user-agent") or "")
                rollspan.set_attribute("web.ip_address", headers.get("x-couchers-real-ip") or "")

            return res

        return grpc.unary_unary_rpc_method_handler(
            tracing_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class ErrorSanitizationInterceptor(grpc.ServerInterceptor):
    """
    If the call resulted in a non-gRPC error, this strips away the error details.

    It's important to put this first, so that it does not interfere with other interceptors.
    """

    def intercept_service[T, R](
        self,
        continuation: Cont[T, R],
        handler_call_details: grpc.HandlerCallDetails,
    ) -> grpc.RpcMethodHandler[T, R]:
        handler = continuation(handler_call_details)
        if not handler:
            raise RuntimeError("No handler")

        prev_func = handler.unary_unary
        if not prev_func:
            raise RuntimeError(f"No prev_function, {handler}")

        def sanitizing_function(req: T, context: grpc.ServicerContext) -> R:
            try:
                res = prev_func(req, context)
            except Exception as e:
                code = context.code()  # type: ignore[attr-defined]
                # the code is one of the RPC error codes if this was failed through abort(), otherwise it's None
                if not code:
                    logger.exception(e)
                    logger.info("Probably an unknown error! Sanitizing...")
                    context.abort(grpc.StatusCode.INTERNAL, UNKNOWN_ERROR_MESSAGE)
                else:
                    logger.warning(f"RPC error: {code} in method {handler_call_details.method}")
                    raise e
            return res

        return grpc.unary_unary_rpc_method_handler(
            sanitizing_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )
