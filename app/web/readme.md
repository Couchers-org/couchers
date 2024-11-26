# Couchers web frontend

This is the react/nextjs web frontend for Couchers.org. We are using Typescript with [React Query](https://tanstack.com/query/v3) for data fetching and [Material UI](https://mui.com/material-ui/) for components.

Communication with the backend is via [protobuf messages](https://github.com/protocolbuffers/protobuf-javascript) over [grpc-web](https://github.com/grpc/grpc-web). You can find some helpful documentation on [protobuf messages in javascript here](https://protobuf.dev/protobuf-javascript/).

*Readme last updated: 2024/11/14.*

## Quick Start

*These instructions should work directly on Linux and macOS. If you are using Windows, please [install Ubuntu via WSL2](https://documentation.ubuntu.com/wsl/en/latest/guides/install-ubuntu-wsl2/), then follow these instructions inside Ubuntu.*

You need `nodejs` v20. We recommend using `nvm` (the [node version manager](https://github.com/nvm-sh/nvm)) to do this. You can install it with:

```sh
curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

**You will need to restart your terminal before `nvm` becomes available.**

<details>
<summary>More on deps</summary>

The recommended way get `nodejs` is to use NVM as above, but any other way of installing it should work fine too.

If you don't want `nvm` to be run when you start your terminal, you can add `--no-use` in your shell's `rc` file (e.g. `~/.zshrc`), just before where it says `# This loads nvm`. You then need to run `nvm use` every time you enter the `app/web` folder to start developing.

On macOS you can alternatively install dependencies via homebrew. You can get nvm with `brew install nvm`, or `nodejs` directly with `brew install node@20`.

You also need `git`, `curl`, and `tar`, they should be preinstalled or be available from the usual places.

</details>

Now run the following commands to get up and running:

```sh
## Check out the repo and navigate to app/web
# clone the git repo
git clone https://github.com/Couchers-org/couchers.git
# navigate into the repo and app/web
cd couchers/app/web

## Set up node & yarn
# install the requires node version
nvm install
# install yarn
npm install --global yarn

## Download & extract the latest protos
curl -sL https://develop--protos.preview.couchershq.org/ts.tar.gz | tar xz

# install dependencies
yarn install
# start the frontend
yarn start
```

The frontend will now be up at <http://localhost:3000>.

<details>
<summary>Common problem: Getting logged out right after logging in</summary>

If you're getting logged out right after logging in, it's possible that 3rd party cookies are blocked in your browser. Since you're using localhost:3000, the cookie `couchers-sesh` coming from `https://dev-api.couchershq.org` is considered a 3rd party cookie.

- Chrome allows to enable 3rd party cookies for specific websites in the cookie settings > Sites that can always use cookies. Enable "Including third-party cookies on this site"
- Safari is all-or-nothing, in Preferences > Privacy > Prevent cross-site tracking. You have to disable it.
</details>

This method uses the staging backend/database at <https://next.couchershq.org/> (what we call "next"), and the pre-built protos from today's `develop` branch (they change pretty rarely). You might eventually want to change both of these, but this should get you up and running!

If you have any trouble, someone will be happy to help, just ask!

## Logging in

If you followed the Quick Start instructions, it points to the staging ("next") instance: please create a new account. It's separate from the prod instance but otherwise fully functional and you'll receive a real signup link.

If you are running the backend locally, use username `aapeli` and password `Aapeli's password`.

## How to contribute

1. Pick an unassigned issue you'd like to work on (or open a new one) and assign it to yourself.

2. Make sure you have the development environment going (see above).

3. Create a new branch for your issue under 'web/issue-type/branch-name' eg. `web/feature/global-search`, `web/bug/no-duplicate-users` or `web/refactor/fix-host-requests`

4. Do some code! It is good to commit regularly, but if possible your code should successfully compile with each commit.

5. Create a pull request and request a code review from someone. It can be good to open a PR before you are finished, make it a draft PR in that case.

6. Listen to the feedback and make any necessary changes. Remember, code review can sometimes seem very direct if your are not accustomed to it, but we are all learning and all comments are intended to be kind and constructive. :)

7. Remember to also get review on your post-review changes.

8. Once everything is resolved, you can merge the PR if you feel confident, or ask someone to merge for you. If there are merge conflicts, merge the base branch (probably `develop`) into your branch first, and make sure everything is still okay.

## More on the dev environment

### What are these "protos"?

The React frontend communicates with the backend using Protocol Buffers over gRPC-Web. It's a serialization format and it's how we describe our APIs, think of it as a fancy JSON+HTTP REST. You can find the API definitions [in the app/proto folder](https://github.com/Couchers-org/couchers/tree/develop/app/proto). For a bit of an overview to how they work and why one might want to use them, you can read [this blog post](https://www.aapelivuorinen.com/blog/2020/06/12/protobuf-vs-json/).

### Compiling protos locally

You can compile the protos locally if you have [installed Docker](https://docs.docker.com/engine/install/) (this is how the built protos are generated in the CI pipeline):

```sh
cd app
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

The TypeScript definitions will be generated into `app/web/proto` (all the other definitions will also be generated into the right places, for the Python backend, etc).

You can always download the latest protos at <https://develop--protos.preview.couchershq.org/> for any of the languages we use if you don't want to set up Docker.

### Running against a local backend

The Quick Start instructions show you how to run only the frontend, pointing to the staging (next) backend/database. This is normally enough for most frontend development (since generally backend features are developed before the frontend implementation), but there may be cases where you want to run a modified backend. In order to do so, you need to do two things:

1. compile the protos locally (see above) and run the local backend, and
2. update the frontend environment variables to point to the local backend.

The following shows the quick version. You'll need docker and docker compose installed.

In one terminal, compile protos, run the backend and rest of the infrastructure:

```sh
## terminal 1
cd app
# compile protos
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
# launch the rest of the docker containers
docker compose up
```

In another one, run the frontend:

```sh
## terminal 2
cd app/web
# use local development config
cp .env.localdev .env.development
# run the frontend (follow Quick Start for prep)
yarn start
```

## Other dev commands

Once you have the protos code in `couchers/app/web/src/proto`, and you can use the below `yarn` commands to run the web frontend.

While coding, your editor should auto-format with `prettier` when you save. If not, you can always run `yarn format`.

---

In the project directory, you can run:

### `yarn start`

Runs the app in development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

**Tip**: before submitting a PR, it might be worth running all the CI tests with `yarn test-ci` to get a quick feedback on your own machine.

### `yarn storybook`

Runs storybook, good for testing and developing components in isolation.

### Option 2: Use Docker to run the backend, proxy and database locally

[Follow the main instructions](https://github.com/Couchers-org/couchers/blob/develop/app/readme.md) to start the docker containers and generate the protocol buffer code.

_hint_: You can find a set of users for logging in at the [dummy data loaded in the docker container](https://github.com/Couchers-org/couchers/blob/develop/app/backend/src/data/dummy_users.json)
