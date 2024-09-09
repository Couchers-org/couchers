import functools
from pathlib import Path

from google.protobuf import descriptor_pb2, descriptor_pool


@functools.cache
def get_descriptors_pb():
    with open(Path(__file__).parent / ".." / "proto" / "descriptors.pb", "rb") as descriptor_set_f:
        return descriptor_set_f.read()


@functools.cache
def get_descriptor_pool():
    """
    Generates a protocol buffer object descriptor pool which allows looking up info about our proto API, such as options
    for each servicer, method, or message.
    """
    # this needs to be imported so the annotations are available in the generated pool...
    from proto import annotations_pb2  # noqa

    pool = descriptor_pool.DescriptorPool()
    desc = descriptor_pb2.FileDescriptorSet.FromString(get_descriptors_pb())
    for file_descriptor in desc.file:
        pool.Add(file_descriptor)
    return pool
