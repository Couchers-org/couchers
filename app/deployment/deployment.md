# Deployment

**Note**: you cannot run a production version of Couchers just like that. We pre-bake some domain names in the containers. You'll need to rebuild your own. Happy to help if you have a legitimate interest!

This folder contains deployment scripts. The app should run on roughly any Linux box with `docker` and the usual command line tools.

## Working instructions for Ubuntu 22.04

```sh
git clone https://github.com/Couchers-org/couchers.git
cd couchers/app
./deployment/deps.sh
# log out and back in so you can use docker
# copy all .dev.env files into .prod.env and customize the configuration
# you can start nginx which will get you certificates
docker compose -f docker-compose.prod.yml up --no-deps nginx
# then you need to set some permissions so that postgres comes up
docker compose -f docker-compose.prod.yml up -d --no-deps postgres
# you can now restore a db backup or whatever
gunzip -c dump.sql.gz | docker exec -i app-postgres-1 psql -U postgres | tee restore.log
# start up the media container, it'll create its own directories
docker compose -f docker-compose.prod.yml up --no-deps media
# you can now restore a media backup if you wish
# finally start the whole thing
cd deployment
./install.sh
```

## GeoIP database

You'll need to download a GeoIP database from Maxmind and make it available to the backend using the `GEOLITE2_CITY_MMDB_FILE_LOCATION` environment variable, `post-upgrade.sh` does some of this.
