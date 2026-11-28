# Makefile for the media server
# Run 'make [command]' in app/media to execute the specified command
.SILENT:
MAKEFLAGS += --no-print-directory

.PHONY: default
default: protos

# Generate the Python protobuf bindings into src/media/proto/.
.PHONY: protos
protos:
	$(MAKE) -C ../proto python
	mkdir -p src/media/proto
	rsync --recursive --checksum --delete ../proto/gen/python/api/ src/media/proto/
