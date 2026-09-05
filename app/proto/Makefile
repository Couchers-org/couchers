.SILENT:

BUILD_DIR := .build
DIR_PATH := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))
PROTO_IMAGE=registry.gitlab.com/couchers/grpc

default: ${BUILD_DIR}/changestamp

# Listing all dependencies ensures incremental builds. Missing some still works for clean builds.
${BUILD_DIR}/changestamp: \
		google/api/annotations.proto google/api/http.proto google/api/httpbody.proto \
		account.proto admin.proto annotations.proto api.proto auth.proto blocking.proto bugs.proto communities.proto conversations.proto discussions.proto donations.proto editor.proto events.proto galleries.proto gis.proto groups.proto iris.proto jail.proto media.proto messages.proto moderation.proto notification_data.proto notifications.proto pages.proto postal_verification.proto public.proto public_trips.proto references.proto reporting.proto requests.proto resources.proto search.proto stripe.proto threads.proto
	$(MAKE) call-docker protos=${DIR_PATH} script=generate_public.sh
	mkdir -p ${BUILD_DIR} && touch ${BUILD_DIR}/changestamp

clean:
	rm -rf ${BUILD_DIR}/
	# Delete through docker since the files were generated as root
	$(MAKE) call-docker protos=${DIR_PATH} script=remove_gen.sh

# Reusable call to a script from scripts inside the grpc docker container
# Usage: make call-docker protos=path/to/protos/dir script=<name>
call-docker:
	docker pull -q ${PROTO_IMAGE}
	# Delete through docker since the files were generated as root
	docker run --rm \
	  -v $(realpath $(protos)):/app/src \
	  -v $(realpath ${DIR_PATH})/scripts:/app/scripts \
	  -w /app/src \
	  ${PROTO_IMAGE} /app/scripts/$(script)
