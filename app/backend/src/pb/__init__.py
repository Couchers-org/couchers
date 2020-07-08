from os.path import dirname, join, abspath
import os
from glob import glob
from grpc_tools import protoc
import pkg_resources

this_dir = dirname(__file__)
backend_src = join(this_dir, "..")
app_dir = join(backend_src, "..", "..")

protoc_args = (["dummy_argv0", "-I" + app_dir,
                "-I" + pkg_resources.resource_filename('grpc_tools', '_proto'),
                "--python_out", backend_src,
                "--grpc_python_out", backend_src] +
               glob(join(app_dir, "pb", "*.proto")))

protoc.main(protoc_args)
