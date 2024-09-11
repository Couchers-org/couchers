#!/bin/bash

set -e

./backup.sh

./install.sh

./webhook.sh
