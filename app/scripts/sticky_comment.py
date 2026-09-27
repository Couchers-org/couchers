#!/usr/bin/env python3
"""Keep a single "sticky" comment on a GitHub PR, identified by a hidden HTML marker.

Importable (pr_preview_comment.py builds on it) and usable as a CLI, e.g. from a
bot that should replace its previous comment rather than post a new one:

  python3 app/scripts/sticky_comment.py --pr 123 --marker migration-review --body-file review.md

The CLI replaces the whole body. The token comes from GH_TOKEN (or GITHUB_TOKEN)
and the repo from GITHUB_REPOSITORY, defaulting to Couchers-org/couchers.

Pure stdlib so it runs on any python3 without pip.
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

GITHUB_API = "https://api.github.com"
USER_AGENT = "couchers-sticky-comment"
DEFAULT_REPO = "Couchers-org/couchers"
PAGE_SIZE = 100


def http_json(method, url, headers, *, params=None, body=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={"User-Agent": USER_AGENT, **headers})
    if data is not None:
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read()
    return json.loads(raw) if raw else None


def gh(method, path, token, **kwargs):
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    return http_json(method, f"{GITHUB_API}{path}", headers, **kwargs)


def marker_for(name):
    return f"<!-- {name} -->"


def find_open_pr(repo, sha, token):
    for pr in gh("GET", f"/repos/{repo}/commits/{sha}/pulls", token) or []:
        if pr.get("state") == "open":
            return pr["number"]
    return None


def find_marker_comments(repo, pr, marker, token):
    # busy PRs run past one page, and missing the marker means double-posting
    marked = []
    page = 1
    while True:
        comments = (
            gh("GET", f"/repos/{repo}/issues/{pr}/comments", token, params={"per_page": PAGE_SIZE, "page": page}) or []
        )
        marked += [c for c in comments if marker in (c.get("body") or "")]
        if len(comments) < PAGE_SIZE:
            return marked
        page += 1


def upsert_comment(repo, pr, marker, body, token, marked=None):
    """Edit the marked comment in place (posting it if there is none) and return its URL.

    Pass `marked` when the caller already fetched it (e.g. to read the old body).
    """
    if marker not in body:
        body = f"{marker}\n\n{body}"
    if marked is None:
        marked = find_marker_comments(repo, pr, marker, token)
    if marked:
        existing, *duplicates = marked
        # concurrent writers can race the lookup and double-post
        for duplicate in duplicates:
            gh("DELETE", f"/repos/{repo}/issues/comments/{duplicate['id']}", token)
        result = gh("PATCH", f"/repos/{repo}/issues/comments/{existing['id']}", token, body={"body": body})
    else:
        result = gh("POST", f"/repos/{repo}/issues/{pr}/comments", token, body={"body": body})
    return (result or {}).get("html_url")


def main():
    parser = argparse.ArgumentParser(description="Create or replace a sticky PR comment.")
    parser.add_argument("--pr", type=int, required=True, help="PR number")
    parser.add_argument("--marker", required=True, help="marker name, rendered as <!-- NAME -->")
    parser.add_argument("--body-file", required=True, help="markdown body; - for stdin")
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY") or DEFAULT_REPO)
    args = parser.parse_args()

    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        sys.exit("missing GH_TOKEN (or GITHUB_TOKEN)")

    if args.body_file == "-":
        body = sys.stdin.read()
    else:
        with open(args.body_file) as f:
            body = f.read()
    if not body.strip():
        sys.exit("refusing to post an empty comment")

    url = upsert_comment(args.repo, args.pr, marker_for(args.marker), body, token)
    print(f"Updated sticky comment on PR #{args.pr}: {url}")


if __name__ == "__main__":
    main()
