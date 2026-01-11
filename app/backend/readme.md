# Couchers.org backend

This is the backend for Couchers.org built in Python. The React web frontend and React Native apps 
make API calls to it using [gRPC](https://grpc.io/) which are defined via [Protocol Buffers](https://protobuf.dev/). The business
logic manipulates a [PostgreSQL](https://www.postgresql.org/) database via [SQLAlchemy](https://www.sqlalchemy.org/). Geospatial features are provided 
by the [PostGIS extension](https://postgis.net/).

## Prerequisites

- **Linux or macOS**. If you are using Windows, please [install Ubuntu via WSL2](https://documentation.ubuntu.com/wsl/en/latest/guides/install-ubuntu-wsl2/), then 
  follow these instructions inside Ubuntu.
- **Docker engine**. Please refer to the [Docker install documentation](https://docs.docker.com/engine/install/) for how to set it up.
- **just command runner**. [Find a package for your OS](https://just.systems/man/en/packages.html). 
- **A clone of the Couchers git repo**. `git clone https://github.com/Couchers-org/couchers.git`

### Up-to-date protocol buffers

All steps assume you have up-to-date API definitions generated using protobuf and grpc. 
If you make or pull changes to \*.proto files, you'll need to rerun this:

```sh
just protos
```

## Building and running in Docker

To spin up a complete copy of the database, backend, and proxies needed to run the platform,
run the following command:

```sh
docker compose up --build
```

This will not currently run the frontend, to do that, please follow the instructions 
in [app/web/readme.md](../web/readme.md) under *Quick Start*, then *Running against a local backend*.

[//]: # (These commands don't exist - probably invented by claude? But we should add them.)
[//]: # (### Running tests in docker)

[//]: # ()
[//]: # (You can run all backend tests in docker with the following commands:)

[//]: # ()
[//]: # (```sh)

[//]: # (cd app/backend)

[//]: # ()
[//]: # (# Run all tests)

[//]: # (make docker-test)

[//]: # ()
[//]: # (# Or run a single file's tests)

[//]: # (make docker-test file=test_filename.py)

[//]: # ()
[//]: # (# Teardown the test database when done)

[//]: # (make teardown-docker-test)

[//]: # (```)

## Running the backend locally

For quicker iteration, you can run the backend locally and have it talk to the rest 
of the containerized services.

You'll need to have Python UV installed and dependencies sync'ed:

```sh
cd app/backend
# other installation methods https://github.com/astral-sh/uv?tab=readme-ov-file#installation
curl -fsSL https://astral.sh/uv/install.sh | sh  
uv sync --frozen
```

Run backend and all containerized services needed for it.

```sh
just run-backend
# or 'just rb' for short
```


If you find that the proxy/media services can't talk to your local backend, try setting 
the `BACKEND_HOST=host.docker.internal` environment variable before running `just run-backend`

### Running tests locally

This is the recommended approach.

```sh
cd app/backend

# Will set up a postgres database in docker, and run all tests
just test

# Run a single file, or a particular test
just test src/tests/test_account.py
just test src/tests/test_account.py::test_reminders
```

## Q/A:

### Q: I can't connect to the DB!

**A**: First doublecheck what port the DB is listening on - run `docker compose up postgres` and it should say something like `listening on IPv6 address "::", port 6545`. Then doublecheck you have the right password. There are TWO passwords - one for the test db and one for the normal db! See app/postgres.dev.env and app/postgres.test.env

[Here is information for debugging the backend inside VS Code](/docs/backend-in-vscode.md)

### Q: I'm seeing issues with migrations or the database not being up to date!

**A**: This happens when you either switch between branches that mutate the database or something else funny happens. The easiest way is to nuke the database:

1. Stop postgres docker container
2. Delete the `postgres` folder in `app/data`
3. Re-run `docker compose up --build`

If you have **any trouble**, send Aapeli a message on Slack. He's more than happy to spend a bit of time helping you set things up!

### Q: I'm having issues with proto protos!

**A**: Regenerate protos using

```sh
docker run --pull always --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

### Q: How do I log in or sign up when developing?

**A**: If you are using the local backend, you can log in with the username "aapeli" and the password "Aapeli's password". This comes from the [dummy data](https://github.com/Couchers-org/couchers/blob/develop/app/backend/src/data/dummy_users.json). For emails, see the next question.

If you are using the live dev api ("next"/staging), it will send you real emails so you can sign up. However, all links will point to next.couchershq.org. If you want to open them with the couchers frontend you are working on locally, change the links to http://localhost:3000/rest/of/the/url.

### Q: How do I receive emails like the signup confirmation email in local dev?

**A**: We run [MailDev](https://github.com/maildev/maildev) with the docker compose setup: it will receive emails and let you browse them. To view emails, visit <http://localhost:1080>.
