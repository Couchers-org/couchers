import time
from functools import cache

import grpc

from couchers import metrics
from couchers.config import config
from couchers.proto.bfc import bfc_pb2, bfc_pb2_grpc

TIMEOUT_SECONDS = 1.0
CHANNEL_OPTIONS = [
    ("grpc.max_reconnect_backoff_ms", 5_000),
    ("grpc.keepalive_time_ms", 30_000),
    ("grpc.keepalive_timeout_ms", 10_000),
    ("grpc.keepalive_permit_without_calls", 1),
    ("grpc.http2.max_pings_without_data", 0),
]


def is_configured() -> bool:
    return bool(config.BFC_ADDRESS)


# created on first use rather than at import, because a channel doesn't survive the fork into the API workers
@cache
def _stub(address: str) -> bfc_pb2_grpc.BFCStub:
    return bfc_pb2_grpc.BFCStub(grpc.insecure_channel(address, options=CHANNEL_OPTIONS))


def _call[Req, Res](method: str, fn: grpc.UnaryUnaryMultiCallable[Req, Res], request: Req) -> Res:
    start = time.perf_counter()
    try:
        response = fn(request, timeout=TIMEOUT_SECONDS)
    except grpc.RpcError as e:
        metrics.observe_bfc_rpc(method, e.code().name, time.perf_counter() - start)
        raise
    metrics.observe_bfc_rpc(method, grpc.StatusCode.OK.name, time.perf_counter() - start)
    return response


def user_search(request: bfc_pb2.UserSearchReq) -> bfc_pb2.UserSearchRes:
    return _call("UserSearch", _stub(config.BFC_ADDRESS).UserSearch, request)
