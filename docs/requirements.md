# Updating python requirements manually

DependaBot should automatically keep the requirements updated, but to do it manually, you can install `pip-tools` and compile the requirements:

```sh
cd app/backend
# do this in a virtual environment of some form, preferrably
pip-compile requirements.in --output-file requirements.txt
```
