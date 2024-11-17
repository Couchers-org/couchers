#!/bin/bash

# works on ubuntu 24.04, tested on AWS
# installs docker, docker-compose, aws-cli, age

set -e

# update, upgrade
sudo apt-get -y update
sudo apt-get -y dist-upgrade

sudo apt-get install -y age

# install docker
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $(whoami) # make me able to use docker without sudo

# install aws cli
sudo apt install -y unzip
mkdir -p /tmp/awscli
pushd /tmp/awscli
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
popd
rm -rf /tmp/awscli
