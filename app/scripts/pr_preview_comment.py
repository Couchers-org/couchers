#!/usr/bin/env python3
"""Post (or update) a sticky preview comment on the GitHub PR for this pipeline.

Runs twice per pipeline: once with --stub at the very start (no needs), which
posts a "previews are building" placeholder within seconds of the push, and
once after the upload jobs, which replaces the placeholder with the real
sections. Each section is only included when its preview actually exists (the
mobile OTA manifest responds on the CDN / the Vercel API knows a deployment
for the commit — the link may still be building when posted), so the job can
run from any branch pipeline. The mobile QR PNG is generated and
uploaded by the OTA build/upload jobs; this script only assembles markdown and
talks to the GitHub and Vercel APIs. Requires GITHUB_PREVIEW_TOKEN; no-ops
(exit 0) when there is no open PR for the commit.
"""

import os
import sys
import time
import urllib.parse

import requests

MARKER = "<!-- couchers-preview-bot -->"
GITHUB_API = "https://api.github.com"
VERCEL_API = "https://api.vercel.com"


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
    names = {"ios": "iOS", "android": "Android"}
    display = {p: names.get(p, p) for p in platforms}

    # GitHub strips inline style, so pad the cell contents with &nbsp; to give
    # the columns some breathing room.
    pad = "&nbsp;" * 4
    lines.append("<table><tr>")
    lines += [f"<th>{pad}{display[p]}{pad}</th>" for p in platforms]
    lines.append("</tr><tr>")
    lines += [
        f'<td align="center">{pad}<img src="{bases[p]}/qr.png" '
        f'alt="QR to open the {display[p]} build" width="180" height="180" />{pad}</td>'
        for p in platforms
    ]
    lines.append("</tr><tr>")
    lines += [
        f'<td align="center">{pad}<a href="{bases[p]}/open.html">Open in Dev Tool</a>{pad}</td>' for p in platforms
    ]
    lines.append("</tr></table>")

    lines += ["", "<details><summary>Deep links</summary>"]
    for platform in platforms:
        lines += ["", f"**{display[platform]}**", "", "```", deep_link(f"{bases[platform]}/manifest"), "```"]
    lines.append("</details>")
    return "\n".join(lines)


def stub_section():
    return "## Previews\n\n⏳ Previews for this commit are building — QR codes and links will appear here once ready."


def no_previews_section():
    return "_No previews are available for this commit._"


def ota_is_live(short_sha, domain, platform):
    try:
        return requests.head(f"https://{short_sha}--ota.{domain}/{platform}/manifest", timeout=10).ok
    except requests.RequestException:
        return False


def web_preview_section(url, with_dev_tool_note):
    host = url.removeprefix("https://")
    lines = [
        "## Web preview",
        "",
        f"This branch's web frontend is deployed at [{host}]({url}).",
    ]
    if with_dev_tool_note:
        lines.append("A Dev Tool branch preview loaded from this comment points its web views there automatically.")
    return "\n".join(lines)


def vercel_get(path, params, token):
    resp = requests.get(
        f"{VERCEL_API}{path}",
        params=params,
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


VERCEL_FAILED_STATES = ("ERROR", "CANCELED", "DELETED")


def resolve_web_preview_url(branch, sha, attempts=6, delay_seconds=10):
    """Resolve the Vercel preview URL for this commit.

    Mirrors app/mobile/scripts/vercel-preview-url.mjs (used by the OTA build job
    to bake the URL into the manifest): the stable branch alias once the branch
    has built successfully (it always serves the branch's latest READY
    deployment), else the in-flight deployment's own immutable URL — assigned
    within seconds of the push, serving once the build finishes. Neither path
    waits on the build. Returns None when unconfigured or nothing is found.
    """
    token = env("VERCEL_TOKEN")
    project_id = env("VERCEL_PROJECT_ID")
    team_id = env("VERCEL_TEAM_ID")
    if not (token and project_id and team_id and branch):
        print("Vercel API not configured - skipping the web preview section.")
        return None

    base = {"projectId": project_id, "teamId": team_id, "limit": "1"}
    for attempt in range(1, attempts + 1):
        if attempt > 1:
            time.sleep(delay_seconds)

        ready = (vercel_get("/v6/deployments", {**base, "state": "READY", "meta-githubCommitRef": branch}, token).get("deployments") or [None])[0]
        if ready:
            aliases = vercel_get(f"/v2/deployments/{ready['uid']}/aliases", {"teamId": team_id}, token)
            branch_alias = next((a["alias"] for a in aliases.get("aliases", []) if "-git-" in (a.get("alias") or "")), None)
            if branch_alias:
                return f"https://{branch_alias}"

        by_sha = (vercel_get("/v6/deployments", {**base, "meta-githubCommitSha": sha}, token).get("deployments") or [None])[0]
        if by_sha and by_sha.get("state") not in VERCEL_FAILED_STATES:
            return f"https://{by_sha['url']}"
        if ready:
            return f"https://{ready['url']}"
        print(f"No Vercel deployment for {branch} ({sha}) yet (attempt {attempt}/{attempts}).")
    return None


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
    marked = [c for c in resp.json() if MARKER in (c.get("body") or "")]
    if marked:
        existing, *duplicates = marked
        # concurrent pipelines for the same commit can race the existence check
        # above and double-post; heal by keeping only the oldest comment
        for duplicate in duplicates:
            requests.delete(
                f"{GITHUB_API}/repos/{repo}/issues/comments/{duplicate['id']}",
                headers=gh_headers(token),
                timeout=30,
            ).raise_for_status()
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


def build_sections(sha, short_sha, domain, platforms):
    live_platforms = [p for p in platforms if ota_is_live(short_sha, domain, p)]
    try:
        web_url = resolve_web_preview_url(env("CI_COMMIT_BRANCH"), sha)
    except requests.RequestException as e:
        # a Vercel API outage must not take the mobile section down with it
        print(f"Vercel API error - skipping the web preview section: {e}")
        web_url = None

    sections = []
    if live_platforms:
        sections.append(mobile_ota_section(short_sha, domain, live_platforms))
    if web_url:
        sections.append(web_preview_section(web_url, with_dev_tool_note=bool(live_platforms)))
    # the stub run already created the comment, so always replace it rather
    # than leave "building…" up forever
    return sections or [no_previews_section()]


def main():
    stub = "--stub" in sys.argv[1:]
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

    sections = [stub_section()] if stub else build_sections(sha, short_sha, domain, platforms)
    url = upsert_comment(repo, pr, build_body(sections, sha, pipeline_url), token)
    print(f"Posted {'stub ' if stub else ''}preview comment to PR #{pr}: {url}")


if __name__ == "__main__":
    main()
