import functools
from pathlib import Path

from google.protobuf import descriptor_pb2, descriptor_pool


@functools.cache
def get_descriptors_pb() -> bytes:
    with open(Path(__file__).parent / "proto" / "descriptors.pb", "rb") as descriptor_set_f:
        return descriptor_set_f.read()


@functools.cache
def get_descriptor_pool() -> descriptor_pool.DescriptorPool:
    """
    Generates a protocol buffer object descriptor pool which allows looking up info about our proto API, such as options
    for each servicer, method, or message.
    """
    # this needs to be imported so the annotations are available in the generated pool...
    from couchers.proto import annotations_pb2  # noqa

    pool = descriptor_pool.DescriptorPool()
    desc = descriptor_pb2.FileDescriptorSet.FromString(get_descriptors_pb())
    for file_descriptor in desc.file:
        # Sanity check: I don't think it should ever have more than one service.
        assert len(file_descriptor.service) in (0, 1)

        # Validate that all services have auth levels specified in .proto files.
        # Media service is called only by the backend, so it doesn't have an auth level.
        if file_descriptor.service and (service := file_descriptor.service[0]) and service.name != "Media":
            level = service.options.Extensions[annotations_pb2.auth_level]
            if level not in {
                annotations_pb2.AUTH_LEVEL_OPEN,
                annotations_pb2.AUTH_LEVEL_JAILED,
                annotations_pb2.AUTH_LEVEL_SECURE,
                annotations_pb2.AUTH_LEVEL_EDITOR,
                annotations_pb2.AUTH_LEVEL_ADMIN,
            }:
                raise ValueError(f"{level=}, {service=}")

        pool.Add(file_descriptor)  # type: ignore[no-untyped-call]
    return pool
