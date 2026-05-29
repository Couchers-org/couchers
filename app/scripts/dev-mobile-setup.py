#!/usr/bin/env python3
"""
Configure the local dev environment for testing on a physical mobile device.

Updates API URLs and CORS settings across four config files so your phone can
reach your dev machine over the local network.

Usage:
  python3 scripts/dev-mobile-setup.py              # auto-detect IP
  python3 scripts/dev-mobile-setup.py 192.168.x.x  # use a specific IP
  python3 scripts/dev-mobile-setup.py --restore     # undo all changes

Files modified:
  app/proxy/envoy.yaml      - adds IP to CORS allow list
  app/backend.dev.env       - sets COOKIE_DOMAIN and media server URLs
  app/web/.env.localdev     - sets API and media URLs
  app/mobile/.env           - switches from staging to local dev mode

Note: do NOT commit the envoy.yaml change.
"""

import argparse
import re
import socket
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent.parent

ENVOY_YAML = APP / "proxy" / "envoy.yaml"
BACKEND_ENV = APP / "backend.dev.env"
WEB_ENV = APP / "web" / ".env.localdev"
MOBILE_ENV = APP / "mobile" / ".env"

MOBILE_ENV_DEFAULT = """\
# STAGE:
EXPO_PUBLIC_COUCHERS_ENV=preview
EXPO_PUBLIC_WEB_BASE_URL="https://next.couchershq.org"
EXPO_PUBLIC_API_BASE_URL="https://dev-api.couchershq.org"

# LOCAL:
# EXPO_PUBLIC_COUCHERS_ENV=dev
# EXPO_PUBLIC_API_BASE_URL="http://[[YOUR_WEB_IP_ADDRESS]]:8888"
# EXPO_PUBLIC_WEB_BASE_URL="http://[[YOUR_WEB_IP_ADDRESS]]:3000"
"""


def get_local_ip() -> str:
    # Connect to an external address to discover which interface the OS would
    # use — no data is actually sent.
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return ""


def setup(ip: str) -> None:
    print(f"Configuring local mobile dev with IP: {ip}\n")

    # envoy.yaml — add IP to CORS allow list after the localhost:3000 line
    content = ENVOY_YAML.read_text()
    entry = f"- exact: http://{ip}:3000  # mobile-dev"
    if f"http://{ip}:3000" in content:
        print("  envoy.yaml      already configured, skipping")
    else:
        content = content.replace(
            "- exact: http://localhost:3000",
            f"- exact: http://localhost:3000\n                  {entry}",
        )
        ENVOY_YAML.write_text(content)
        print("  envoy.yaml      added IP to CORS allow list")

    # backend.dev.env — COOKIE_DOMAIN + media server URLs
    content = BACKEND_ENV.read_text()
    content = re.sub(r"^COOKIE_DOMAIN=.*", f"COOKIE_DOMAIN={ip}", content, flags=re.MULTILINE)
    content = re.sub(r"^MEDIA_SERVER_BASE_URL=.*", f"MEDIA_SERVER_BASE_URL=http://{ip}:5001", content, flags=re.MULTILINE)
    content = re.sub(r"^MEDIA_SERVER_UPLOAD_BASE_URL=.*", f"MEDIA_SERVER_UPLOAD_BASE_URL=http://{ip}:5001", content, flags=re.MULTILINE)
    BACKEND_ENV.write_text(content)
    print("  backend.dev.env updated COOKIE_DOMAIN and media server URLs")

    # web/.env.localdev — API + media URLs
    content = WEB_ENV.read_text()
    content = re.sub(r'^NEXT_PUBLIC_API_BASE_URL=.*', f'NEXT_PUBLIC_API_BASE_URL="http://{ip}:8888"', content, flags=re.MULTILINE)
    content = re.sub(r'^NEXT_PUBLIC_MEDIA_BASE_URL=.*', f'NEXT_PUBLIC_MEDIA_BASE_URL="http://{ip}:5001"', content, flags=re.MULTILINE)
    WEB_ENV.write_text(content)
    print("  web/.env.localdev updated API and media URLs")

    # mobile/.env — comment out STAGE block, activate LOCAL block with real IP
    MOBILE_ENV.write_text(
        f"# STAGE:\n"
        f"# EXPO_PUBLIC_COUCHERS_ENV=preview\n"
        f"# EXPO_PUBLIC_WEB_BASE_URL=\"https://next.couchershq.org\"\n"
        f"# EXPO_PUBLIC_API_BASE_URL=\"https://dev-api.couchershq.org\"\n"
        f"\n"
        f"# LOCAL:\n"
        f"EXPO_PUBLIC_COUCHERS_ENV=dev\n"
        f"EXPO_PUBLIC_API_BASE_URL=\"http://{ip}:8888\"\n"
        f"EXPO_PUBLIC_WEB_BASE_URL=\"http://{ip}:3000\"\n"
    )
    print("  mobile/.env     switched to local dev mode")

    print(
        "\nDone! Next steps:\n"
        "  1. Restart the backend:   docker compose up --build\n"
        "  2. Restart the frontend:  cd app/web && yarn start\n"
        "  3. Start Expo:            cd app/mobile && npx expo start\n"
        "\n"
        "To undo: python3 scripts/dev-mobile-setup.py --restore\n"
        "\n"
        "Reminder: do not commit the envoy.yaml change."
    )


