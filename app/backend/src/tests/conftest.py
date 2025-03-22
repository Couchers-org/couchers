from os import environ
from tempfile import TemporaryDirectory

prometheus_multiproc_dir = TemporaryDirectory()


def pytest_sessionstart(session):
    environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name
