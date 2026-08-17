"""
Errors shared between the serving layer and the modules it calls during call setup.
"""

import grpc


class CallRejectedError(Exception):
    """Reject the call being set up with this status code and message."""

    def __init__(self, msg: str, code: grpc.StatusCode):
        self.msg = msg
        self.code = code
