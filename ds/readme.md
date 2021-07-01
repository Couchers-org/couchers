# Data Science

## Installation

```sh
virtualenv venv -p python3.8
source venv/bin/activate
pip install -r requirements.txt -r ds-requirements.txt
python -m ipykernel install --user --name=couchers
```

Build protos

```sh
protoc *.proto --python_out=.
```

Copy `ds.env.sample` to `readonly.env` and `readwrite.env` and fill in your access creds for read only and full access.

Put something like this in `~/.ssh/config`

```
Host csql
HostName api.couchers.org
LocalForward 6000 localhost:5432
User ubuntu
IdentityFile ~/.ssh/couchers.pem
```

## Running it

Open an SSH port forward to the database by running `ssh csql` in another window, then source the cred and run the notebook

```sh
jupyter-notebook --port 9999
```

# Rules

Whenever you commit to git, clear the notebook and save it first! This is for our git history sanity but also to wipe any secrets or data from the output.
