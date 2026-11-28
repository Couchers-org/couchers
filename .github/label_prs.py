# /// script
# requires-python = ">=3.12"
# dependencies = ["pyyaml", "requests"]
# ///
"""
Adds the labels from autoreviewers.yml whose rules match a PR's changed files, and removes those
that no longer match. Labels that no rule defines are left alone.
"""

import json
import os
from pathlib import Path
from urllib.parse import quote

import requests
import yaml

api = f"https://api.github.com/repos/{os.environ['GH_REPO']}/issues/{os.environ['PR_NUMBER']}/labels"
headers = {"Authorization": f"Bearer {os.environ['GH_TOKEN']}"}

# Rule names are "<label> [reviewers]", and one label can come from several rules
rule_labels = {name.split()[0] for name in yaml.safe_load(Path(".github/autoreviewers.yml").read_text())}
matched = {name.split()[0] for name in json.loads(os.environ["FILTER_CHANGES"])}

response = requests.get(api, headers=headers, params={"per_page": 100})
response.raise_for_status()
current = {label["name"] for label in response.json()}

if matched - current:
    print(f"Adding labels: {', '.join(sorted(matched - current))}")
    # This endpoint creates labels that don't exist yet
    requests.post(api, headers=headers, json={"labels": sorted(matched - current)}).raise_for_status()

for label in sorted((rule_labels - matched) & current):
    print(f"Removing label: {label}")
    requests.delete(f"{api}/{quote(label, safe='')}", headers=headers).raise_for_status()
