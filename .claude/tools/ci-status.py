#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "httpx",
# ]
# ///
"""Look up GitLab CI pipeline status for a given PR, branch, or commit."""

import argparse
import json
import subprocess
import sys

import httpx

GITLAB_PROJECT = "couchers%2Fcouchers"
GITLAB_API = f"https://gitlab.com/api/v4/projects/{GITLAB_PROJECT}"


def get_pr_info(pr_number: str) -> tuple[str, str]:
    """Get SHA and branch name from a GitHub PR number."""
    result = subprocess.run(
        ["gh", "pr", "view", pr_number, "--json", "headRefOid,headRefName"],
        capture_output=True,
        text=True,
        check=True,
    )
    data = json.loads(result.stdout)
    return data["headRefOid"], data["headRefName"]


def get_branch_sha(client: httpx.Client, branch: str) -> str:
    """Get the latest pipeline SHA for a branch from GitLab."""
    resp = client.get(
        f"{GITLAB_API}/pipelines",
        params={"ref": branch, "per_page": 1, "order_by": "updated_at", "sort": "desc"},
    )
    resp.raise_for_status()
    pipelines = resp.json()
    if not pipelines:
        print(f"No pipelines found for branch: {branch}", file=sys.stderr)
        sys.exit(1)
    return pipelines[0]["sha"]


def find_pipeline(client: httpx.Client, sha: str) -> dict:
    """Find the best pipeline for a given SHA."""
    resp = client.get(f"{GITLAB_API}/pipelines", params={"sha": sha, "per_page": 5})
    resp.raise_for_status()
    pipelines = resp.json()

    if not pipelines:
        print(f"No pipelines found for SHA: {sha}", file=sys.stderr)
        sys.exit(1)

    # Prefer external_pull_request_event source
    for p in pipelines:
        if p.get("source") == "external_pull_request_event":
            return p

    return pipelines[0]


def get_jobs(client: httpx.Client, pipeline_id: int) -> list[dict]:
    """Fetch all jobs for a pipeline."""
    resp = client.get(f"{GITLAB_API}/pipelines/{pipeline_id}/jobs", params={"per_page": 100})
    resp.raise_for_status()
    return resp.json()


def format_duration(seconds: float | None) -> str:
    if seconds is None:
        return "-"
    return f"{seconds:.0f}s"


def main():
    parser = argparse.ArgumentParser(description="Look up GitLab CI pipeline status")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--pr", help="GitHub PR number")
    group.add_argument("--branch", help="Git branch name")
    group.add_argument("--sha", help="Commit SHA")
    args = parser.parse_args()

    sha = ""
    branch = ""
    pr = ""

    with httpx.Client(timeout=30) as client:
        if args.pr:
            pr = args.pr
            sha, branch = get_pr_info(pr)
        elif args.branch:
            branch = args.branch
            sha = get_branch_sha(client, branch)
        elif args.sha:
            sha = args.sha

        pipeline = find_pipeline(client, sha)
        pipeline_id = pipeline["id"]
        pipeline_status = pipeline["status"]

        if not branch:
            branch = pipeline["ref"]

        jobs = get_jobs(client, pipeline_id)

    # Print summary header
    print(f"Pipeline: #{pipeline_id} ({pipeline_status})")
    print(f"Branch: {branch}")
    print(f"Commit: {sha}")
    if pr:
        print(f"PR: #{pr}")
    print(f"URL: https://gitlab.com/couchers/couchers/-/pipelines/{pipeline_id}")
    print()

    # Sort jobs by stage then name
    jobs.sort(key=lambda j: (j.get("stage", ""), j.get("name", "")))

    # Print jobs table
    print("Jobs:")
    print(f"{'STAGE':<16} {'JOB':<30} {'STATUS':<10} {'DURATION':<10} ID")

    for job in jobs:
        stage = job.get("stage", "")
        name = job.get("name", "")
        status = job.get("status", "")
        duration = format_duration(job.get("duration"))
        job_id = job.get("id", "")

        status_display = status.upper() if status == "failed" else status

        print(f"{stage:<16} {name:<30} {status_display:<10} {duration:<10} {job_id}")

        if status == "failed":
            reason = job.get("failure_reason", "")
            if reason:
                print(f"{'':16}   ^ failure reason: {reason}")


if __name__ == "__main__":
    main()
