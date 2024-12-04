import logging
from copy import deepcopy
from datetime import timedelta
from os import getpid
from threading import get_ident
from time import perf_counter_ns
from traceback import format_exception

import grpc
import sentry_sdk
from opentelemetry import trace
from sqlalchemy.sql import and_, func

from couchers import errors
from couchers.db import session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.metrics import observe_in_servicer_duration_histogram
from couchers.models import APICall, User, UserActivity, UserSession
from couchers.sql import couchers_select as select
from couchers.utils import create_session_cookies, now, parse_api_key, parse_session_cookie, parse_user_id_cookie
from proto import annotations_pb2

logger = logging.getLogger(__name__)


def _binned_now():
    return func.date_bin("1 hour", func.now(), "2000-01-01")


def _try_get_and_update_user_details(token, is_api_key, ip_address, user_agent):
    """
    Tries to get session and user info corresponding to this token.

    Also updates the user last active time, token last active time, and increments API call count.
    """
    if not token:
        return None

    with session_scope() as session:
        result = session.execute(
            select(User, UserSession, UserActivity)
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
        else:
            user, user_session, user_activity = result

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

            return user.id, user.is_jailed, user.is_superuser, user_session.expiry


def abort_handler(message, status_code):
    def f(request, context):
        context.abort(status_code, message)

    return grpc.unary_unary_rpc_method_handler(f)


def unauthenticated_handler(message="Unauthorized", status_code=grpc.StatusCode.UNAUTHENTICATED):
    return abort_handler(message, status_code)


class AuthValidatorInterceptor(grpc.ServerInterceptor):
    """
    Extracts a session token from a cookie, and authenticates a user with that.

    Sets context.user_id and context.token if authenticated, otherwise
    terminates the call with an UNAUTHENTICATED error code.
    """

    def __init__(self):
        self._pool = get_descriptor_pool()

    def intercept_service(self, continuation, handler_call_details):
        method = handler_call_details.method
        # method is of the form "/org.couchers.api.core.API/GetUser"
        _, service_name, method_name = method.split("/")

        try:
            service_options = self._pool.FindServiceByName(service_name).GetOptions()
        except KeyError:
            return abort_handler(
                "API call does not exist. Please refresh and try again.", grpc.StatusCode.UNIMPLEMENTED
            )

        auth_level = service_options.Extensions[annotations_pb2.auth_level]

        # if unknown auth level, then it wasn't set and something's wrong
        if auth_level == annotations_pb2.AUTH_LEVEL_UNKNOWN:
            return abort_handler("Internal authentication error.", grpc.StatusCode.INTERNAL)

        assert auth_level in [
            annotations_pb2.AUTH_LEVEL_OPEN,
            annotations_pb2.AUTH_LEVEL_JAILED,
            annotations_pb2.AUTH_LEVEL_SECURE,
            annotations_pb2.AUTH_LEVEL_ADMIN,
        ]

        headers = dict(handler_call_details.invocation_metadata)

        if "cookie" in headers and "authorization" in headers:
            # for security reasons, only one of "cookie" or "authorization" can be present
            return unauthenticated_handler('Both "cookie" and "authorization" in request')
        elif "cookie" in headers:
            # the session token is passed in cookies, i.e. in the `cookie` header
            token, is_api_key = parse_session_cookie(headers), False
        elif "authorization" in headers:
            # the session token is passed in the `authorization` header
            token, is_api_key = parse_api_key(headers), True
        else:
            # no session found
            token, is_api_key = None, False

        ip_address = headers.get("x-couchers-real-ip")
        user_agent = headers.get("user-agent")

        auth_info = _try_get_and_update_user_details(token, is_api_key, ip_address, user_agent)
        # auth_info is now filled if and only if this is a valid session
        if not auth_info:
            token = None
            is_api_key = False
            token_expiry = None
            user_id = None

        # if no session was found and this isn't an open service, fail
        if not auth_info:
            if auth_level != annotations_pb2.AUTH_LEVEL_OPEN:
                return unauthenticated_handler()
        else:
            # a valid user session was found
            user_id, is_jailed, is_superuser, token_expiry = auth_info

            if auth_level == annotations_pb2.AUTH_LEVEL_ADMIN and not is_superuser:
                return unauthenticated_handler("Permission denied", grpc.StatusCode.PERMISSION_DENIED)

            # if the user is jailed and this is isn't an open or jailed service, fail
            if is_jailed and auth_level not in [annotations_pb2.AUTH_LEVEL_OPEN, annotations_pb2.AUTH_LEVEL_JAILED]:
                return unauthenticated_handler("Permission denied")

        handler = continuation(handler_call_details)
        user_aware_function = handler.unary_unary

        def user_unaware_function(req, context):
            context.user_id = user_id
            context.token = (token, token_expiry)
            context.is_api_key = is_api_key
            return user_aware_function(req, context)

        return grpc.unary_unary_rpc_method_handler(
            user_unaware_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class CookieInterceptor(grpc.ServerInterceptor):
    """
    Syncs up the couchers-sesh and couchers-user-id cookies
    """

    def intercept_service(self, continuation, handler_call_details):
        headers = dict(handler_call_details.invocation_metadata)
        cookie_user_id = parse_user_id_cookie(headers)

        handler = continuation(handler_call_details)
        user_aware_function = handler.unary_unary

        def user_unaware_function(req, context):
            res = user_aware_function(req, context)

            # check the two cookies are in sync
            if context.user_id and not context.is_api_key and cookie_user_id != str(context.user_id):
                try:
                    token, expiry = context.token
                    context.send_initial_metadata(
                        [("set-cookie", cookie) for cookie in create_session_cookies(token, context.user_id, expiry)]
                    )
                except ValueError as e:
                    logger.info("Tried to send initial metadata but wasn't allowed to")

            return res

        return grpc.unary_unary_rpc_method_handler(
            user_unaware_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class ManualAuthValidatorInterceptor(grpc.ServerInterceptor):
    """
    Extracts an "Authorization: Bearer <hex>" header and calls the
    is_authorized function. Terminates the call with an HTTP error
    code if not authorized.
    """

    def __init__(self, is_authorized):
        self._is_authorized = is_authorized

    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)

        token = parse_api_key(metadata)

        if not token or not self._is_authorized(token):
            return unauthenticated_handler()

        return continuation(handler_call_details)


class OTelInterceptor(grpc.ServerInterceptor):
    """
    OpenTelemetry tracing
    """

    def __init__(self):
        self.tracer = trace.get_tracer(__name__)

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary
        method = handler_call_details.method

        # method is of the form "/org.couchers.api.core.API/GetUser"
        _, service_name, method_name = method.split("/")

        headers = dict(handler_call_details.invocation_metadata)

        def tracing_function(request, context):
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


class SessionInterceptor(grpc.ServerInterceptor):
    """
    Adds a session from session_scope() as the last argument. This needs to be the last interceptor since it changes the
    function signature by adding another argument.
    """

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary

        def function_without_session(request, context):
            with session_scope() as session:
                return prev_func(request, context, session)

        return grpc.unary_unary_rpc_method_handler(
            function_without_session,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class TracingInterceptor(grpc.ServerInterceptor):
    """
    Measures and logs the time it takes to service each incoming call.
    """

    def _sanitized_bytes(self, proto):
        """
        Remove fields marked sensitive and return serialized bytes
        """
        if not proto:
            return None

        new_proto = deepcopy(proto)

        def _sanitize_message(message):
            for name, descriptor in message.DESCRIPTOR.fields_by_name.items():
                if descriptor.GetOptions().Extensions[annotations_pb2.sensitive]:
                    message.ClearField(name)
                if descriptor.message_type:
                    submessage = getattr(message, name)
                    if not submessage:
                        continue
                    if descriptor.label == descriptor.LABEL_REPEATED:
                        for msg in submessage:
                            _sanitize_message(msg)
                    else:
                        _sanitize_message(submessage)

        _sanitize_message(new_proto)

        return new_proto.SerializeToString()

    def _store_log(
        self,
        method,
        status_code,
        duration,
        user_id,
        is_api_key,
        request,
        response,
        traceback,
        perf_report,
        ip_address,
        user_agent,
    ):
        req_bytes = self._sanitized_bytes(request)
        res_bytes = self._sanitized_bytes(response)
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
                )
            )
        logger.debug(f"{user_id=}, {method=}, {duration=} ms")

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary
        method = handler_call_details.method

        headers = dict(handler_call_details.invocation_metadata)
        ip_address = headers.get("x-couchers-real-ip")
        user_agent = headers.get("user-agent")

        def tracing_function(request, context):
            try:
                start = perf_counter_ns()
                res = prev_func(request, context)
                finished = perf_counter_ns()
                duration = (finished - start) / 1e6  # ms
                user_id = getattr(context, "user_id", None)
                is_api_key = getattr(context, "is_api_key", None)
                self._store_log(
                    method, None, duration, user_id, is_api_key, request, res, None, None, ip_address, user_agent
                )
                observe_in_servicer_duration_histogram(method, user_id, "", "", duration / 1000)
            except Exception as e:
                finished = perf_counter_ns()
                duration = (finished - start) / 1e6  # ms
                code = getattr(context.code(), "name", None)
                traceback = "".join(format_exception(type(e), e, e.__traceback__))
                user_id = getattr(context, "user_id", None)
                is_api_key = getattr(context, "is_api_key", None)
                self._store_log(
                    method, code, duration, user_id, is_api_key, request, None, traceback, None, ip_address, user_agent
                )
                observe_in_servicer_duration_histogram(method, user_id, code or "", type(e).__name__, duration / 1000)

                if not code:
                    sentry_sdk.set_tag("context", "servicer")
                    sentry_sdk.set_tag("method", method)
                    sentry_sdk.capture_exception(e)

                raise e
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

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary

        def sanitizing_function(req, context):
            try:
                res = prev_func(req, context)
            except Exception as e:
                code = context.code()
                # the code is one of the RPC error codes if this was failed through abort(), otherwise it's None
                if not code:
                    logger.exception(e)
                    logger.info("Probably an unknown error! Sanitizing...")
                    context.abort(grpc.StatusCode.INTERNAL, errors.UNKNOWN_ERROR)
                else:
                    logger.warning(f"RPC error: {code} in method {handler_call_details.method}")
                    raise e
            return res

        return grpc.unary_unary_rpc_method_handler(
            sanitizing_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )
