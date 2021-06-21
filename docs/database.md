# Database & migrations

We use [SQLAlchemy](https://www.sqlalchemy.org/) as an ORM, an Object-Relational Mapper. It maps Python objects (classes) into database objects (aka rows). We use [Alembic](https://alembic.sqlalchemy.org/en/latest/) to version our database, and keep track of when tables are added, removed and altered, and how to move between versions.

This page is pretty short, but I'll outline basically how to create a migration.

## How to create a migration

Alembic is able to do some kinds of merges and whatnot, but we don't need that, it's much easier to have a linear history. Each PR that makes changes to the database should have one migration. Do it right at the end before merging. You might want to make some migrations while working (to get the tests to run, and try it out, etc), but remove all of them before continuing.

```sh
# In command line, navigate to '...couchers/app'

# start by clearing current dirty migrations
pushd backend/src/couchers/migrations/versions
# remove all migrations...
rm *.py
# ...and go back to what we had on develop
git checkout develop -- ./
popd

# nuke the current database
rm -rf ./data/postgres/pgdata

# *********
# Windows note:
# If you're using WSL2, you may need to run the next two commands in the
# windows command line, not in Linux (and not in powershell), then switch back.
# *********
# start the postgres container in the background
docker-compose up -d --no-deps postgres
# and the backend container in the foreground. this will create the database to the current state using migrations from `develop`
docker-compose up --build --no-deps backend
# kill it with some Ctrl+C when it's done creating (and you'll end up with backend errors because your tables are out of date)

# If you're using a virtual environment for couchers, enter it

# now create the migrations, change "Modify the database" to some meaningful message
cd backend
DATABASE_CONNECTION_STRING="postgresql://postgres:203d805f4b62c0a1b2f1f6b82d4583dfe563ec1619b83ce22ee414e8376a25e7@localhost:6545/postgres" PYTHONPATH=src alembic revision --autogenerate -m "Modify the database"

# now format the migration
autoflake -r -i --remove-all-unused-imports src && isort . && black .

# important: look through the migration and make sure it makes sense

# finally double check that the backend comes online and works correctly with the migration
cd ..
docker-compose up --build --no-deps backend
```

The procedure is funky because Alembic creates migrations by comparing the current state of a database to what's in the models.

Note: it'd be better if you'd create the database on `develop` first (that way it'll insert the dummy data), then switched back to the feature branch and created migrations, and made sure the database works then. Sometimes the migrations are faulty and they'll work if there's no data in the database but fail if there is some! For example if a `nullable=False` column has no default, this will work with no data but will in some cases fail to work with data.
