# couchers-react

This is the react web frontend for couchers.org. We are using Typescript with [React Query](https://react-query.tanstack.com/) for data fetching and [Material UI](https://material-ui.com/) for components.

Communication with the backend is via [protobuf messages](https://github.com/protocolbuffers/protobuf/tree/master/js) and [grpc-web](https://github.com/grpc/grpc-web). You can find some helpful documentation on [protobuf messages in javascript here](https://developers.google.com/protocol-buffers/docs/reference/javascript-generated).

## How to contribute

1. Pick an unassigned issue you'd like to work on (or open a new one) and assign it to yourself.

2. Make sure you have the development environment going (see below).

3. Create a new branch for your issue under 'web/issue-type/branch-name' eg. `web/feature/global-search`, `web/bug/no-duplicate-users` or `web/refactor/fix-host-requests`

4. Do some code! It is good to commit regularly, but if possible your code should successfully compile with each commit.

5. Create a pull request and request a code review from someone. It can be good to open a PR before you are finished, make it a draft PR in that case.

6. Listen to the feedback and make any necessary changes. Remember, code review can sometimes seem very direct if your are not accustomed to it, but we are all learning and all comments are intended to be kind and constructive. :)

7. Remember to also get review on your post-review changes.

8. Once everything is resolved, you can merge the PR if you feel confident, or ask someone to merge for you. If there are merge conflicts, merge the base branch (probably `develop`) into your branch first, and make sure everything is still okay.

## Setting up the dev environment

### Option 1: Use Docker to run the backend, proxy and database locally

[Follow the main instructions](https://github.com/Couchers-org/couchers/blob/develop/app/readme.md) to start the docker containers and generate the protocol buffer code.

*hint*: You can find a set of users for logging in at the [dummy data loaded in the docker container](https://github.com/Couchers-org/couchers/blob/develop/app/backend/src/data/dummy_users.json)

### Option 2: Target the preview api and backend

If you don't want to install docker, you can target the live preview api and backend. However, you will first need to download the auto-generated gRPC code, since normally this is done by docker.

* Go to the [CI pipelines](https://gitlab.com/couchers/couchers/-/pipelines/).
* Search for the branch you want to generate the gRPC code from (usually `develop`).
* Click the pipeline number.
* Click the first pipeline step, "protos".
* Click "download artifacts" on the right. This is a copy of the repo, but it has the generated gRPC code in it, so you can copy that from `couchers/app/web/src/proto` to your local clone of the repo.

Then you need to target the dev preview api instead of localhost.

* In `couchers/app/web/.env.development`, change `REACT_APP_API_BASE_URL=http://localhost:8888` to `REACT_APP_API_BASE_URL=https://dev-api.couchershq.org`
* Remember not to commit this file to any pull requests!

Alternatively, target the dev preview api with the following command instead of using `yarn start` (see below) when running the app.

`yarn cross-env REACT_APP_API_BASE_URL=https://dev-api.couchershq.org yarn start`

### Option 3: Use Gitpod and develop in the browser

If you don't want to install the repo and still contribute, you can get started by doing the following:

* Open the repo in your browser via Gitpod:

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/Couchers-org/couchers)

* Wait a few minutes until you see "Success! You can now launch the frontend..." message to show up in the browser's VS Code "Instructions" terminal
* You should see a preview of the web app that's been spun up in Gitpod in the "Simple Browser" tab in the browser's VS Code
* Start developing away in the browser as if VS Code is installed on your machine!

### Then

You should then have the gRPC code in `couchers/app/web/src/proto`, and you can use the below `yarn` commands to run the web frontend.

If you have any trouble, someone will be happy to help, just ask!

While coding, your editor should auto-format with `prettier` when you save. If not, you can always run `yarn format`.

---

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn storybook`

Runs storybook, good for testing and developing components in isolation.

### `yarn build`

Builds the app for production to the `build` folder.
