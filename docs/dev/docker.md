# Docker

aka how to retain your sanity

## Killer docker commands

* `docker ps`: like UNIX `ps`, shows running containers:

```
# show all running containers + what ports they expose
$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                              NAMES
19c1bd134143        postgres:12         "docker-entrypoint.s…"   4 hours ago         Up 4 hours          5432/tcp, 0.0.0.0:6544->6544/tcp   app_postgres_tests_1
```

* `docker stop {name}` you can use the `CONTAINER ID` (or the first few characters), or `NAMES` to refer to it. You can list multiple containers and it'll kill them all. These all stop that container:

```
# these all kill the postgres container above
$ docker stop 19c1bd134143
$ docker stop 19c
$ docker stop app_postgres_tests_1
```

* `docker stop $(docker ps -q)` kills all current containers (`-q` shows only the container id)

* `docker logs {name}`: lets you inspect logs of a container, also add `--follow` to stream them to `stdout`. Useful if you start containers in daemon mode. E.g.

```
docker logs --follow app_postgres_tests_1
```

## Useful docker-compose stuff

`docker-compose up` starts all containers in the `docker-compose.yml` in that folder

Options:

* `--build` : you probably want to be using this most of the time if you're changing stuff that goes into containers, it'll recreate the container
* `-d`: do it in "daemon" mode, in the background. This is also super useful if you want to run some containers in the background (e.g. the database) and monitor others in the foreground.
* `docker-compose up {container1} {container2}` will only start container1 and container2
* You can run multiple `docker-compose`s in different screens and they'll be able to communicate. This is very useful e.g. if you want to have the `postgres` container up and see the executed SQL queries in one window, and the `backend` container in another window and recreate it frequently
* `--no-deps`: don't bring up other containers that this depends on
* `--force-recreate`: forces the container to be recreated, if something happened outside the "context" of the container and you need to recreate it
* `-f`: specify a different docker-compose file, e.g. `docker-compose -f docker-compose.test.yml up postgres_tests`

## Some common patterns

### Run only the proxy, backend, and database

```
docker-compose up --build proxy backend
```

This will spin up the proxy, backend and postgres database (since the postgres container is a dependency of the backend). You can then do queries against the backend at `localhost:8888` (which hits the proxy that redirects it to the backend, which will mutate the database).

### Run the backend tests with postgres in background

Start postgres_tests in the background and run tests in foreground:

```
docker-compose -f docker-compose.test.yml up -d postgres_tests
docker-compose -f docker-compose.test.yml up --build --no-deps backend_tests
```
