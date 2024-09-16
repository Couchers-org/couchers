# Deployment

This folder contains deployment scripts. The app should run on roughly any Linux box with `docker` and the usual command line tools.

## GeoIP database

You'll need to download a GeoIP database from Maxmind and make it available to the backend using the `GEOLITE2_CITY_MMDB_FILE_LOCATION` environment variable.
