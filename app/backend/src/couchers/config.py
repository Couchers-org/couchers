"""
A dummy config system
"""
import os

from dotenv import load_dotenv

load_dotenv()

# Allowed config options, as tuples (name, required, default),
# default of None on required fields causes an error
CONFIG_OPTIONS = [
    # SMTP settings
    ("ENABLE_EMAIL", True, True),
    ("SMTP_HOST", True, None),
    ("SMTP_PORT", True, 587),
    ("SMTP_USERNAME", True, None),
    ("SMTP_PASSWORD", True, None),
]

config = {}

for name, required, default in CONFIG_OPTIONS:
    value = os.getenv(name)
    if required:
        if not value:
            raise ValueError(f"Required config value {name} not set")
    else:
        value = default

    config[name] = value
