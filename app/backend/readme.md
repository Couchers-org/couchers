# Couchers.org app backend

You can run the whole thing through Docker and docker-compose (see the readme in the `app/` folder).

## Installation

Create a virtual environment and install the requirements.

```sh
virtualenv venv -p python3.9
pip install -r requirements.txt
```

Then enter the virtual environment:

```sh
source venv/bin/activate
```

## Running tests

1. Make sure the postgres_tests container is running: `docker-compose up postgres_tests`. (see the readme in the `app/` folder for getting docker setup). 

2. Set the necessary env vars:

`export DATABASE_CONNECTION_STRING=postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/postgres`

3. Run `py.test` in the `app/backend/src/` folder.

```sh
cd src
py.test
```

## Q/A:

When running tests python is not connecting to the db!

Doublecheck that your DB test container is running. Then make sure the DATABASE_CONNECTION_STRING is similar to the one set in `backend.test.env`. Besides `localhost` it should be the same - if it is different the docs may be out of date. Please submit a PR to fix the docs.