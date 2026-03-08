"""
Builds a deployment manifest JSON file.

The manifest describes a release: which commit it corresponds to, what the
current alembic migration head is, and the Docker image tags for each service.

Expected environment variables (set by GitLab CI):
  CI_COMMIT_SHA, CI_COMMIT_SHORT_SHA, CI_COMMIT_REF_NAME,
  CI_COMMIT_TIMESTAMP, CI_PIPELINE_ID, CI_REGISTRY_IMAGE, SLUG

Usage:
  python build_manifest.py <migrations_dir> <output_file>
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

SERVICES = ["backend", "media", "web", "proxy", "nginx", "prometheus"]


def get_alembic_head(migrations_dir):
    """Extract the highest migration number from the migrations directory."""
    pattern = re.compile(r"^(\d+)_")
    heads = []
    for entry in Path(migrations_dir).iterdir():
        m = pattern.match(entry.name)
        if m:
            heads.append(int(m.group(1)))
    if not heads:
        raise RuntimeError(f"No migrations found in {migrations_dir}")
    head = max(heads)
    if head < 100:
        raise RuntimeError(f"Alembic head {head} is suspiciously low (< 100)")
    return str(head)


def get_commit_number():
    """Get monotonically increasing commit count on this branch."""
    result = subprocess.run(
        ["git", "rev-list", "--count", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )
    return int(result.stdout.strip())


def build_manifest(migrations_dir):
    registry = os.environ["CI_REGISTRY_IMAGE"]
    slug = os.environ["SLUG"]
    commit_number = get_commit_number()

    return {
        "commit_sha": os.environ["CI_COMMIT_SHA"],
        "commit_short_sha": os.environ["CI_COMMIT_SHORT_SHA"],
        "commit_number": commit_number,
        "branch": os.environ["CI_COMMIT_REF_NAME"],
        "timestamp": os.environ["CI_COMMIT_TIMESTAMP"],
        "alembic_head": get_alembic_head(migrations_dir),
        "pipeline_id": os.environ["CI_PIPELINE_ID"],
        "images": {service: f"{registry}/{service}:{slug}" for service in SERVICES},
    }


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <migrations_dir> <output_file>", file=sys.stderr)
        sys.exit(1)

    migrations_dir = sys.argv[1]
    output_file = sys.argv[2]

    manifest = build_manifest(migrations_dir)
    with open(output_file, "w") as f:
        json.dump(manifest, f, indent=2)

    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
