# Couchers.org app

**Note**: If you have **any trouble** with this, send Aapeli a message on Slack. He's more than happy to spend a bit of time helping you set things up!

To **run the app locally**, you need to do **four things**:

1. Clone the git repository and navigate to the `app` folder
2. Install `docker` and `docker-compose`
3. Compile the protocol buffers
4. Run the `docker-compose` command

## 1. Clone the git repository and navigate to the `app` folder

To get the code onto your machine, clone the git respository from GitHub with the following command:

```sh
git clone https://github.com/Couchers-org/couchers.git
```

Open a command line or terminal, and navigate to the `app` folder (where this `readme.md` is), for example with `cd couchers/app`.


## 2. Install `docker` and `docker-compose`

Install `docker` from <https://docs.docker.com/engine/install/>.

Install `docker-compose` from <https://docs.docker.com/compose/install/>.

## 3. Compile the protocol buffers

### macOS or Linux

If you are on **Linux** or **macOS**, run the following command:

```sh
docker run --rm -w /app -v $(pwd):/app couchers/grpc ./generate_protos.sh
```

### Windows

If you are on **Windows**, run the following command:

```sh
docker run --rm -w /app -v %cd%:/app couchers/grpc sh -c "cat generate_protos.sh | dos2unix | sh"
```

### macOS (homebrew)

You can install `grpc` and the gRPC-Web plugin locally with `brew install grpc protoc-gen-grpc-web`, then run:

```sh
./generate_protos.sh
```


## 4. Run the `docker-compose` command

In the same folder, run the following command:

```sh
docker-compose up --build
```

This will take a few minutes, after which you can go to <http://localhost:8080/>, and you should see the app there.
