# Justfile for the backend of the application
# Run 'just [command]' in app/backend to execute the specified command

# See app/backend/readme.md.

PROTO_IMAGE := "registry.gitlab.com/couchers/grpc"
DB_PASSWORD := "203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7"
APP_DIR := justfile_directory() + "/app"

# Generate protocol buffer files
protos:
    docker pull -q {{PROTO_IMAGE}}
    docker run --rm -w /app -v {{APP_DIR}}:/app {{PROTO_IMAGE}} ./generate_protos.sh

# Connect to the local development database
db:
    PGPASSWORD={{DB_PASSWORD}} psql -h localhost -p 6545 -U postgres -d postgres

# Run backend locally with all needed dependencies (db etc).
run-backend:
    #!/usr/bin/env bash
    cd app/backend
    just run-backend

alias rb := run-backend
