"""
Stale PR bot: reminds about, then unassigns and marks as abandoned, pull requests that
have gone quiet.

Escalation state lives in the `stale: *` labels on the pull request, so runs are
idempotent and removing the labels puts a pull request back at the start.
"""

import os
import sys
import traceback
from datetime import datetime, timezone
from typing import Any, Optional

import requests
from github import Auth, Github
from github.PullRequest import PullRequest

FIRST_REMINDER_DAYS = 14
SECOND_REMINDER_DAYS = 28
ABANDON_DAYS = 42

EXEMPT_LABEL = "stale: exempt"
FIRST_REMINDER_LABEL = "stale: first reminder"
SECOND_REMINDER_LABEL = "stale: second reminder"
ABANDONED_LABEL = "stale: abandoned"

# created on demand so the bot also works on a repo that doesn't have them yet
MANAGED_LABELS = {
    EXEMPT_LABEL: ("ededed", "Stale PR bot ignores this pull request"),
    FIRST_REMINDER_LABEL: ("fef2c0", "No activity for two weeks"),
    SECOND_REMINDER_LABEL: ("f9d0c4", "No activity for four weeks"),
    ABANDONED_LABEL: ("d93f0b", "No activity for six weeks, up for grabs"),
}

STAGE_LABELS = {1: FIRST_REMINDER_LABEL, 2: SECOND_REMINDER_LABEL, 3: ABANDONED_LABEL}

# accounts whose activity doesn't mean anyone is working on the pull request
BOT_LOGINS = {"CouchersBot"}

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


def is_bot(user: Any) -> bool:
    return user is None or user.type == "Bot" or user.login in BOT_LOGINS


def mentions(logins: list[str]) -> str:
    return " ".join(f"@{login}" for login in logins)


class StalePRBot:
    def __init__(self) -> None:
        self.token = os.environ["GITHUB_TOKEN"]
        self.dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"
        self.github = Github(auth=Auth.Token(self.token))
        self.repo = self.github.get_repo(os.environ["REPOSITORY"])
        self.now = datetime.now(timezone.utc)
        self.status_options: dict[str, tuple[str, dict[str, str]]] = {}

    # ------------------------------------------------------------------
    # GitHub helpers
    # ------------------------------------------------------------------

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

    def ensure_labels(self) -> None:
        existing = {label.name for label in self.repo.get_labels()}
        for name, (color, description) in MANAGED_LABELS.items():
            if name in existing:
                continue
            if self.dry_run:
                print(f"[dry run] would create label {name!r}")
                continue
            self.repo.create_label(name, color, description)
            print(f"Created label {name!r}")

    def add_label(self, pr: PullRequest, name: str) -> None:
        if self.dry_run:
            print(f"[dry run] would add {name!r} to #{pr.number}")
            return
        pr.add_to_labels(name)
        print(f"Added {name!r} to #{pr.number}")

    def remove_label(self, pr: PullRequest, name: str) -> None:
        if self.dry_run:
            print(f"[dry run] would remove {name!r} from #{pr.number}")
            return
        pr.remove_from_labels(name)
        print(f"Removed {name!r} from #{pr.number}")

    def comment(self, number: int, body: str) -> None:
        if self.dry_run:
            print(f"[dry run] would comment on #{number}:\n{body}\n")
            return
        self.repo.get_issue(number).create_comment(body)
        print(f"Commented on #{number}")

    def unassign(self, number: int, logins: list[str]) -> None:
        if self.dry_run:
            print(f"[dry run] would unassign {', '.join(logins)} from #{number}")
            return
        self.repo.get_issue(number).remove_from_assignees(*logins)
        print(f"Unassigned {', '.join(logins)} from #{number}")

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

    def last_activity(self, pr: PullRequest) -> datetime:
        """When a human last did anything to the pull request."""
        times = [pr.created_at, self.repo.get_commit(pr.head.sha).commit.committer.date]
        times += [c.created_at for c in pr.get_issue_comments() if not is_bot(c.user)]
        times += [c.created_at for c in pr.get_review_comments() if not is_bot(c.user)]
        times += [r.submitted_at for r in pr.get_reviews() if r.submitted_at and not is_bot(r.user)]
        return max(times)

    @staticmethod
    def due_stage(days: int) -> int:
        if days >= ABANDON_DAYS:
            return 3
        if days >= SECOND_REMINDER_DAYS:
            return 2
        if days >= FIRST_REMINDER_DAYS:
            return 1
        return 0

    @staticmethod
    def current_stage(labels: set[str]) -> int:
        for stage in (3, 2, 1):
            if STAGE_LABELS[stage] in labels:
                return stage
        return 0

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
        body += f"\n\n<sub>Maintainers: add the <code>{EXEMPT_LABEL}</code> label to stop these reminders.</sub>"
        self.comment(pr.number, body)

    def abandon(self, pr: PullRequest, days: int, linked: list[dict[str, Any]]) -> None:
        self.comment(
            pr.number,
            f"This pull request has had no updates in {days} days, so we're marking it as abandoned. "
            f"{mentions(self.owners(pr, linked))}, thanks for the work so far! Anyone is welcome to pick it up "
            f"from here, and of course that includes you if you find the time again.",
        )
        for issue in linked:
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
        if EXEMPT_LABEL in labels:
            print(f"#{pr.number}: exempt, skipping")
            return
        if is_bot(pr.user):
            print(f"#{pr.number}: opened by a bot, skipping")
            return

        days = (self.now - self.last_activity(pr)).days
        due = self.due_stage(days)
        current = self.current_stage(labels)
        print(f"#{pr.number} by {pr.user.login}: {days} days since last activity, stage {current} -> {due}")

        if due == current:
            return

        # a pull request that jumps several stages at once only gets the action for the stage it lands on
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
        self.ensure_labels()

        pr_number = os.environ.get("PR_NUMBER", "").strip()
        if pr_number:
            prs = [self.repo.get_pull(int(pr_number))]
        else:
            prs = self.repo.get_pulls(state="open")

        failures = []
        for pr in prs:
            try:
                self.process(pr)
            except Exception:
                print(f"Error processing #{pr.number}", file=sys.stderr)
                traceback.print_exc()
                failures.append(pr.number)

        if failures:
            print(f"\nFailed on: {', '.join(f'#{number}' for number in failures)}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    StalePRBot().run()
