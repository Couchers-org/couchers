"""Fetch and display the log output of a GitLab CI job."""

import argparse
import re
import sys

import httpx


def clean_log(raw: str) -> str:
    """Strip ANSI escape codes, GitLab section/timestamp markers, and carriage returns."""
    # Strip ANSI escape codes
    text = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", raw)

    # Strip GitLab section markers
    text = re.sub(r"section_start:\d+:[a-zA-Z_\d]+\r?\n?", "", text)
    text = re.sub(r"section_end:\d+:[a-zA-Z_\d]+\r?\n?", "", text)

    # Strip GitLab raw log timestamp+stream prefixes (e.g. "2026-02-16T06:23:12.723565Z 00O ")
    # These can appear with a space or + after the stream marker, and can be concatenated
    text = re.sub(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z \d{2}[OE][+ ]?", "", text)

    # Strip carriage returns
    text = text.replace("\r", "")

    # Remove leading blank lines
    text = text.lstrip("\n")

    # Remove trailing + characters on otherwise empty lines (section marker artifacts)
    text = re.sub(r"^\+$", "", text, flags=re.MULTILINE)

    # Collapse multiple consecutive blank lines into one
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text


def main():
    parser = argparse.ArgumentParser(description="Fetch GitLab CI job log")
    parser.add_argument("job_id", help="GitLab job ID (from ci-status output)")
    parser.add_argument("--full", action="store_true", help="Show full log output (default: last 200 lines)")
    args = parser.parse_args()

    url = f"https://gitlab.com/couchers/couchers/-/jobs/{args.job_id}/raw"

    with httpx.Client(timeout=60, follow_redirects=True) as client:
        resp = client.get(url)
        if resp.status_code != 200:
            print(f"Failed to fetch job log (HTTP {resp.status_code})", file=sys.stderr)
            sys.exit(1)

    log = clean_log(resp.text)
    lines = log.splitlines()
    total = len(lines)

    if args.full or total <= 200:
        print(log)
    else:
        skipped = total - 200
        print(f"... ({skipped} lines skipped, use --full to see all {total} lines) ...")
        print()
        print("\n".join(lines[-200:]))


if __name__ == "__main__":
    main()
