# Couchers.org app backend

You can run the whole thing through Docker and docker-compose (see the readme in the `app/` folder).

## Installation

Create a virtual environment and install the requirements.

```sh
virtualenv venv -p python3.9
pip install -r requirements.txt
```

Then enter the virtual environment:

```sh
source venv/bin/activate
```

## Running tests

Run `py.test` in the `app/backend/src/` folder.

```sh
cd src
py.test
```
