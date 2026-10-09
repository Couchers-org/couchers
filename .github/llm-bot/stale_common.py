"""
Plumbing shared by the stale PR and stale issue bots: dry-run aware GitHub writes and a loop
that keeps going past individual failures.
"""

import os
import sys
import traceback
from collections.abc import Callable, Iterable
from datetime import datetime, timezone
from typing import Any, TypeVar

from github import Auth, Github
from github.Issue import Issue
from github.PullRequest import PullRequest

# accounts whose activity doesn't mean anyone is working on the pull request
BOT_LOGINS = {"CouchersBot"}

T = TypeVar("T", Issue, PullRequest)


def is_bot(user: Any) -> bool:
    return user is None or user.type == "Bot" or user.login in BOT_LOGINS


def mentions(logins: list[str]) -> str:
    return " ".join(f"@{login}" for login in logins)


class StaleBot:
    def __init__(self) -> None:
        self.token = os.environ["GITHUB_TOKEN"]
        self.dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"
        self.github = Github(auth=Auth.Token(self.token))
        self.repo = self.github.get_repo(os.environ["REPOSITORY"])
        self.now = datetime.now(timezone.utc)

    def add_label(self, item: Issue | PullRequest, name: str) -> None:
        if self.dry_run:
            print(f"[dry run] would add {name!r} to #{item.number}")
            return
        item.add_to_labels(name)
        print(f"Added {name!r} to #{item.number}")

    def remove_label(self, item: Issue | PullRequest, name: str) -> None:
        if self.dry_run:
            print(f"[dry run] would remove {name!r} from #{item.number}")
            return
        item.remove_from_labels(name)
        print(f"Removed {name!r} from #{item.number}")

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

    def process_all(self, items: Iterable[T], process: Callable[[T], None]) -> None:
        failures = []
        for item in items:
            try:
                process(item)
            except Exception:
                print(f"Error processing #{item.number}", file=sys.stderr)
                traceback.print_exc()
                failures.append(item.number)

        if failures:
            print(f"\nFailed on: {', '.join(f'#{number}' for number in failures)}", file=sys.stderr)
            sys.exit(1)
