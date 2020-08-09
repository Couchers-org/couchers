"""
A simple config system
"""
import os

from dotenv import load_dotenv

load_dotenv()

# Allowed config options, as tuples (name, type).
# All fields are required
CONFIG_OPTIONS = [
    # Whether we're in dev mode
    ("DEV", bool),
    # Base URL
    ("BASE_URL", str),
    # Email
    ("ENABLE_EMAIL", str),
    # SMTP settings
    ("SMTP_HOST", str),
    ("SMTP_PORT", int),
    ("SMTP_USERNAME", str),
    ("SMTP_PASSWORD", str),
]

config = {}

for name, type_ in CONFIG_OPTIONS:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Required config value {name} not set")

    if type_ == bool:
        # 1 is true, 0 is false, everything else is illegal
        if value not in ["0", "1"]:
            raise ValueError(f'Invalid bool for {name}, need "0" or "1"')
        value = value == "1"
    else:
        value = type_(value)

    config[name] = value


## Config checks

if not config["DEV"]:
    if "https" not in config["BASE_URL"]:
        raise Exception("Production site must be over HTTPS")
