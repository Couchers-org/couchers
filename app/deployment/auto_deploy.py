#!/usr/bin/python3
import yaml
import docker
import boto3
import base64
import os
import subprocess


def get_conf(config="./deploy_conf.yaml"):
    conf_file = open(config,"r").read()
    return yaml.safe_load(conf_file)


def get_database_container(docker_client, container_id):
    return docker_client.containers.get(container_id)


def main(config):
    docker_client = docker.from_env()
    # add database stuff when app is migrated to postgresql
    #database_container = get_database_container(docker_client, config["containers"]["database_container"]["name"])
    #if not os.path.exists("/
    #database_container.exec_run("pg_dumpall > /var/lib/postgresql/data/
    ecr_client = boto3.client("ecr", region_name=config["region"])
    auth = ecr_client.get_authorization_token()
    docker_client.login(username="AWS", password=base64.b64decode(auth["authorizationData"][0]["authorizationToken"]).decode().split(":")[1], registry="694904428454.dkr.ecr.us-east-1.amazonaws.com")
    for image in config["images"]:
        pull_image(docker_client,config["images"][image]["uri"])
        
    #run docker compose
    subprocess.Popen(["docker-compose", "up", "--force-recreate", "--build", "-d"],cwd=config["working_directory"])
    subprocess.Popen(["docker", "image", "prune", "-f"])  


def pull_image(docker_client, image_repository):
    docker_client.images.pull(image_repository)
    

if __name__=="__main__":
    main(get_conf())
