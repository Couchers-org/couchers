#!/usr/bin/env python3
"""Post (or update) a sticky preview comment on the GitHub PR for this pipeline.

Runs in GitLab CI after the upload jobs so every link it posts is already live.
Each preview is a section, so web/coverage/etc. can be appended as the pipeline
grows. The mobile QR PNG is generated and uploaded by the OTA build/upload jobs;
this script only assembles markdown and talks to the GitHub API. Requires
GITHUB_PREVIEW_TOKEN; no-ops (exit 0) when there is no open PR for the commit.
"""

import os
import sys
import urllib.parse

import requests

MARKER = "<!-- couchers-preview-bot -->"
GITHUB_API = "https://api.github.com"


def env(name, default=None, *, required=False):
    value = os.environ.get(name, default)
    if required and not value:
        sys.exit(f"missing required env var {name}")
    return value


def gh_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def deep_link(manifest_url):
    return "couchers-devtool://expo-development-client/?url=" + urllib.parse.quote(manifest_url, safe="")


def mobile_ota_section(short_sha, domain, platforms):
    apk_url = f"https://android--devtool-builds.{domain}/index.html"
    lines = [
        "## Mobile Dev Tool preview",
        "",
        f"Download the Dev Tool for iOS from TestFlight, for Android, you can get the latest .apk [here]({apk_url}).",
        "",
        "Scan the QR with your phone camera, or tap **Open in Dev Tool** on the device, "
        "to open this branch in the installed **Dev Tool** dev client.",
        "",
    ]

    bases = {p: f"https://{short_sha}--ota.{domain}/{p}" for p in platforms}

    # Raw HTML table so the per-platform QRs render side by side.
    lines.append("<table><tr>")
    lines += [f"<th>{p}</th>" for p in platforms]
    lines.append("</tr><tr>")
    lines += [
        f'<td align="center"><img src="{bases[p]}/qr.png" '
        f'alt="QR to open the {p} build" width="180" height="180" /></td>'
        for p in platforms
    ]
    lines.append("</tr><tr>")
    lines += [f'<td align="center"><a href="{bases[p]}/open.html">Open in Dev Tool</a></td>' for p in platforms]
    lines.append("</tr></table>")

    lines += ["", "<details><summary>Deep links</summary>"]
    for platform in platforms:
        lines += ["", f"**{platform}**", "", "```", deep_link(f"{bases[platform]}/manifest"), "```"]
    lines.append("</details>")
    return "\n".join(lines)


def build_body(sections, sha, pipeline_url):
    parts = [MARKER]
    parts += [section for section in sections if section]
    footer = f"commit `{sha[:8]}`"
    if pipeline_url:
        footer += f" · [pipeline]({pipeline_url})"
    parts += ["", "---", f"<sub>{footer}</sub>"]
    return "\n".join(parts)


def find_open_pr(repo, sha, token):
    resp = requests.get(
        f"{GITHUB_API}/repos/{repo}/commits/{sha}/pulls",
        headers=gh_headers(token),
        timeout=30,
    )
    resp.raise_for_status()
    for pr in resp.json():
        if pr.get("state") == "open":
            return pr["number"]
    return None


def upsert_comment(repo, pr, body, token):
    resp = requests.get(
        f"{GITHUB_API}/repos/{repo}/issues/{pr}/comments",
        headers=gh_headers(token),
        params={"per_page": 100},
        timeout=30,
    )
    resp.raise_for_status()
    existing = next((c for c in resp.json() if MARKER in (c.get("body") or "")), None)
    if existing:
        resp = requests.patch(
            f"{GITHUB_API}/repos/{repo}/issues/comments/{existing['id']}",
            headers=gh_headers(token),
            json={"body": body},
            timeout=30,
        )
    else:
        resp = requests.post(
            f"{GITHUB_API}/repos/{repo}/issues/{pr}/comments",
            headers=gh_headers(token),
            json={"body": body},
            timeout=30,
        )
    resp.raise_for_status()
    return resp.json().get("html_url")


def main():
    token = env("GITHUB_PREVIEW_TOKEN", required=True)
    repo = env("GITHUB_REPO", "Couchers-org/couchers")
    sha = env("CI_COMMIT_SHA", required=True)
    short_sha = env("CI_COMMIT_SHORT_SHA", required=True)
    domain = env("PREVIEW_DOMAIN", required=True)
    pipeline_url = env("CI_PIPELINE_URL", "")
    platforms = env("OTA_PLATFORMS", "ios").split()

    pr = find_open_pr(repo, sha, token)
    if not pr:
        print(f"No open PR for {sha} - skipping preview comment.")
        return

    sections = [mobile_ota_section(short_sha, domain, platforms)]
    url = upsert_comment(repo, pr, build_body(sections, sha, pipeline_url), token)
    print(f"Posted preview comment to PR #{pr}: {url}")


if __name__ == "__main__":
    main()
