# What is prometheus

Prometheus is a monitoring tool that we use to get data into our dashboards and alerts on [https://couchers.grafana.net/]. Prometheus works by scraping metrics from its data sources. In our case, the app respondes to GET requests on port 8000 and 8001 with a list of numbers and tags. Prometheus regularly calls these endpoints and then forwards the data to a centralized database we use (for FREE) at Grafana Cloud. From there we can use the data for monitoring and alerting.
