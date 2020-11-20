#!/bin/bash

./backup.sh

pushd ..
git pull
docker-compose pull
docker-compose up -d
popd
