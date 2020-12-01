#!/bin/bash

# works on ubuntu 20.04, tested on AWS
# installs docker, docker-compose, aws-cli

set -e

# update, upgrade
sudo apt-get -y update
sudo apt-get -y dist-upgrade

# install docker
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $(whoami) # make me able to use docker without sudo

# get latest version of docker-compose
sudo apt-get install -y jq
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
sudo curl -L "https://github.com/docker/compose/releases/download/$COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# install aws cli
sudo apt install -y unzip
mkdir -p /tmp/awscli
pushd /tmp/awscli
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
popd
rm -rf /tmp/awscli
