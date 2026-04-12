"""Post or update a migration review comment on a GitHub PR."""

import argparse
import json
import subprocess
import sys
from typing import Any

COMMENT_MARKER = "<!-- migration-review -->"


def get_existing_comment_id(repo: str, pr_number: str) -> str | None:
    """Find an existing migration review comment on the PR."""
    result = subprocess.run(
        [
            "gh",
            "api",
            f"repos/{repo}/issues/{pr_number}/comments",
            "--jq",
            f'.[] | select(.body | contains("{COMMENT_MARKER}")) | .id',
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return None

    # Get the first matching comment ID
    lines = result.stdout.strip().split("\n")
    if lines and lines[0]:
        return lines[0]
    return None


def format_comment(data: dict[str, Any]) -> str:
    """Format the migration review comment from structured data."""
    risk_level = data.get("risk_level", "UNKNOWN")
    files_reviewed = data.get("files_reviewed", [])
    findings = data.get("findings", [])
    summary = data.get("summary", "")

    lines = [
        COMMENT_MARKER,
        "## Migration Review",
        "",
        "One of our most common issues is migrations that don't work with existing",
        "data in production. This is very hard to catch with CI, so we have this bot",
        "to check for potential problems.",
        "",
        f"**Overall Risk: {risk_level}**",
        "",
        "### Files Reviewed",
    ]

    for file_info in files_reviewed:
        if isinstance(file_info, dict):
            filename = file_info.get("filename", "")
            description = file_info.get("description", "")
            lines.append(f"- `{filename}` - {description}")
        else:
            lines.append(f"- `{file_info}`")

    lines.extend(["", "### Findings", ""])

    if findings:
        for finding in findings:
            if isinstance(finding, dict):
                category = finding.get("category", "Unknown")
                severity = finding.get("severity", "UNKNOWN")
                description = finding.get("description", "")
                lines.append(f"- **[{category}]** [{severity}]: {description}")

                details = finding.get("details", [])
                for detail in details:
                    lines.append(f"  - {detail}")
            else:
                lines.append(f"- {finding}")
    else:
        lines.append("No issues found.")

    lines.extend(["", "### Summary", summary])

    return "\n".join(lines)


def create_comment(repo: str, pr_number: str, body: str) -> None:
    """Create a new comment on the PR."""
    subprocess.run(
        ["gh", "pr", "comment", pr_number, "--repo", repo, "--body", body],
        check=True,
    )
    print(f"Created new migration review comment on PR #{pr_number}")


def update_comment(repo: str, comment_id: str, body: str) -> None:
    """Update an existing comment."""
    subprocess.run(
        [
            "gh",
            "api",
            f"repos/{repo}/issues/comments/{comment_id}",
            "-X",
            "PATCH",
            "-f",
            f"body={body}",
        ],
        check=True,
    )
    print(f"Updated existing migration review comment (ID: {comment_id})")


def main():
    parser = argparse.ArgumentParser(
        description="Post or update a migration review comment on a GitHub PR"
    )
    parser.add_argument("--repo", required=True, help="Repository in owner/repo format")
    parser.add_argument("--pr", required=True, help="PR number")
    parser.add_argument(
        "--json",
        dest="json_data",
        help="JSON string with review data (or use stdin)",
    )
    args = parser.parse_args()

    # Read JSON data from argument or stdin
    if args.json_data:
        data = json.loads(args.json_data)
    else:
        data = json.load(sys.stdin)

    # Format the comment body
    body = format_comment(data)

    # Check for existing comment
    existing_id = get_existing_comment_id(args.repo, args.pr)

    if existing_id:
        update_comment(args.repo, existing_id, body)
    else:
        create_comment(args.repo, args.pr, body)


if __name__ == "__main__":
    main()
