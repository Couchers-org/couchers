.SILENT:

BUILD_DIR := .build
DIR_PATH := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
PROTO_DIR := ../../proto

default: ${BUILD_DIR}/changestamp

${BUILD_DIR}/changestamp: \
		internal/internal.proto internal/jobs.proto internal/unsubscribe.proto
	$(MAKE) -C ${PROTO_DIR} call-docker protos=${DIR_PATH} script=generate_internal.sh
	mkdir -p ${BUILD_DIR} && touch ${BUILD_DIR}/changestamp

clean:
	rm -rf ${BUILD_DIR}/
	$(MAKE) -C ${PROTO_DIR} call-docker protos=${DIR_PATH} script=remove_gen.sh

