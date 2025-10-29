# Updating python requirements manually

DependaBot should automatically keep the requirements updated, but to do it manually, you can use `uv`:

```sh
cd app/backend
make setup
uv sync
```
