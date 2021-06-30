import logging
import os
from copy import deepcopy
from time import perf_counter_ns
from traceback import format_exception

import grpc
import sentry_sdk
from sqlalchemy.sql import func

from couchers import errors
from couchers.db import session_scope
from couchers.descriptor_pool import get_descriptor_pool
from couchers.metrics import servicer_duration_histogram
from couchers.models import APICall, User, UserSession
from couchers.utils import parse_session_cookie
from proto import annotations_pb2

LOG_VERBOSE_PB = "LOG_VERBOSE_PB" in os.environ

logger = logging.getLogger(__name__)


def _try_get_and_update_user_details(token):
    """
    Tries to get session and user info corresponding to this token.

    Also updates the user last active time, token last active time, and increments API call count.
    """
    if not token:
        return None

    with session_scope() as session:
        result = (
            session.query(User, UserSession)
            .join(User, User.id == UserSession.user_id)
            .filter(UserSession.token == token)
            .filter(UserSession.is_valid)
            .one_or_none()
        )

        if not result:
            return None
        else:
            user, user_session = result

            # update user last active time
            user.last_active = func.now()

            # let's update the token
            user_session.last_seen = func.now()
            user_session.api_calls += 1
            session.flush()

            return user.id, user.is_jailed


def unauthenticated_handler(message="Unauthorized"):
    def f(request, context):
        context.abort(grpc.StatusCode.UNAUTHENTICATED, message)

    return grpc.unary_unary_rpc_method_handler(f)


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

        service_options = self._pool.FindServiceByName(service_name).GetOptions()
        auth_level = service_options.Extensions[annotations_pb2.auth_level]

        # if unknown auth level, then it wasn't set and something's wrong
        if auth_level == annotations_pb2.AUTH_LEVEL_UNKNOWN:
            raise Exception("Service not annotated with auth_level")

        assert auth_level in [
            annotations_pb2.AUTH_LEVEL_OPEN,
            annotations_pb2.AUTH_LEVEL_JAILED,
            annotations_pb2.AUTH_LEVEL_SECURE,
        ]

        token = parse_session_cookie(dict(handler_call_details.invocation_metadata))

        res = _try_get_and_update_user_details(token)

        # if no session was found and this isn't an open service, fail
        if not token or not res:
            if auth_level != annotations_pb2.AUTH_LEVEL_OPEN:
                return unauthenticated_handler()
            user_id = None
        else:
            # a valid user session was found
            user_id, is_jailed = res

            # if the user is jailed and this is isn't an open or jailed service, fail
            if is_jailed and auth_level not in [annotations_pb2.AUTH_LEVEL_OPEN, annotations_pb2.AUTH_LEVEL_JAILED]:
                return unauthenticated_handler("Permission denied")

        handler = continuation(handler_call_details)
        user_aware_function = handler.unary_unary

        def user_unaware_function(req, context):
            context.user_id = user_id
            context.token = token
            return user_aware_function(req, context)

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

        if "authorization" not in metadata:
            return unauthenticated_handler()

        authorization = metadata["authorization"]
        if not authorization.startswith("Bearer "):
            return unauthenticated_handler()

        if not self._is_authorized(token=authorization[7:]):
            return unauthenticated_handler()

        return continuation(handler_call_details)


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
        for name, descriptor in new_proto.DESCRIPTOR.fields_by_name.items():
            if descriptor.GetOptions().Extensions[annotations_pb2.sensitive]:
                new_proto.ClearField(name)
        return new_proto.SerializeToString()

    def _observe_in_histogram(self, method, status_code, exception_type, duration):
        servicer_duration_histogram.labels(method, status_code, exception_type).observe(duration)

    def _store_log(self, method, status_code, duration, user_id, request, response, traceback):
        req_bytes = self._sanitized_bytes(request)
        res_bytes = self._sanitized_bytes(response)
        with session_scope() as session:
            session.add(
                APICall(
                    method=method,
                    status_code=status_code,
                    duration=duration,
                    user_id=user_id,
                    request=req_bytes,
                    response=res_bytes,
                    traceback=traceback,
                )
            )
        logger.debug(f"{user_id=}, {method=}, {duration=} ms")

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary
        method = handler_call_details.method

        def tracing_function(request, context):
            try:
                start = perf_counter_ns()
                res = prev_func(request, context)
                finished = perf_counter_ns()
                duration = (finished - start) / 1e6  # ms
                user_id = getattr(context, "user_id", None)
                self._store_log(method, None, duration, user_id, request, res, None)
                self._observe_in_histogram(method, "", "", duration)
            except Exception as e:
                finished = perf_counter_ns()
                duration = (finished - start) / 1e6  # ms
                code = getattr(context.code(), "name", None)
                traceback = "".join(format_exception(type(e), e, e.__traceback__))
                user_id = getattr(context, "user_id", None)
                self._store_log(method, code, duration, user_id, request, None, traceback)
                self._observe_in_histogram(method, code or "", type(e).__name__, duration)

                if code not in (grpc.StatusCode.NOT_FOUND, grpc.StatusCode.UNAUTHENTICATED):
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
                    logger.info(f"Probably an unknown error! Sanitizing...")
                    context.abort(grpc.StatusCode.INTERNAL, errors.UNKNOWN_ERROR)
                else:
                    logger.error(f"RPC error: {code}")
                    raise e
            return res

        return grpc.unary_unary_rpc_method_handler(
            sanitizing_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )
