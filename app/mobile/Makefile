# Makefile for the mobile app
# Run 'make [command]' in app/mobile to execute the specified command
.SILENT:
MAKEFLAGS += --no-print-directory

.PHONY: default
default: protos

# Generate the TypeScript protobuf bindings into proto/.
.PHONY: protos
protos:
	$(MAKE) -C ../proto ts
	mkdir -p proto
	rsync --recursive --checksum --delete ../proto/gen/ts/api/ proto/
