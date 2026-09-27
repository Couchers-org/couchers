"""
Stale issue bot: when a maintainer adds one of the check labels to an issue, asks whether it's
still wanted, then unassigns or closes the issue if nobody answers within two weeks.

The question carries a hidden marker, and only a question posted since the label was last added
counts, so re-adding the label starts a fresh check. The label comes off once the check is settled.
"""

import os

from github.Issue import Issue
from github.IssueComment import IssueComment

from stale_common import StaleBot, is_bot, mentions

RESPONSE_DAYS = 14

CHECK_ASSIGNEE_LABEL = "stale: check assignee"
CHECK_NEEDED_LABEL = "stale: check still needed"

MANAGED_LABELS = {
    CHECK_ASSIGNEE_LABEL: ("c5def5", "Asks the assignees if they're still on it, unassigns them after two weeks"),
    CHECK_NEEDED_LABEL: ("c5def5", "Asks if this is still needed, closes it after two weeks"),
}

CHECK_MARKER = "<!-- stale-issue-bot:{} -->"


class StaleIssueBot(StaleBot):
    managed_labels = MANAGED_LABELS

    def close(self, issue: Issue) -> None:
        if self.dry_run:
            print(f"[dry run] would close #{issue.number} as not planned")
            return
        issue.edit(state="closed", state_reason="not_planned")
        print(f"Closed #{issue.number} as not planned")

    def ask(self, issue: Issue, label: str, logins: list[str]) -> None:
        if label == CHECK_ASSIGNEE_LABEL:
            question = (
                "are you still working on it? Leave a comment if you'd like to keep it, otherwise I'll unassign "
                "you in two weeks so that someone else can pick it up."
            )
        else:
            question = (
                "is this still something we should address? Leave a comment if so, otherwise I'll close it in "
                "two weeks."
            )
        greeting = f"{mentions(logins)} CouchersBot here!" if logins else "CouchersBot here!"
        self.comment(
            issue.number,
            f"{greeting} This issue was tagged with <code>{label}</code>, so I'm checking in: {question}"
            f"{CHECK_MARKER.format(label)}",
        )

    def expire(self, issue: Issue, label: str, assignees: list[str]) -> None:
        if label == CHECK_ASSIGNEE_LABEL:
            self.unassign(issue.number, assignees)
            self.comment(
                issue.number,
                f"No reply in two weeks, so I've unassigned {', '.join(assignees)}. This issue is up for grabs "
                f"again, comment here if you'd like to take it on!",
            )
        else:
            self.comment(
                issue.number,
                "No reply in two weeks, so I'm closing this as not planned. If it's still relevant, comment here "
                "and we can reopen it.",
            )
            self.close(issue)

    def check(self, issue: Issue, label: str, comments: list[IssueComment]) -> None:
        labelled_at = max(
            (e.created_at for e in issue.get_events() if e.event == "labeled" and e.label and e.label.name == label),
            default=issue.created_at,
        )
        assignees = [assignee.login for assignee in issue.assignees]

        if label == CHECK_ASSIGNEE_LABEL:
            if not assignees:
                print(f"#{issue.number}: {label!r} but nobody is assigned")
                self.remove_label(issue, label)
                return
            to_ask = assignees
        else:
            to_ask = list(dict.fromkeys(([] if is_bot(issue.user) else [issue.user.login]) + assignees))

        marker = CHECK_MARKER.format(label)
        asked = [c for c in comments if is_bot(c.user) and marker in c.body and c.created_at >= labelled_at]
        if not asked:
            self.ask(issue, label, to_ask)
            return
        asked_at = asked[-1].created_at

        replies = [c for c in comments if c.created_at > asked_at and not is_bot(c.user)]
        if label == CHECK_ASSIGNEE_LABEL:
            replies = [c for c in replies if c.user.login in assignees]
        if replies:
            print(f"#{issue.number}: {label!r} answered by {replies[0].user.login}")
            self.remove_label(issue, label)
            return

        days = (self.now - asked_at).days
        if days < RESPONSE_DAYS:
            print(f"#{issue.number}: {label!r} asked {days} days ago, waiting")
            return

        self.expire(issue, label, assignees)
        self.remove_label(issue, label)

    def process(self, issue: Issue) -> None:
        labels = {label.name for label in issue.labels}
        checks = [label for label in MANAGED_LABELS if label in labels]
        if issue.pull_request or issue.state != "open" or not checks:
            return
        comments = list(issue.get_comments())
        for label in checks:
            self.check(issue, label, comments)

    def run(self) -> None:
        if self.dry_run:
            print("Dry run: no comments, labels, assignees or issue states will be changed\n")
        self.ensure_labels()

        issue_number = os.environ.get("ISSUE_NUMBER", "").strip()
        if issue_number:
            issues = [self.repo.get_issue(int(issue_number))]
        else:
            by_number = {
                issue.number: issue for label in MANAGED_LABELS for issue in self.repo.get_issues(labels=[label])
            }
            issues = list(by_number.values())
        self.process_all(issues, self.process)


if __name__ == "__main__":
    StaleIssueBot().run()
