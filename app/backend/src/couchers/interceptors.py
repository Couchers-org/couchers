import logging
import os
from time import perf_counter_ns

import grpc

LOG_VERBOSE_PB = "LOG_VERBOSE_PB" in os.environ

logger = logging.getLogger(__name__)


def unauthenticated_handler():
    def f(request, context):
        context.abort(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

    return grpc.unary_unary_rpc_method_handler(f)


class AuthValidatorInterceptor(grpc.ServerInterceptor):
    """
    Extracts an "Authorization: Bearer <hex>" header and authenticates
    a user. Sets context.user_id if authenticated, otherwise
    terminates the call with an HTTP error code.
    """

    def __init__(self, get_session_for_token):
        self._get_session_for_token = get_session_for_token

    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)

        if "authorization" not in metadata:
            return unauthenticated_handler()

        authorization = metadata["authorization"]
        if not authorization.startswith("Bearer "):
            return unauthenticated_handler()

        user_session = self._get_session_for_token(token=authorization[7:])

        if not user_session:
            return unauthenticated_handler()

        handler = continuation(handler_call_details)
        user_aware_function = handler.unary_unary

        def user_unaware_function(req, context):
            context.user_id = user_session.user_id
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


class LoggingInterceptor(grpc.ServerInterceptor):
    """
    Measures and logs the time it takes to service each incoming call.
    """

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary
        method = handler_call_details.method

        def timetaking_function(request, context):
            if LOG_VERBOSE_PB:
                logger.info(f"Got request: {method}. Request: {request}")
            else:
                logger.info(f"Got request: {method}")
            start = perf_counter_ns()
            res = prev_func(request, context)
            finished = perf_counter_ns()
            duration = (finished - start) / 1e6  # ms
            if LOG_VERBOSE_PB:
                logger.info(f"Finished request (in {duration:0.2f} ms): {method}. Response: {res}")
            else:
                logger.info(f"Finished request (in {duration:0.2f} ms): {method}")
            return res

        return grpc.unary_unary_rpc_method_handler(
            timetaking_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )


class UpdateLastActiveTimeInterceptor(grpc.ServerInterceptor):
    """
    Calls the given update_last_active_time(user_id) function before
    servicing each call.
    """

    def __init__(self, update_last_active_time):
        self._update_last_active_time = update_last_active_time

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary

        def updating_function(req, context):
            self._update_last_active_time(context.user_id)
            return prev_func(req, context)

        return grpc.unary_unary_rpc_method_handler(
            updating_function,
            request_deserializer=handler.request_deserializer,
            response_serializer=handler.response_serializer,
        )
