# Migrating old SQLite to Postgres

Get the current sqlite db into `db.sqlite`. Create an empty postgres db. Then run (in `//app/backend`)

```sh
env $(cat ../backend.local.env | rg -v '^#' | xargs) PYTHONPATH=src alembic upgrade 406fcdd10a2b
```

This is the schema at the latest ugprade point on the server. Then load the data using `pgloader`:

```sh
pgloader pgloader.conf > pgloader.log
```

Finally migrate to latest version:

```sh
env $(cat ../backend.local.env | rg -v '^#' | xargs) PYTHONPATH=src alembic upgrade head
```

I had to tweak this migration a bit, it was a pain due to some enum weirdness.
