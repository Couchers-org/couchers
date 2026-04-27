"""You can execute this script from pycharm/vscode's debugger!"""

import os
from collections.abc import Generator
from pathlib import Path
from tempfile import TemporaryDirectory


def parse_env_lines(file: Path) -> Generator[tuple[str, str]]:
    for line in file.resolve().read_text().splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        name, value = line.split("=", maxsplit=1)
        yield name, value


def read_db_password() -> str:
    postgres_env = parse_env_lines(Path(__file__).parent / "../../postgres.dev.env")
    db_password = dict(postgres_env)["POSTGRES_PASSWORD"]
    return db_password


def update_env() -> None:
    backend_env = parse_env_lines(Path(__file__).parent / "../../backend.dev.env")
    db_password = read_db_password()

    envs = {
        **dict(backend_env),
        "SMTP_HOST": "localhost",
        "OPENTELEMETRY_ENDPOINT": "localhost:4317",
        "DATABASE_CONNECTION_STRING": f"postgresql://postgres:{db_password}@localhost:6545/postgres",
    }

    os.environ.update(envs)


def main() -> None:
    update_env()

    if __name__ == "__main__":
        # It's not created in app.py, since it's under __name__ == "__main__".
        # Note that we have to do it before importing "app"
        prometheus_multiproc_dir = TemporaryDirectory()
        os.environ["PROMETHEUS_MULTIPROC_DIR"] = prometheus_multiproc_dir.name

    # Only import it here because it has side effects.
    import app  # noqa: PLC0415

    if __name__ == "__main__":
        app.common_init()
        app.main()
    elif __name__ == "__mp_main__":  # processes created via multiprocessing
        app.common_init()


main()
