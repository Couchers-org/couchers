"""
Stale PR bot: reminds about, then unassigns and marks as abandoned, pull requests that
have gone quiet. Only pull requests with the `stale: pr` label are tracked.

Each reminder carries a hidden stage marker, and the next stage is due two weeks after the
latest one. Human activity after a marker puts the pull request back at the start. The
`stale: *` labels mirror the stage for visibility only.
"""

import os
import re
from collections.abc import Iterable
from datetime import datetime
from typing import Any, Optional

import requests
from github.IssueComment import IssueComment
from github.PullRequest import PullRequest
from github.PullRequestReview import PullRequestReview

from stale_common import StaleBot, is_bot, mentions

REMINDER_INTERVAL_DAYS = 14

STAGE_MARKER = "<!-- stale-pr-bot:stage={} -->"
STAGE_MARKER_RE = re.compile(r"<!-- stale-pr-bot:stage=(\d) -->")

TRACKED_LABEL = "stale: pr"
FIRST_REMINDER_LABEL = "stale: first reminder"
SECOND_REMINDER_LABEL = "stale: second reminder"
ABANDONED_LABEL = "stale: abandoned"

STAGE_LABELS = {1: FIRST_REMINDER_LABEL, 2: SECOND_REMINDER_LABEL, 3: ABANDONED_LABEL}

PROJECT_TITLE = "Couchers Engineering"
STATUS_FIELD_NAME = "Status"
ABANDONED_OPTION_NAME = "Abandoned"

GRAPHQL_URL = "https://api.github.com/graphql"

LINKED_ISSUES_QUERY = """
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      closingIssuesReferences(first: 20) {
        nodes {
          id
          number
          assignees(first: 20) { nodes { login } }
        }
      }
    }
  }
}
"""

PROJECT_ITEMS_QUERY = """
query($id: ID!) {
  node(id: $id) {
    ... on PullRequest { projectItems(first: 20) { nodes { id project { id title } } } }
    ... on Issue { projectItems(first: 20) { nodes { id project { id title } } } }
  }
}
"""

STATUS_FIELD_QUERY = """
query($projectId: ID!, $fieldName: String!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      field(name: $fieldName) {
        ... on ProjectV2SingleSelectField {
          id
          options { id name }
        }
      }
    }
  }
}
"""

SET_STATUS_MUTATION = """
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {
    projectId: $projectId,
    itemId: $itemId,
    fieldId: $fieldId,
    value: { singleSelectOptionId: $optionId }
  }) {
    projectV2Item { id }
  }
}
"""


