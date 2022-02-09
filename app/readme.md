# Couchers.org app

**[Read the dev FAQ](#faq)**

The easiest way to get started is to run the app through Gitpod.io. This requires no local setup and you just have to wait a bit for the backend and web frontend to be built and pop up!

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/Couchers-org/couchers)

To **run the app locally**, you need to do **four things**:

1. Get the code, navigate to the `app` folder and install `docker` and `docker-compose`
2. Compile the protocol buffers
3. Launch the backend with `docker-compose`
4. Install and launch the web frontend with `yarn`

Are you only developing on the web frontend? If you don't want to install docker, you can follow the alterative instructions in `web/readme.md`.

### Note for Windows users

We suggest you use WSL2, it lets you run Linux and docker much easier. Install [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install-win10) and clone the repo there. This will save you a lot of time and avoid lots of issues! You will need to clone the repo into your WSL distribution, otherwise you will have permissions problems when running the postgres database container.

## 1. Get the code, navigate to the `app` folder and install `docker` and `docker-compose`

To get the code onto your machine, clone the git respository from GitHub with the following command:

```sh
git clone https://github.com/Couchers-org/couchers.git
```

Open a command line or terminal, and navigate to the `app` folder (where this `readme.md` is), for example with `cd couchers/app`.

Install `docker` from <https://docs.docker.com/engine/install/>.

Install `docker-compose` from <https://docs.docker.com/compose/install/>.


## 2. Compile the protocol buffers

### macOS, Linux or WSL2

If you are on **macoS**, **Linux** or **WSL2**, run the following command:

```sh
docker run --pull always --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

An alternative on **macOS** is to install the tools locally with `brew install grpc protoc-gen-grpc-web`, then run `./generate_protos.sh`.

### Windows

If you are on **Windows** (without WSL2), run the following command:

```sh
docker run --pull always --rm -w /app -v %cd%:/app registry.gitlab.com/couchers/grpc sh -c "cat generate_protos.sh | dos2unix | sh"
```

### How to update the protocol buffers

If you start to get errors after some update in the grpc dependencies, make sure to compile the protocol buffers again by executing the same commands above.

## 3. Launch the backend with `docker-compose`

In the `app` folder, run the following command:

```sh
docker-compose up --build
```

This will build the backend, database, and proxy, and start them up.

## 4. Install and launch the web frontend with `yarn`

Navigate to the `app/web` folder, and run the following commands to start the web frontend:

```sh
yarn install
yarn start
```

This will take a moment, after which you can go to <http://localhost:3000/>, and you should see the app there. The command might also open the page for you automatically.

## FAQ

### I'm having difficulty with setup or coding

If you have **any trouble**, send Aapeli or Lucas a message on Slack. They're more than happy to spend a bit of time helping you set things up!

### How do I log in or sign up when developing?

If you are using the local backend, you can log in with the username "aapeli" and the password "Aapeli's password". This comes from the [dummy data](https://github.com/Couchers-org/couchers/blob/develop/app/backend/src/data/dummy_users.json). Also, anything which would send an email, like trying to sign up, prints the email to the log of the backend docker container.

If you are using the live dev api, it will send you real emails so you can sign up. However, all links will point to next.couchershq.org. If you want to open them with the couchers frontend you are working on locally, change the links to http://localhost:3000/rest/of/the/url. There's also a test user - ask on slack for the password.

### I want to do frontend development without running the backend locally in Docker

You can follow the instructions to target the live dev api in `web/readme.md`, or use [Gitpod](https://gitpod.io/#https://github.com/Couchers-org/couchers).

### Why is there a vercel link?

We use Vercel's excellent deployment abilities to easily preview the web frontend any commit and branch. We don't use Vercel in production, and the link won't be displayed there.
