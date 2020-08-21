# Borrows form OpenTracing's python gRPC interceptors, under Apache 2


import logging
import os
from time import perf_counter_ns
from typing import List

import grpc


LOG_VERBOSE_PB = os.environ.get("LOG_VERBOSE_PB", None) is not None

logger = logging.getLogger(__name__)


def aborting_handler(code, reason):
    def f(req, context):
        context.abort(code, reason)

    return grpc.unary_unary_rpc_method_handler(f)


class AuthValidatorInterceptor(grpc.ServerInterceptor):
    def __init__(self, get_user_for_session_token):
        self._get_user_for_session_token = get_user_for_session_token

    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)

        if "authorization" not in metadata:
            return aborting_handler(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        authorization = metadata["authorization"]
        if not authorization.startswith("Bearer "):
            return aborting_handler(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        user_id = self._get_user_for_session_token(token=authorization[7:])

        if not user_id:
            return aborting_handler(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary

        def new_f(req, context):
            context.user_id = user_id
            return prev_func(req, context)

        new_handler = grpc.unary_unary_rpc_method_handler(new_f,
                                                          request_deserializer=handler.request_deserializer,
                                                          response_serializer=handler.response_serializer)

        return new_handler


class ManualAuthValidatorInterceptor(grpc.ServerInterceptor):
    def __init__(self, is_authorized):
        self._is_authorized = is_authorized

    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata)

        if "authorization" not in metadata:
            return aborting_handler(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        authorization = metadata["authorization"]
        if not authorization.startswith("Bearer "):
            return aborting_handler(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        if not self._is_authorized(token=authorization[7:]):
            return aborting_handler(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        return continuation(handler_call_details)


class LoggingInterceptor(grpc.ServerInterceptor):
    def intercept_service(self, continuation, handler_call_details):
        # TODO: implement properly
        return continuation(handler_call_details)

    def intercept_unary(self, request, servicer_context, server_info, handler):
        if LOG_VERBOSE_PB:
            logger.info(f"Got request: {server_info.full_method}. Request: {request}")
        else:
            logger.info(f"Got request: {server_info.full_method}")
        start = perf_counter_ns()
        res = handler(request, servicer_context)
        finished = perf_counter_ns()
        duration = (finished-start) / 1e6 # ms
        if LOG_VERBOSE_PB:
            logger.info(f"Finished request (in {duration:0.2f} ms): {server_info.full_method}. Response: {res}")
        else:
            logger.info(f"Finished request (in {duration:0.2f} ms): {server_info.full_method}")
        return res


class UpdateLastActiveTimeInterceptor(grpc.ServerInterceptor):
    def __init__(self, update_last_active_time):
        self._update_last_active_time = update_last_active_time

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        prev_func = handler.unary_unary

        def new_f(req, context):
            self._update_last_active_time(context.user_id)
            return prev_func(req, context)

        new_handler = grpc.unary_unary_rpc_method_handler(new_f,
                                                          request_deserializer=handler.request_deserializer,
                                                          response_serializer=handler.response_serializer)

        return new_handler
