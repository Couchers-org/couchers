# Disaster recovery notes

## Recovering from a backup

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
APICALLS_NEXTVAL=$(docker exec app-postgresold-1 psql -U postgres -Atc "SELECT nextval('logging.api_calls_id_seq');")
docker exec app-postgres-1 psql -U postgres -c "SELECT pg_catalog.setval('logging.api_calls_id_seq', $APICALLS_NEXTVAL, true);"
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
