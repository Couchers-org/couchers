# Makefile for the Python API client
# Run 'make [command]' in app/client to execute the specified command
.SILENT:
MAKEFLAGS += --no-print-directory

.PHONY: default
default: protos

# Generate the Python protobuf bindings into src/couchers/proto/.
.PHONY: protos
protos:
	$(MAKE) -C ../proto python
	mkdir -p src/couchers/proto
	rsync --recursive --checksum --delete ../proto/gen/python/api/ src/couchers/proto/
