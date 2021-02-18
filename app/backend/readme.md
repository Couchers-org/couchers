# Couchers.org app backend

You can run the whole thing through Docker and docker-compose (see the readme in the `app/` folder).

## Running tests in docker

You can run all tests in docker with the following command, executed in the `app` folder:

```sh
docker-compose -f docker-compose.test.yml up --build
```

## Running tests locally

Prerequisites:

If you haven't already, run the first two steps from the [readme in the `app/` folder](https://github.com/Couchers-org/couchers/blob/develop/app/readme.md).

Note that if you've made breaking changes, you may need to re-compile the protocol buffers.

Then make sure the postgres_tests container is running:

```sh
docker-compose -f docker-compose.test.yml up postgres_tests
```

1. Create a virtual environment and install the requirements.

```sh
virtualenv venv -p python3.9
pip install -r requirements.txt
```

2. Then enter the virtual environment:

```sh
source venv/bin/activate
```

3. Set the necessary env vars:

```sh
export DATABASE_CONNECTION_STRING=postgresql://postgres:06b3890acd2c235c41be0bbfe22f1b386a04bf02eedf8c977486355616be2aa1@localhost:6544/postgres
```

**Windows** note: Replace "export" with "set"

(Environment variables are non-persistent and must be set in the exact place where you plan to run the tests. For example, if using an IDE, they must be set within the IDE.)

4. Run `pytest` in the `app/backend/src/` folder.

```sh
cd src
pytest
```

## Q/A:

Q: When running tests python is not connecting to the db. What do I do?

A: Doublecheck that your DB test container is running. Then make sure the DATABASE_CONNECTION_STRING is similar to the one set in `backend.test.env`. Besides `localhost` it should be the same - if it is different the docs may be out of date. Please submit a PR to fix the docs.
