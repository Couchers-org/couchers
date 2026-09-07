# Dev-facing makefile. Enters the GRPC container for operations and delegates generate.sh
.SILENT:

API_SOURCE_FILES := $(shell find api backend -type f -name "*.proto")
GENERATED_SENTINEL := gen/api/descriptors.pb # No-op if this file is up-to-date

.PHONY: default
default: generate

.PHONY: generate
generate: ${GENERATED_SENTINEL}

${GENERATED_SENTINEL}: generate.sh postprocess_grpc_stubs.py ${API_SOURCE_FILES}
	./auto_container.sh ./generate.sh gen

.PHONY: clean
clean:
	# If we're generating files in the container, also delete them in the container,
	# as they may be owned by root.
	./auto_container.sh rm -rf gen

# Called in CI where we assume we're already in the container
.PHONY: ci
ci:
	./generate.sh gen
