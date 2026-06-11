#!/usr/bin/env python3
"""Post (or update) a sticky preview comment on the GitHub PR for this pipeline.

The comment is assembled from independently-written items, each wrapped in its
own marker. A fixed layout (see LAYOUT) groups items into Mobile / Web / Backend
/ Other; the last two render as compact one-row link tables. Each writer
rewrites only the items it owns and leaves the rest untouched, so a commit that
rebuilt only some artifacts keeps the others' items from an earlier commit.

Modes:
  --stub          post a "building" placeholder if no comment exists yet
  --items a,b,c   (re)build these items and upsert them (keys: see ITEM_BUILDERS)

Pure stdlib so it runs on any python3 without pip. Requires GITHUB_PREVIEW_TOKEN;
no-ops (exit 0) when there is no open PR for the commit.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

MARKER = "<!-- couchers-preview-bot -->"
GITHUB_API = "https://api.github.com"
VERCEL_API = "https://api.vercel.com"
USER_AGENT = "couchers-preview-bot"

# (heading, style, item keys) - items render in this order; a group with no
# present items is dropped. "rich" renders the item bodies under the heading;
# "table" renders the items as a compact one-row markdown link table.
LAYOUT = [
    ("Mobile", "rich", ["mobile"]),
    ("Web (Vercel)", "rich", ["web"]),
    ("Backend", "table", ["schema", "schema-diff", "emails"]),
    ("Other", "table", ["protos", "bcov", "wcov"]),
]
ITEM_KEYS = [key for _, _, keys in LAYOUT for key in keys]


def env(name, default=None, *, required=False):
    value = os.environ.get(name, default)
    if required and not value:
        sys.exit(f"missing required env var {name}")
    return value


def http_json(method, url, headers, *, params=None, body=None):
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={**headers, "User-Agent": USER_AGENT})
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


def find_open_pr(repo, sha, token):
    for pr in gh("GET", f"/repos/{repo}/commits/{sha}/pulls", token) or []:
        if pr.get("state") == "open":
            return pr["number"]
    return None


def find_marker_comments(repo, pr, token):
    comments = gh("GET", f"/repos/{repo}/issues/{pr}/comments", token, params={"per_page": 100}) or []
    return [c for c in comments if MARKER in (c.get("body") or "")]


def upsert_comment(repo, pr, body, marked, token):
    if marked:
        existing, *duplicates = marked
        # concurrent pipelines can race the check above and double-post
        for duplicate in duplicates:
            gh("DELETE", f"/repos/{repo}/issues/comments/{duplicate['id']}", token)
        result = gh("PATCH", f"/repos/{repo}/issues/comments/{existing['id']}", token, body={"body": body})
    else:
        result = gh("POST", f"/repos/{repo}/issues/{pr}/comments", token, body={"body": body})
    return (result or {}).get("html_url")


def vercel_get(path, params, token):
    return http_json("GET", f"{VERCEL_API}{path}", {"Authorization": f"Bearer {token}"}, params=params)


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
        print("Vercel API not configured - skipping the web preview.")
        return None

    base = {"projectId": project_id, "teamId": team_id, "limit": "1"}
    for attempt in range(1, attempts + 1):
        if attempt > 1:
            time.sleep(delay_seconds)

        ready = (
            (
                vercel_get("/v6/deployments", {**base, "state": "READY", "meta-githubCommitRef": branch}, token) or {}
            ).get("deployments")
            or [None]
        )[0]
        if ready:
            aliases = vercel_get(f"/v2/deployments/{ready['uid']}/aliases", {"teamId": team_id}, token) or {}
            branch_alias = next(
                (a["alias"] for a in aliases.get("aliases", []) if "-git-" in (a.get("alias") or "")), None
            )
            if branch_alias:
                return f"https://{branch_alias}"

        by_sha = (
            (vercel_get("/v6/deployments", {**base, "meta-githubCommitSha": sha}, token) or {}).get("deployments")
            or [None]
        )[0]
        if by_sha and by_sha.get("state") not in VERCEL_FAILED_STATES:
            return f"https://{by_sha['url']}"
        if ready:
            return f"https://{ready['url']}"
        print(f"No Vercel deployment for {branch} ({sha}) yet (attempt {attempt}/{attempts}).")
    return None


def deep_link(manifest_url):
    return "couchers-devtool://expo-development-client/?url=" + urllib.parse.quote(manifest_url, safe="")


def mobile_block(short_sha, domain, platforms):
    apk_url = f"https://android--devtool-builds.{domain}/index.html"
    lines = [
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


def preview_url(host, path=""):
    short_sha = env("CI_COMMIT_SHORT_SHA", required=True)
    domain = env("PREVIEW_DOMAIN", required=True)
    return f"https://{short_sha}--{host}.{domain}/{path}"


def link(label, url):
    return f"[{label}]({url})"


def item_mobile(_sha):
    short_sha = env("CI_COMMIT_SHORT_SHA", required=True)
    domain = env("PREVIEW_DOMAIN", required=True)
    platforms = env("OTA_PLATFORMS", "ios").split()
    return mobile_block(short_sha, domain, platforms)


def item_web(sha):
    try:
        url = resolve_web_preview_url(env("CI_COMMIT_BRANCH"), sha)
    except urllib.error.URLError as e:
        print(f"Vercel API error - leaving the web preview unchanged: {e}")
        return None
    return f"View the [Vercel web preview]({url}) for this branch." if url else None


# table items are deterministic links to the per-commit preview hosts
ITEM_BUILDERS = {
    "mobile": item_mobile,
    "web": item_web,
    "schema": lambda _sha: link("Schema", preview_url("schema", "schema.sql")),
    "schema-diff": lambda _sha: link("Schema diff", preview_url("schema", "diff.html")),
    "emails": lambda _sha: link("Sample emails", preview_url("test-artifacts", "emails/index.html")),
    "protos": lambda _sha: link("Protos", preview_url("protos")),
    "bcov": lambda _sha: link("Backend coverage", preview_url("bcov")),
    "wcov": lambda _sha: link("Web coverage", preview_url("wcov")),
}


def item_markers(key):
    return f"<!-- cp:item:{key}:start -->", f"<!-- cp:item:{key}:end -->"


def parse_items(body):
    items = {}
    for key in ITEM_KEYS:
        start, end = item_markers(key)
        i = body.find(start)
        j = body.find(end, i + len(start)) if i != -1 else -1
        if i != -1 and j != -1:
            items[key] = body[i + len(start) : j].strip()
    return items


def wrap_block(key, payload):
    # markers on their own lines: a marker glued to the payload makes GitHub treat
    # the whole line as an HTML block and skip the markdown (links) on it
    start, end = item_markers(key)
    return f"{start}\n\n{payload}\n\n{end}"


def wrap_cell(key, payload):
    # inside a table row the cell is inline context, so an inline comment is fine
    start, end = item_markers(key)
    return f"{start}{payload}{end}"


def render(items):
    blocks = []
    for heading, style, keys in LAYOUT:
        present = [(key, items[key]) for key in keys if items.get(key)]
        if not present:
            continue
        if style == "rich":
            body = "\n\n".join(wrap_block(key, payload) for key, payload in present)
        else:
            cells = " | ".join(wrap_cell(key, payload) for key, payload in present)
            separators = " | ".join("---" for _ in present)
            body = f"| {cells} |\n| {separators} |"
        blocks.append(f"## {heading}\n\n{body}")
    return blocks


def build_body(existing_body, updates):
    items = parse_items(existing_body)
    items.update(updates)
    blocks = render(items) or ["_No previews are available for this commit._"]
    return "\n\n".join([MARKER, *blocks])


def main():
    parser = argparse.ArgumentParser(description="Upsert the sticky PR preview comment.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--stub", action="store_true", help="post the building placeholder if no comment exists yet")
    mode.add_argument("--items", help="comma-separated item keys to (re)build")
    args = parser.parse_args()

    token = env("GITHUB_PREVIEW_TOKEN", required=True)
    repo = env("GITHUB_REPO", "Couchers-org/couchers")
    sha = env("CI_COMMIT_SHA", required=True)

    pr = find_open_pr(repo, sha, token)
    if not pr:
        print(f"No open PR for {sha} - skipping preview comment.")
        return

    # the resource_group serializes comment writes, so this read is race-free
    marked = find_marker_comments(repo, pr, token)

    if args.stub:
        if marked:
            print(f"Preview comment already exists on PR #{pr} - leaving it for the item updates.")
            return
        body = (
            f"{MARKER}\n\n## Previews\n\n⏳ Previews for this commit are building — links will appear here once ready."
        )
    else:
        keys = [key.strip() for key in args.items.split(",") if key.strip()]
        unknown = [key for key in keys if key not in ITEM_BUILDERS]
        if unknown:
            sys.exit(f"unknown item(s): {', '.join(unknown)}")
        updates = {key: payload for key in keys if (payload := ITEM_BUILDERS[key](sha))}
        existing_body = marked[0]["body"] if marked else ""
        body = build_body(existing_body, updates)

    url = upsert_comment(repo, pr, body, marked, token)
    print(f"Posted {'stub' if args.stub else args.items} to PR #{pr}: {url}")


if __name__ == "__main__":
    main()
