from pathlib import Path

import grpc

from couchers.services import get_all_stubs

DEFAULT_SERVER_ADDRESS = "api.couchers.org:8443"

parent_folder = Path(__file__).parent

version = (parent_folder / "version").read_text().strip()


def get_client(api_key, server_address=DEFAULT_SERVER_ADDRESS, disable_tls=False):
    """
    Given an API key returns a client object.

    `disable_tls` connects to the server insecurely. This only works on localhost, thanks to gRPC.

    Returns a new class with attributes corresponding to each stub, with attributes such as `account`, corresponding to
    an account gRPC stub.
    """
    if disable_tls:
        creds = grpc.local_channel_credentials()
    else:
        creds = grpc.ssl_channel_credentials()

    creds = grpc.composite_channel_credentials(creds, grpc.access_token_call_credentials(api_key))

    channel = grpc.secure_channel(server_address, creds)
    stubs = get_all_stubs(channel)
    return type("__Client", (), stubs)
