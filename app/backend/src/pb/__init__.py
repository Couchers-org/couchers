# Automatically populate this package with api_pb2.py, api_pb2_grpc.py
# etc., by calling protoc during import time.

from pathlib import Path
import os
from grpc_tools import protoc
import pkg_resources

this_dir = Path(__file__).parent
backend_src = this_dir / ".."
app_dir = backend_src / ".." / ".."

protoc_args = (["dummy_argv0", "-I" + str(app_dir),
                "-I" + pkg_resources.resource_filename('grpc_tools', '_proto'),
                "--python_out", str(backend_src),
                "--grpc_python_out", str(backend_src)] +
               [str(x) for x in (app_dir / "pb").glob("*.proto")])

protoc.main(protoc_args)
