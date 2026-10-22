# Generates protobuf bindings incrementally for dev scenarios.
# Uses a GRPC docker container if dependencies are not installed locally.
# CI doesn't use this file because the GRPC container doesn't have Make installed.
.SILENT:

API_SOURCE_FILES := $(shell find api -type f -name "*.proto")
BACKEND_SOURCE_FILES := $(shell find backend -type f -name "*.proto")
PYTHON_SENTINEL := gen/python/python.tar.gz # No-op if this file is up-to-date
TS_SENTINEL := gen/ts/ts.tar.gz # No-op if this file is up-to-date

.PHONY: default
default: python ts

.PHONY: python
python: ${PYTHON_SENTINEL}

${PYTHON_SENTINEL}: generate_python.sh postprocess_grpc_stubs.py ${API_SOURCE_FILES} ${BACKEND_SOURCE_FILES}
	./generate_python.sh --auto-container

.PHONY: ts
ts: ${TS_SENTINEL}

${TS_SENTINEL}: generate_ts.sh ${API_SOURCE_FILES}
	./generate_ts.sh --auto-container

.PHONY: clean
clean:
	rm -rf gen
