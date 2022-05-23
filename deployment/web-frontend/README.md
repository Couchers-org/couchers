# Web Frontend

This helm chart is just using a subchart of our standardized deployment helm charts

## Introduction

This chart bootstraps a highly available deployment on a [Kubernetes](http://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

## Prerequisites

- Kubernetes 1.10+ with Beta APIs enabled
- The kubectl binary
- The helm binary
- Helm diff plugin installed

## Installing the Chart

To install the chart...

```bash
export SERVICE_NAME="web-frontend"
export CI_ENVIRONMENT_SLUG="dev"
export K8S_NAMESPACE="web-frontend-ci-github-actions"  # A sample namespace, replace me if desired to your branch name
export HELM_CHART=$SERVICE_NAME
export CURRENT_HELM_CHART=$SERVICE_NAME
export HELM_IMG_TAG="4182730cabd12e572528ed7be413923c5ccfa6f0"
# Go into our deployment folder
cd deployment
# Update our helm subchart...
helm dependencies update --skip-refresh $SERVICE_NAME/
# FOR TESTING/DEBUGGING ONLY OR DOING MANUAL KUBECTL APPLIES...
helm template --namespace $K8S_NAMESPACE $CURRENT_HELM_CHART $HELM_CHART -f $CURRENT_HELM_CHART/values.yaml     -f $CURRENT_HELM_CHART/values-${CI_ENVIRONMENT_SLUG}.yaml --set global.namespace="$K8S_NAMESPACE"  --set global.image.tag="$HELM_IMG_TAG"
# View the diff of what you want to do
helm diff upgrade --namespace $K8S_NAMESPACE --allow-unreleased $CURRENT_HELM_CHART $HELM_CHART     -f $CURRENT_HELM_CHART/values.yaml     -f $CURRENT_HELM_CHART/values-${CI_ENVIRONMENT_SLUG}.yaml --set global.namespace="$K8S_NAMESPACE"  --set global.image.tag="$HELM_IMG_TAG"
# Actually do it...
helm upgrade --namespace $K8S_NAMESPACE --install $CURRENT_HELM_CHART $HELM_CHART     -f $CURRENT_HELM_CHART/values.yaml     -f $CURRENT_HELM_CHART/values-${CI_ENVIRONMENT_SLUG}.yaml  --set global.namespace="$K8S_NAMESPACE"  --set global.image.tag="$HELM_IMG_TAG"
```

## Configuration

For configuration options possible, please see the open source [Universal Helm Chart - deployment](https://github.com/DevOps-Nirvana/Universal-Kubernetes-Helm-Charts/tree/master/charts/deployment).
