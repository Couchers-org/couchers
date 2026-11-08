# Makefile for the Envoy proxy
# Run 'make [command]' in app/proxy to execute the specified command
.SILENT:
MAKEFLAGS += --no-print-directory

.PHONY: default
default: protos

# Copy the protobuf descriptor set used by Envoy's gRPC-JSON transcoder.
.PHONY: protos
protos:
	$(MAKE) -C ../proto python
	rsync --checksum ../proto/gen/python/descriptors.pb descriptors.gen.pb
