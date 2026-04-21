# Server Operations cheat sheet

## Setting up your machine for deployment

Before you can deploy, you need to set up AWS credentials and SSH access. These instructions work on Linux and macOS.

### AWS credentials

1. Install the AWS CLI if you don't have it: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html (or use homebrew `brew install awscli`)
2. Get AWS IAM credentials from Aapeli
3. Configure the AWS CLI with a profile named `couchers`:

```sh
aws configure --profile couchers
# Enter your Access Key ID, Secret Access Key, and set region to us-east-1 under Users > Security Credentials > Create Access Key
```

### SSH access

1. Create an ed25519 SSH key if you don't already have one:

```sh
# Check if you already have one
ls -la ~/.ssh/id_ed25519.pub

# If not, create one, just press enter on all the prompts
ssh-keygen -t ed25519
```

2. Send your public key to Aapeli so he can add it to the server (to `~/.ssh/authorized_keys`):

```sh
# send the full output of this
cat ~/.ssh/id_ed25519.pub
```

3. Add the following to your SSH config (`~/.ssh/config`), create the file if it doesn't exist:

```
Host couchers2
    HostName api.couchers.org
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519
```

4. Test the connection:

```sh
ssh couchers2
```

### Deploying

We have a dashboard for deploying at `https://ops.couchershq.org/`.

To deploy:

- Click around `https://next.couchershq.org/` to make sure nothing obvious was broken by recent merges, especially map search.
- Go to `https://ops.couchershq.org/`
- Find the "Deploy" button on the latest commit and click it.
- Refresh the page, the status at the top should update
- It will take about a minute
- Once it's done, click around prod, make sure everything is working.

It's essential to be able to be around for another 30 minutes after deploying if something breaks.

For deployments that don't update a migration, the immediate rollback plan is to go back to the last good known version. For deployments that do update a migration, it should only be done when someone knowledgeable is around and able to help if something happens.

## Server setup

### Deployment

**Note**: you cannot run a production version of Couchers just like that. We pre-bake some domain names in the containers, etc. You'll need to rebuild your own. Happy to help if you have a legitimate interest!

This folder contains deployment scripts. The app should run on roughly any Linux box with `docker` and the usual command line tools.

#### Minimal clean instructions for Ubuntu 24.04

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
unzstd -c dump.sql.zstd | docker exec -i app-postgres-1 psql -U postgres | tee restore.log
# start up the media container, it'll create its own directories
docker compose -f docker-compose.prod.yml up --no-deps media
# you can now restore a media backup if you wish
# finally start the whole thing
cd deployment
./install.sh
```

#### Full Ubuntu 24.04 migrate script

```sh
# clone repo
git clone https://github.com/Couchers-org/couchers.git
cd couchers/app
# setup deps
./deployment/deps.sh
# give it a nice hostname
sudo hostnamectl hostname couchers2
# log out and back in so you can use docker
# copy all .dev.env files into .prod.env and customize the configuration
# you can start nginx which will get you certificates
docker compose -f docker-compose.prod.yml up --no-deps nginx
# then you need to set some permissions so that postgres comes up, something like:
# sudo chown 999 data/certs/live/db.couchers.org/privkey.pem
docker compose -f docker-compose.prod.yml up -d --no-deps postgres
# you can now restore a db backup or whatever
unzstd -c dump.sql.zstd | docker exec -i app-postgres-1 psql -U postgres | tee restore.log
# now's a good time to diff the SQL schema dumps with
# docker exec -i app-postgres-1 pg_dump -U postgres -s > schema.sql
# get the next-vals from the old server
# docker exec app-postgres-1 psql -U postgres -Atc "SELECT nextval('logging.api_calls_id_seq');"
docker exec app-postgres-1 psql -U postgres -c "SELECT pg_catalog.setval('logging.api_calls_id_seq', LOGGING_SEQ, true);"
# docker exec app-postgres-1 psql -U postgres -Atc "SELECT nextval('background_jobs_id_seq');"
docker exec app-postgres-1 psql -U postgres -c "SELECT pg_catalog.setval('background_jobs_id_seq', BG_JOBS_SEQ, true);"
# restore timezones
# docker exec -i app-postgres-1 pg_dump -U postgres --data-only --table='timezone_areas' | gzip > tz.sql.gz
gunzip -c tz.sql.gz | docker exec -i app-postgres-1 psql -U postgres | tee tz-restore.log
# start up the media container, it'll create its own directories
docker compose -f docker-compose.prod.yml up --no-deps media
# you can now restore a media backup if you wish
# put them in the right place and run
# sudo chown -R root:root uploads/
# set up postgres permissions: see "Postgres permissions" below
# finally start the whole thing
cd deployment
./install.sh
# copy over roles
# docker exec -i app-postgres-1 pg_dumpall -U postgres --roles-only > roles.sql
cat roles.sql | docker exec -i app-postgres-1 psql -U postgres
# copy over bg jobs and emails
# docker exec -i app-postgres-1 pg_dump -U postgres --data-only --table='background_jobs' --table='emails' | gzip > bgjobs_and_emails.sql.gz
gunzip -c bgjobs_and_emails.sql.gz | grep -v "pg_catalog.setval('public.background_jobs_id_seq'," | docker exec -i app-postgres-1 psql -U postgres
# finally copy over logging
# docker exec -i app-postgres-1 pg_dump -U postgres --data-only --table='logging.*' | zstd -11 > logging.sql.zstd
unzstd -c logging.sql.zstd | grep -v "pg_catalog.setval('logging.api_calls_id_seq'," | docker exec -i app-postgres-1 psql -U postgres | tee restore-logging.log
```

#### GeoIP database

You'll need to download a GeoIP database from Maxmind and make it available to the backend using the `GEOLITE2_CITY_MMDB_FILE_LOCATION` environment variable, `post-upgrade.sh` does some of this.


#### Cron jobs

The following are in `ubuntu`'s cron (`crontab -e`)

```
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# take a db backup
0 12 * * * cd /home/ubuntu/couchers/app/deployment && bash backup.sh
# reload the config in case TLS certs changed
32 4 * * * docker exec app-postgres-1 psql -U postgres -c 'SELECT pg_reload_conf();' >> /home/ubuntu/cronlog.log 2>&1
```

#### Postgres user setup

```sql
create role humans;

