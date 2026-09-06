# Dev-facing makefile. Enters the GRPC container for operations and delegates generate.sh
.SILENT:

ROOT_DIR := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
PROTO_IMAGE=registry.gitlab.com/couchers/grpc
API_SOURCE_FILES := $(shell find api -type f -name "*.proto")
GENERATED_SENTINEL := gen/api/descriptors.pb # No-op if this file is up-to-date

.PHONY: default
default: generate

.PHONY: generate
generate: ${GENERATED_SENTINEL}

${GENERATED_SENTINEL}: generate.sh postprocess_grpc_stubs.py ${API_SOURCE_FILES}
	docker pull -q ${PROTO_IMAGE}
	docker run --rm -w /app -v $(realpath ${ROOT_DIR}):/app ${PROTO_IMAGE} ./generate.sh gen

.PHONY: clean
clean:
	# Docker means files were created as root, so also enter the container to clean
	docker pull -q ${PROTO_IMAGE}
	docker run --rm -w /app -v $(realpath ${ROOT_DIR}):/app ${PROTO_IMAGE} rm -rf gen

# Called in CI where we assume we're already in the container
.PHONY: ci
ci:
	./generate.sh gen
