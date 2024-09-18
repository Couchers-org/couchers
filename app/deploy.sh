#!/bin/bash

export AWS_PROFILE=couchers

echo "Deploying..."
ssh couchers2 "cd ~/couchers/app/deployment && ./upgrade.sh"
echo "Done."