create role humans_ro;
create role humans_rw;

grant humans to humans_ro;
grant humans to humans_rw;

grant pg_read_all_data to humans_rw;
grant pg_write_all_data to humans_rw;

grant pg_read_all_data to humans_ro;

create role NAME_ro login password 'pwd' in role humans_ro;
create role NAME_rw login password 'pwd' in role humans_rw;
```

#### Connecting to Postgres

Ask Aapeli and he'll create you one or two sets of credentials (read only and possibly read write). Replace `NAME_ro`, `NAME_rw`, `PASSWORD_ro`, `PASSWORD_rw` with the values given to you in the following files.

```ini
## ~/.pg_service.conf
# main read conn: use replica (requires VPN)
[couchers]
host=wh.couchershq.org
port=5432
user=NAME_ro
dbname=postgres
sslmode=require

# write requires primary
[couchers_rw]
host=db.couchers.org
port=5432
user=NAME_rw
dbname=postgres
sslmode=require

# allow also primary ro
[couchers_ro]
host=db.couchers.org
port=5432
user=NAME_ro
dbname=postgres
sslmode=require
```

```ini
## ~/.pgpass
# hostname:port:database:username:password
wh.couchershq.org:5432:postgres:NAME_ro:PASSWORD_ro
db.couchers.org:5432:postgres:NAME_ro:PASSWORD_ro
db.couchers.org:5432:postgres:NAME_rw:PASSWORD_rw
```

You can then connect with `psql service=couchers` or similar.

#### Postgres permissions

Replace the last line (`host all all all scram-sha-256`) of `pg_hba.conf` with:

```
hostssl all             +humans         0.0.0.0/0               scram-sha-256
hostssl all             +humans         ::/0                    scram-sha-256
host            all     postgres        172.16.0.0/12           scram-sha-256

host all all all reject
```

##### Reset password

```
alter role NAME_ro with password 'pwd';
```


## Disaster recovery notes


### Recovering from a backup

Backups are currently taken daily (using `app/deployment/backup.sh`). These don't include the `logging.*` tables.

1. Download a backup from S3, to e.g. `dump-1725192001.sql.gz`
2. Stop the backend and postgres containers.
3. Move old database data to a different place, e.g. `sudo mv data/postgres data/postgres-old`.
4. Create a duplicate service in `docker-compose.prod.yml` that runs postgres on a different port and points to `data/psotgres-old` instead
5. Restore from the backup:

```sh
gunzip -c dump-1725192001.sql.gz | docker exec -i app-postgres-1 psql -U postgres | tee restore.log
```

6. Copy the `logging.api_calls_id_seq` sequence value from old to new:

```sh
api_calls_nextval=$(docker exec app-postgresold-1 psql -U postgres -Atc "SELECT nextval('logging.api_calls_id_seq');")
docker exec app-postgres-1 psql -U postgres -c "SELECT pg_catalog.setval('logging.api_calls_id_seq', $api_calls_nextval, true);"
background_jobs_nextval=$(docker exec app-postgresold-1 psql -U postgres -Atc "SELECT nextval('background_jobs_id_seq');")
docker exec app-postgres-1 psql -U postgres -c "SELECT pg_catalog.setval('background_jobs_id_seq', $background_jobs_nextval, true);"
```

7. Compare the schemas and make sure they match

```sh
docker exec -i app-postgresold-1 pg_dump -U postgres -s > schema-old.sql
docker exec -i app-postgres-1 pg_dump -U postgres -s > schema-new.sql
diff schema-old.sql schema-new.sql
```

8. You need to recreate users and the `pg_hba.conf` file according to `postgres-setup.md`
9. You should now be set to restart the service.
10. Copy over the logging tables

```sh
# make a copy of everything
docker exec -i app-postgresold-1 pg_dump -U postgres --data-only --table='logging.*' | gzip > logging.sql.gz
# check it's good!
# nuke from old db
docker exec -i app-postgresold-1 psql -U postgres -c 'DROP TABLE logging.api_calls;'
# now restore into new db except the line setting the sequence value
gunzip -c logging.sql.gz | grep -v "pg_catalog.setval('logging.api_calls_id_seq'," | docker exec -i app-postgres-1 psql -U postgres | tee restore-logging.log
```

The `gzip` is to save space.
