#!/usr/bin/env python3
"""Post (or update) a sticky preview comment on the GitHub PR for this pipeline.

One invocation per preview, each owning a marker-delimited section of the comment:

  --stub           a "building" placeholder, posted within seconds of the push
                   (only if no comment exists yet)
  --section mobile the mobile OTA section, run right after the OTA upload job —
                   so the manifest is known-live, no probing
  --section web    the Vercel web preview section

A section write merges over whatever sections are already posted, so each
preview updates only its own and a web-only commit keeps the mobile section an
earlier commit posted (and vice versa). Requires GITHUB_PREVIEW_TOKEN; no-ops
(exit 0) when there is no open PR for the commit.
"""

import argparse
import os
import sys
import time
import urllib.parse

import requests

MARKER = "<!-- couchers-preview-bot -->"
SECTION_ORDER = ("mobile", "web")
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


def web_preview_section(url):
    return f"## Web preview\n\nView the [Vercel web preview]({url}) for this branch."


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

    Mirrors app/mobile/scripts/vercel-preview-url.mjs: the stable branch alias
    once the branch has built successfully, else the in-flight deployment's own
    URL. Returns None when unconfigured or nothing is found.
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

        ready = (
            vercel_get("/v6/deployments", {**base, "state": "READY", "meta-githubCommitRef": branch}, token).get(
                "deployments"
            )
            or [None]
        )[0]
        if ready:
            aliases = vercel_get(f"/v2/deployments/{ready['uid']}/aliases", {"teamId": team_id}, token)
            branch_alias = next(
                (a["alias"] for a in aliases.get("aliases", []) if "-git-" in (a.get("alias") or "")), None
            )
            if branch_alias:
                return f"https://{branch_alias}"

        by_sha = (
            vercel_get("/v6/deployments", {**base, "meta-githubCommitSha": sha}, token).get("deployments") or [None]
        )[0]
        if by_sha and by_sha.get("state") not in VERCEL_FAILED_STATES:
            return f"https://{by_sha['url']}"
        if ready:
            return f"https://{ready['url']}"
        print(f"No Vercel deployment for {branch} ({sha}) yet (attempt {attempt}/{attempts}).")
    return None


def section_markers(key):
    return f"<!-- couchers-preview:{key}:start -->", f"<!-- couchers-preview:{key}:end -->"


def section_footer(sha, pipeline_url):
    footer = f"commit `{sha[:8]}`"
    if pipeline_url:
        footer += f" · [pipeline]({pipeline_url})"
    return f"<sub>{footer}</sub>"


def wrap_section(key, content):
    start, end = section_markers(key)
    # blank lines around the markers so a heading after them doesn't render literally
    return f"{start}\n\n{content}\n\n{end}"


def parse_sections(body):
    sections = {}
    for key in SECTION_ORDER:
        start, end = section_markers(key)
        i = body.find(start)
        j = body.find(end, i + len(start)) if i != -1 else -1
        if i != -1 and j != -1:
            sections[key] = body[i + len(start) : j].strip()
    return sections


def build_body(existing_body, updates):
    sections = parse_sections(existing_body)
    sections.update(updates)
    rendered = [wrap_section(key, sections[key]) for key in SECTION_ORDER if sections.get(key)]
    if not rendered:
        rendered = [no_previews_section()]
    return "\n\n".join([MARKER, *rendered])


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


def find_marker_comments(repo, pr, token):
    resp = requests.get(
        f"{GITHUB_API}/repos/{repo}/issues/{pr}/comments",
        headers=gh_headers(token),
        params={"per_page": 100},
        timeout=30,
    )
    resp.raise_for_status()
    return [c for c in resp.json() if MARKER in (c.get("body") or "")]


def upsert_comment(repo, pr, body, marked, token):
    if marked:
        existing, *duplicates = marked
        # concurrent pipelines can race the check above and double-post
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


def mobile_update(sha, pipeline_url):
    short_sha = env("CI_COMMIT_SHORT_SHA", required=True)
    domain = env("PREVIEW_DOMAIN", required=True)
    platforms = env("OTA_PLATFORMS", "ios").split()
    return f"{mobile_ota_section(short_sha, domain, platforms)}\n\n{section_footer(sha, pipeline_url)}"


def web_update(sha, pipeline_url):
    try:
        web_url = resolve_web_preview_url(env("CI_COMMIT_BRANCH"), sha)
    except requests.RequestException as e:
        print(f"Vercel API error - leaving the web section unchanged: {e}")
        return None
    if not web_url:
        return None
    return f"{web_preview_section(web_url)}\n\n{section_footer(sha, pipeline_url)}"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--stub", action="store_true", help="post the building placeholder if no comment exists yet")
    mode.add_argument("--section", choices=SECTION_ORDER, help="build and upsert just this preview section")
    args = parser.parse_args()

    token = env("GITHUB_PREVIEW_TOKEN", required=True)
    repo = env("GITHUB_REPO", "Couchers-org/couchers")
    sha = env("CI_COMMIT_SHA", required=True)
    pipeline_url = env("CI_PIPELINE_URL", "")

    pr = find_open_pr(repo, sha, token)
    if not pr:
        print(f"No open PR for {sha} - skipping preview comment.")
        return

    # the resource_group serializes comment writes, so this read is race-free
    marked = find_marker_comments(repo, pr, token)

    if args.stub:
        if marked:
            print(f"Preview comment already exists on PR #{pr} - leaving it for the section updates.")
            return
        body = f"{MARKER}\n\n{stub_section()}"
    else:
        builder = {"mobile": mobile_update, "web": web_update}[args.section]
        content = builder(sha, pipeline_url)
        existing_body = marked[0]["body"] if marked else ""
        # empty update => keep existing sections, so a failed web resolve can't wipe mobile
        body = build_body(existing_body, {args.section: content} if content else {})

    url = upsert_comment(repo, pr, body, marked, token)
    label = "stub" if args.stub else f"{args.section} section"
    print(f"Posted {label} to PR #{pr}: {url}")


if __name__ == "__main__":
    main()