class StalePRBot(StaleBot):
    def __init__(self) -> None:
        super().__init__()
        self.status_options: dict[str, tuple[str, dict[str, str]]] = {}

    def graphql(self, query: str, variables: dict[str, Any]) -> dict[str, Any]:
        response = requests.post(
            GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers={"Authorization": f"bearer {self.token}"},
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            raise RuntimeError(f"GraphQL request failed: {payload['errors']}")
        return payload["data"]

    # ------------------------------------------------------------------
    # Project board
    # ------------------------------------------------------------------

    def linked_issues(self, pr: PullRequest) -> list[dict[str, Any]]:
        """The issues this pull request would close, which is where the work is actually assigned."""
        owner, name = self.repo.full_name.split("/")
        data = self.graphql(LINKED_ISSUES_QUERY, {"owner": owner, "name": name, "number": pr.number})
        return [
            {
                "id": node["id"],
                "number": node["number"],
                "assignees": [assignee["login"] for assignee in node["assignees"]["nodes"]],
            }
            for node in data["repository"]["pullRequest"]["closingIssuesReferences"]["nodes"]
        ]

    def project_item(self, node_id: str) -> Optional[dict[str, Any]]:
        data = self.graphql(PROJECT_ITEMS_QUERY, {"id": node_id})
        for item in data["node"]["projectItems"]["nodes"]:
            if item["project"]["title"] == PROJECT_TITLE:
                return item
        return None

    def status_field(self, project_id: str) -> tuple[str, dict[str, str]]:
        if project_id not in self.status_options:
            data = self.graphql(STATUS_FIELD_QUERY, {"projectId": project_id, "fieldName": STATUS_FIELD_NAME})
            field = data["node"]["field"]
            if not field:
                raise RuntimeError(f"No single-select field {STATUS_FIELD_NAME!r} on project {PROJECT_TITLE!r}")
            self.status_options[project_id] = (field["id"], {o["name"]: o["id"] for o in field["options"]})
        return self.status_options[project_id]

    def set_project_status(self, node_id: str, what: str, option_name: str) -> None:
        item = self.project_item(node_id)
        if not item:
            print(f"{what} is not on the {PROJECT_TITLE!r} board, leaving its status alone")
            return

        project_id = item["project"]["id"]
        field_id, options = self.status_field(project_id)
        if option_name not in options:
            raise RuntimeError(f"No {option_name!r} option on the {STATUS_FIELD_NAME!r} field of {PROJECT_TITLE!r}")

        if self.dry_run:
            print(f"[dry run] would set {what} to {option_name!r} on {PROJECT_TITLE!r}")
            return
        self.graphql(
            SET_STATUS_MUTATION,
            {
                "projectId": project_id,
                "itemId": item["id"],
                "fieldId": field_id,
                "optionId": options[option_name],
            },
        )
        print(f"Set {what} to {option_name!r} on {PROJECT_TITLE!r}")

    # ------------------------------------------------------------------
    # Staleness
    # ------------------------------------------------------------------

    @staticmethod
    def last_activity(
        pr: PullRequest,
        comments: list[IssueComment],
        reviews: list[PullRequestReview],
        head_committed_at: datetime,
    ) -> datetime:
        """When a human last did anything to the pull request."""
        times = [pr.created_at, head_committed_at]
        times += [c.created_at for c in comments if not is_bot(c.user)]
        times += [c.created_at for c in pr.get_review_comments() if not is_bot(c.user)]
        times += [r.submitted_at for r in reviews]
        return max(times)

    @staticmethod
    def current_stage(comments: list[IssueComment], since: datetime) -> tuple[int, datetime]:
        """The stage of the latest reminder posted after `since`, and when it was posted."""
        stage, posted_at = 0, since
        for c in comments:
            match = STAGE_MARKER_RE.search(c.body)
            if match and is_bot(c.user) and c.created_at > since:
                stage, posted_at = int(match.group(1)), c.created_at
        return stage, posted_at

    def set_stage(self, pr: PullRequest, labels: set[str], stage: int) -> None:
        for label_stage, name in STAGE_LABELS.items():
            if name in labels and label_stage != stage:
                self.remove_label(pr, name)
        if stage and STAGE_LABELS[stage] not in labels:
            self.add_label(pr, STAGE_LABELS[stage])

    # ------------------------------------------------------------------
    # Actions
    # ------------------------------------------------------------------

    @staticmethod
    def owners(pr: PullRequest, linked: list[dict[str, Any]]) -> list[str]:
        logins = [assignee.login for assignee in pr.assignees]
        logins += [login for issue in linked for login in issue["assignees"]]
        return list(dict.fromkeys(logins)) or [pr.user.login]

    def remind(self, pr: PullRequest, days: int, stage: int, linked: list[dict[str, Any]]) -> None:
        if stage == 1:
            body = (
                f"{mentions(self.owners(pr, linked))} CouchersBot here! There haven't been any updates on this "
                f"pull request in {days} days, are you still working on it? If not, please let us know."
            )
        else:
            body = (
                f"{mentions(self.owners(pr, linked))} CouchersBot again: still no updates after {days} days. If "
                f"you're still on this, just say so, otherwise we'll mark it as abandoned in a couple of weeks so "
                f"that someone else can pick it up."
            )
        body += f"\n\n<sub>Maintainers: remove the <code>{TRACKED_LABEL}</code> label to stop these reminders.</sub>"
        body += STAGE_MARKER.format(stage)
        self.comment(pr.number, body)

    def abandon(self, pr: PullRequest, days: int, linked: list[dict[str, Any]]) -> None:
        self.comment(
            pr.number,
            f"This pull request has had no updates in {days} days, so we're marking it as abandoned. "
            f"{mentions(self.owners(pr, linked))}, thanks for the work so far! Anyone is welcome to pick it up "
            f"from here, and of course that includes you if you find the time again.{STAGE_MARKER.format(3)}",
        )
        pr_people = {pr.user.login, *(assignee.login for assignee in pr.assignees)}
        for issue in linked:
            others = [login for login in issue["assignees"] if login not in pr_people]
            if others:
                print(f"#{issue['number']} is assigned to {', '.join(others)}, leaving it alone")
                continue
            if issue["assignees"]:
                self.unassign(issue["number"], issue["assignees"])
            self.comment(
                issue["number"],
                f"The pull request for this, #{pr.number}, has had no updates in {days} days, so this issue is "
                f"up for grabs again. Comment here if you'd like to take it on!",
            )
            self.set_project_status(issue["id"], f"#{issue['number']}", ABANDONED_OPTION_NAME)
        self.set_project_status(pr.node_id, f"#{pr.number}", ABANDONED_OPTION_NAME)

    def process(self, pr: PullRequest) -> None:
        labels = {label.name for label in pr.labels}
        if TRACKED_LABEL not in labels:
            self.set_stage(pr, labels, 0)
            return
        if is_bot(pr.user):
            print(f"#{pr.number}: opened by a bot, skipping")
            return

        comments = list(pr.get_issue_comments())
        reviews = [r for r in pr.get_reviews() if r.submitted_at and not is_bot(r.user)]
        head_committed_at = self.repo.get_commit(pr.head.sha).commit.committer.date

        last_activity = self.last_activity(pr, comments, reviews, head_committed_at)
        current, stage_started = self.current_stage(comments, last_activity)
        due = current
        if current < 3 and (self.now - stage_started).days >= REMINDER_INTERVAL_DAYS:
            due = current + 1
        days = (self.now - last_activity).days
        print(f"#{pr.number} by {pr.user.login}: {days} days since last activity, stage {current} -> {due}")

        self.set_stage(pr, labels, due)
        if due > current:
            linked = self.linked_issues(pr)
            if due == 3:
                self.abandon(pr, days, linked)
            else:
                self.remind(pr, days, due, linked)

    def run(self) -> None:
        if self.dry_run:
            print("Dry run: no comments, labels, assignees or project statuses will be changed\n")

        pr_number = os.environ.get("PR_NUMBER", "").strip()
        prs: Iterable[PullRequest]
        if pr_number:
            prs = [self.repo.get_pull(int(pr_number))]
        else:
            prs = self.repo.get_pulls(state="open")
        self.process_all(prs, self.process)


if __name__ == "__main__":
    StalePRBot().run()
