"""
A simple config system
"""
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Allowed config options, as tuples (name, type).
# All fields are required
CONFIG_OPTIONS = [
    # Whether we're in dev mode
    ("DEV", bool),
    # Base URL
    ("BASE_URL", str),
    # Email
    ("ENABLE_EMAIL", bool),
    # Sender name for outgoing notification emails e.g. "Couchers.org"
    ("NOTIFICATION_EMAIL_SENDER", str),
    # Sender email, e.g. "notify@couchers.org"
    ("NOTIFICATION_EMAIL_ADDRESS", str),
    # Address to send emails about reported users
    ("REPORTS_EMAIL_RECIPIENT", str),
    # SMTP settings
    ("SMTP_HOST", str),
    ("SMTP_PORT", int),
    ("SMTP_USERNAME", str),
    ("SMTP_PASSWORD", str),
    # Media server
    ("ENABLE_MEDIA", bool),
    ("MEDIA_SERVER_SECRET_KEY", bytes),
    ("MEDIA_SERVER_BEARER_TOKEN", str),
    ("MEDIA_SERVER_BASE_URL", str),
]

dot = Path(".")

if "pytest" in sys.modules:
    logger.info("Running in TEST")
    load_dotenv(dot / "test.env")
else:
    if (dot / ".env").is_file():
        load_dotenv(dot / ".env")
    else:
        load_dotenv(dot / "dev.env")

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
    elif type_ == bytes:
        # decode from hex
        value = bytes.fromhex(value)
    else:
        value = type_(value)

    config[name] = value


## Config checks

if not config["DEV"]:
    # checks for prod
    if "https" not in config["BASE_URL"]:
        raise Exception("Production site must be over HTTPS")
    if not config["ENABLE_EMAIL"]:
        raise Exception("Production site must have email enabled")
