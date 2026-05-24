#!/usr/bin/env python3
"""Post (or update) a sticky preview comment on the GitHub PR for this pipeline.

Runs in GitLab CI after the preview/upload jobs so every link it posts is already
live. Currently surfaces the per-branch mobile Dev Tool OTA preview (QR + deep
link); each preview is a section, so web/coverage/etc. can be appended as the
pipeline grows. No-ops (exit 0) when there is no token or no open PR, so it never
turns a pipeline red.
"""

import io
import os
import sys
import urllib.parse

import boto3
import qrcode
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
    return "couchers-devtool://expo-development-client/?url=" + urllib.parse.quote(
        manifest_url, safe=""
    )


def make_qr_png(data):
    qr = qrcode.QRCode(
        border=2, box_size=8, error_correction=qrcode.constants.ERROR_CORRECT_M
    )
    qr.add_data(data)
    qr.make(fit=True)
    buf = io.BytesIO()
    qr.make_image(fill_color="black", back_color="white").save(buf, format="PNG")
    return buf.getvalue()


def mobile_ota_section(s3, bucket, short_sha, domain, platforms):
    lines = [
        "### Mobile Dev Tool preview",
        "",
        "Scan with your phone camera (or tap the deep link on the device) to open this "
        "branch in the installed **Dev Tool** dev client.",
    ]
    for platform in platforms:
        manifest_url = f"https://{short_sha}--ota.{domain}/{platform}/manifest"
        link = deep_link(manifest_url)
        s3.put_object(
            Bucket=bucket,
            Key=f"ota/{short_sha}/{platform}/qr.png",
            Body=make_qr_png(link),
            ContentType="image/png",
        )
        qr_url = f"https://{short_sha}--ota.{domain}/{platform}/qr.png"
        lines += [
            "",
            f"**{platform}**",
            "",
            f'<img src="{qr_url}" alt="QR to open the {platform} build" width="180" height="180" />',
            "",
            "<details><summary>Deep link</summary>",
            "",
            "```",
            link,
            "```",
            "</details>",
        ]
    return "\n".join(lines)


def build_body(sections, sha, pipeline_url):
    parts = [MARKER, "## Preview builds", ""]
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
    token = env("GITHUB_PREVIEW_TOKEN")
    if not token:
        print("GITHUB_PREVIEW_TOKEN not set - skipping preview comment.")
        return

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

    s3 = boto3.client("s3")
    bucket = env("AWS_PREVIEW_BUCKET", required=True)

    sections = [mobile_ota_section(s3, bucket, short_sha, domain, platforms)]
    url = upsert_comment(repo, pr, build_body(sections, sha, pipeline_url), token)
    print(f"Posted preview comment to PR #{pr}: {url}")


if __name__ == "__main__":
    main()
