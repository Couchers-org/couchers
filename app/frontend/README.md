# couchers-react

[![Build Status](https://travis-ci.org/Couchers-org/couchers-react.svg?branch=dev)](https://travis-ci.org/Couchers-org/couchers-react)
[![Coverage Status](https://coveralls.io/repos/github/Couchers-org/couchers-react/badge.svg?branch=dev)](https://coveralls.io/github/Couchers-org/couchers-react?branch=dev)

This is the react frontend for couchers.org. We are using [Redux with Redux Toolkit](https://redux-toolkit.js.org/) for state management and [Material UI](https://material-ui.com/) for components.

Communication with the backend is via [protobuf messages](https://github.com/protocolbuffers/protobuf/tree/master/js) and [grpc_web](https://github.com/grpc/grpc-web). You can find some helpful documentation on [protobuf messages in javascript here](https://developers.google.com/protocol-buffers/docs/reference/javascript-generated).

## How to contribute

1. Pick an unassigned issue you'd like to work on (or open a new one) and assign it to yourself.

2. Make sure you have the development environment going (see below).

3. Create a new branch for your issue under 'frontend/issue-type/branch-name' eg. `frontend/feature/global-search`, `frontend/bug/no-duplicate-users` or `frontend/refactor/fix-host-requests`

4. Do some code! It is good to commit regularly, but if possible your code should successfully compile with each commit.

5. Create a pull request and request a code review from someone. It can be good to open a PR before you are finished, add [WIP] before the title in that case.

6. Listen to the feedback and make any necessary changes. Remember, code review can sometimes seem very direct if your are not accustomed to it, but we are all learning and all comments are intended to be kind and constructive. :)

7. Remember to also get review on your post-review changes.

8. Once everything is resolved, you can merge the PR if you feel confident, or ask someone to merge for you.

## Setting up the dev environment

You will need to first [follow the instructions in the main repository](https://github.com/Couchers-org/couchers/blob/develop/app/readme.md) to start the docker containers and generate the protocol buffer code.

Then, you should clone into this repo, and copy the `couchers/app/frontend/pb` folder from the main repo into this one.

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