def restore() -> None:
    print("Restoring files to defaults...\n")

    # envoy.yaml — remove the mobile-dev line
    content = ENVOY_YAML.read_text()
    lines = [line for line in content.splitlines(keepends=True) if "# mobile-dev" not in line]
    ENVOY_YAML.write_text("".join(lines))
    print("  envoy.yaml      removed mobile dev CORS entry")

    # backend.dev.env — back to localhost
    content = BACKEND_ENV.read_text()
    content = re.sub(r"^COOKIE_DOMAIN=.*", "COOKIE_DOMAIN=localhost", content, flags=re.MULTILINE)
    content = re.sub(r"^MEDIA_SERVER_BASE_URL=.*", "MEDIA_SERVER_BASE_URL=http://localhost:5001", content, flags=re.MULTILINE)
    content = re.sub(r"^MEDIA_SERVER_UPLOAD_BASE_URL=.*", "MEDIA_SERVER_UPLOAD_BASE_URL=http://localhost:5001", content, flags=re.MULTILINE)
    BACKEND_ENV.write_text(content)
    print("  backend.dev.env restored to localhost")

    # web/.env.localdev — back to localhost
    content = WEB_ENV.read_text()
    content = re.sub(r'^NEXT_PUBLIC_API_BASE_URL=.*', 'NEXT_PUBLIC_API_BASE_URL="http://localhost:8888"', content, flags=re.MULTILINE)
    content = re.sub(r'^NEXT_PUBLIC_MEDIA_BASE_URL=.*', 'NEXT_PUBLIC_MEDIA_BASE_URL="http://localhost:5001"', content, flags=re.MULTILINE)
    WEB_ENV.write_text(content)
    print("  web/.env.localdev restored to localhost")

    # mobile/.env — back to staging mode
    MOBILE_ENV.write_text(MOBILE_ENV_DEFAULT)
    print("  mobile/.env     restored to staging mode")

    print("\nDone. Restart backend and frontend to apply.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Set up local mobile dev environment for physical device testing.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "examples:\n"
            "  python3 scripts/dev-mobile-setup.py\n"
            "  python3 scripts/dev-mobile-setup.py 192.168.1.42\n"
            "  python3 scripts/dev-mobile-setup.py --restore"
        ),
    )
    parser.add_argument("ip", nargs="?", help="local IP address (auto-detected if omitted)")
    parser.add_argument("--restore", action="store_true", help="revert all changes to defaults")
    args = parser.parse_args()

    if args.restore:
        restore()
        return

    ip = args.ip or get_local_ip()
    if not ip:
        print("Error: could not detect local IP. Pass it explicitly:")
        print("  python3 scripts/dev-mobile-setup.py 192.168.x.x")
        sys.exit(1)

    setup(ip)


if __name__ == "__main__":
    main()
