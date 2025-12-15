#!/bin/bash

set -e

# Skip media backup during deploy - it's slow and handled by daily cron
./backup.sh --skip-media

./install.sh

./post-upgrade.sh
