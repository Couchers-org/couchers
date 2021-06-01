import logging
import os
from copy import deepcopy
from time import perf_counter_ns
from traceback import format_exception

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import APICall
from couchers.utils import parse_session_cookie
from pb import annotations_pb2

LOG_VERBOSE_PB = "LOG_VERBOSE_PB" in os.environ

logger = logging.getLogger(__name__)


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

    def __init__(self, get_session_for_token, allow_jailed=True):
        self._get_session_for_token = get_session_for_token
        self._allow_jailed = allow_jailed

    def intercept_service(self, continuation, handler_call_details):
        token = parse_session_cookie(dict(handler_call_details.invocation_metadata))

        if not token:
            return unauthenticated_handler()

        # None or (user_id, jailed)
        res = self._get_session_for_token(token=token)

        if not res:
            return unauthenticated_handler()

        user_id, jailed = res

        if not self._allow_jailed and jailed:
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
            except Exception as e:
                finished = perf_counter_ns()
                duration = (finished - start) / 1e6  # ms
                code = None
                # need a funky condition variable here, just in case
                with context._state.condition:
                    if context._state.code is not None:
                        code = context._state.code.name
                traceback = "".join(format_exception(type(e), e, e.__traceback__))
                user_id = getattr(context, "user_id", None)
                self._store_log(method, code, duration, user_id, request, None, traceback)
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
                # need a funky condition variable here, just in case
                with context._state.condition:
                    code = context._state.code
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
