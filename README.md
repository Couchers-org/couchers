# Couchers Web Frontend

This is the react/nextjs web frontend for couchers.org. We are using Typescript with [React Query](https://react-query.tanstack.com/) for data fetching and [Material UI](https://material-ui.com/) for components.

Communication with the backend is via [protobuf messages](https://github.com/protocolbuffers/protobuf/tree/main) and [grpc-web](https://github.com/grpc/grpc-web). You can find some helpful documentation on [protobuf messages in javascript here](https://developers.google.com/protocol-buffers/docs/reference/javascript-generated).

## Setup

- Install [the GitHub Desktop App](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/installing-and-authenticating-to-github-desktop/installing-github-desktop) (or alternatively, the [git CLI](https://git-scm.com/). This varies by platform but on Mac/Linux you should use your package manager.)
- Install docker and docker compose
  - It's recommended you install [Docker Desktop](https://www.docker.com/products/docker-desktop/) as it includes both.
  - If you don't want docker desktop, you can follow [these instructions](https://docs.docker.com/compose/install/) to install docker compose.
- Install an editor of your choice. Good examples are [Atom](https://atom.io) or [Visual Studio Code](https://code.visualstudio.com/) which both have extensions for Typescript/Javascript etc.
- Clone this repository with `git clone https://github.com/Couchers-org/web-frontend.git`
- Make sure your docker resource and node has enough memory to run the app. 
  - ex: set node limit to 8G: `export NODE_OPTIONS="--max-old-space-size=8192"`
  - open docker => resources => memory => set higher
  
## Setting up the dev environment

It is recommended that while running the frontend locally, you target the hosted dev API and backend - this is the default behaviour. If you'd like to run the backend locally too, see the note below.

A makefile is provided which will run the frontend in docker-compose, using your local source code. You only need to run `make run` to get started, but here's a more in-depth description of a typical workflow:
_Windows users: you may need to install [MinGW](https://www.mingw-w64.org/) for some commands (like `make`) to work properly._

- `make run` - Launch the frontend in docker-compose and attach to logs in port 3000
  - CTRL+C will detach you from the logs, but leave the containers running. Use `make logs` to reattach.
  - `make shell` will put you in a shell inside the frontend container - useful for running commands in the container itself.
- `make stop` - Stop running containers.
- `make rebuild` - Will delete the containers and force a new build of them.
- `make run-foreground` - Will start the containers without detaching.


#### Run the backend, proxy and database locally

You can run _everything_ locally if you like - [follow the main instructions](https://github.com/Couchers-org/couchers/blob/develop/app/readme.md) to start the docker containers and generate the protocol buffer code.

Then, you just need to rename `.env.localdev` in the repo root to `.env.local`. Then you can run the frontend normally as described above, and it will target the local backend. Remember not to commit the renamed file!

_hint_: You can find a set of users for logging in at the [dummy data loaded in the docker container](https://github.com/Couchers-org/couchers/blob/develop/app/backend/src/data/dummy_users.json)

## How to contribute

1. Pick an unassigned issue you'd like to work on (or open a new one) and assign it to yourself.

2. Make sure you have the development environment going (see below).

3. Create a new branch for your issue under 'web/issue-type/branch-name' eg. `web/feature/global-search`, `web/bug/no-duplicate-users` or `web/refactor/fix-host-requests`

4. Do some code! It is good to commit regularly, but if possible your code should successfully compile with each commit.

5. Create a pull request and request a code review from the web team, `Couchers-org/web`. It can be good to open a PR before you are finished, make it a draft PR in that case.

6. Listen to the feedback and make any necessary changes. Remember, code review can sometimes seem very direct if your are not accustomed to it, but we are all learning and all comments are intended to be kind and constructive. :)

7. Remember to also get review on your post-review changes.

8. Once everything is resolved, you can merge the PR if you feel confident, or ask someone to merge for you. If there are merge conflicts, merge the base branch (probably `master`) into your branch first, and make sure everything is still okay.
