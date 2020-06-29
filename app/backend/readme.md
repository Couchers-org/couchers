# Couchers.org app backend

You can run the whole thing through Docker and docker-compose (see the readme in the `app/` folder).

## Installation

Create a virtual environment and install the requirements.

```sh
virtualenv venv -p python3.8
pip install -r requirements.txt
```

Then enter the virtual environment:

```sh
source venv/bin/activate
```

## Running tests

You need to install the code as a package, then run `pytest`. Do this in the `app/backend/src/` folder.

```sh
cd src
pip install -e .
pytest .
```
