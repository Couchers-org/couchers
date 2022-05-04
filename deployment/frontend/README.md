# Web

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
export SERVICE_NAME="frontend"
export CI_ENVIRONMENT_SLUG="master"
export K8S_NAMESPACE="dev"
export HELM_CHART=$SERVICE_NAME
export CURRENT_HELM_CHART=$SERVICE_NAME
# Go into our deployment folder
cd deployment
# Update our helm subchart...
helm dependencies update --skip-refresh $SERVICE_NAME/
# FOR TESTING/DEBUGGING ONLY OR DOING MANUAL KUBECTL APPLIES...
helm template --namespace $K8S_NAMESPACE $CURRENT_HELM_CHART $HELM_CHART -f $CURRENT_HELM_CHART/values.yaml     -f $CURRENT_HELM_CHART/values-${CI_ENVIRONMENT_SLUG}.yaml --set global.namespace="infrastructure"
# View the diff of what you want to do
helm diff upgrade --namespace $K8S_NAMESPACE --allow-unreleased $CURRENT_HELM_CHART $HELM_CHART     -f $CURRENT_HELM_CHART/values.yaml     -f $CURRENT_HELM_CHART/values-${CI_ENVIRONMENT_SLUG}.yaml --set global.namespace="infrastructure"
# Actually do it...
helm upgrade --namespace $K8S_NAMESPACE --install $CURRENT_HELM_CHART $HELM_CHART     -f $CURRENT_HELM_CHART/values.yaml     -f $CURRENT_HELM_CHART/values-${CI_ENVIRONMENT_SLUG}.yaml  --set global.namespace="infrastructure"
```

## Configuration

For configuration options possible, please see our [helm-charts](#todo) repository
