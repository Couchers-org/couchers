#!/bin/bash

set -e

./backup.sh

./install.sh

./post-upgrade.sh
