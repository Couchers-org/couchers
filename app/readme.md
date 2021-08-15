# Couchers.org app

**Note**: If you have **any trouble** with this, send Aapeli or Lucas a message on Slack. They're more than happy to spend a bit of time helping you set things up!

To **run the app locally**, you need to do **four things**:

1. Get the code, navigate to the `app` folder and install `docker` and `docker-compose`
2. Compile the protocol buffers
3. Launch the backend with `docker-compose`
4. Install and launch the frontend with `yarn`

Are you only developing on the frontend? If you don't want to install docker, you can follow the alterative instructions in `frontend/readme.md`.

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
docker run --rm -w /app -v $(pwd):/app registry.gitlab.com/couchers/grpc ./generate_protos.sh
```

An alternative on **macOS** is to install the tools locally with `brew install grpc protoc-gen-grpc-web`, then run `./generate_protos.sh`.

### Windows

If you are on **Windows** (without WSL2), run the following command:

```sh
docker run --rm -w /app -v %cd%:/app registry.gitlab.com/couchers/grpc sh -c "cat generate_protos.sh | dos2unix | sh"
```

## 3. Launch the backend with `docker-compose`

In the `app` folder, run the following command:

```sh
docker-compose up --build
```

This will build the backend, database, and proxy, and start them up.

## 4. Install and launch the frontend with `yarn`

Navigate to the `app/frontend` folder, and run the following commands to start the frontend:

```sh
yarn install
yarn start
```

This will take a moment, after which you can go to <http://localhost:3000/>, and you should see the app there. The command might also open the page for you automatically.
