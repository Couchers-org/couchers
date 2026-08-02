"""
Release Note Bot with LLM-powered decision making.

This bot processes approved/merged PRs using an LLM to determine whether
they should be included in release notes, and if so, generates a one-line
summary in the appropriate format.
"""

import os
import random
import sys
import re
from typing import Optional, List, Dict, Any
from enum import Enum

import requests
from pydantic import BaseModel, Field
from a5.ai import LLM
from github import Github, Auth

from slack import send_slack_message


# ============================================================================
# Configuration
# ============================================================================

RELEASE_NOTES_PENDING_LABEL = "release notes: pending"
RELEASE_NOTES_NOT_NEEDED_LABEL = "release notes: not needed"

SLACK_INTROS = [
    "Ooh la la",
    "Would you look at that",
    "Hey, check this out",
    "Stop the press",
    "Hot off the couch",
    "Big news, everyone",
    "Well well well",
    "Ding ding ding",
    "Fresh out of the oven",
    "Guess what",
    "Drumroll please",
    "You love to see it",
    "Another one",
    "Couch update incoming",
    "Breaking",
]

SLACK_VERBS = [
    "shipped something new",
    "just shipped something",
    "has been busy",
    "landed a thing",
    "cooked something up",
    "made the site a bit better",
    "pushed something worth knowing about",
]

SYSTEM_PROMPT = """You are the Release Note Bot for Couchers.org, a non-profit couch surfing platform.

**Important context about Couchers.org:**
- Couchers is a couch surfing platform for end users (not a library or framework)
- Release notes should focus on changes that are significant and noticeable to end users
- Release notes can also include major technical infrastructure changes and particularly important technical work

**Your job is to analyze a pull request and determine:**
1. Whether it should be included in the release notes
2. If yes, generate a one-line summary in the correct format

# What to INCLUDE in Release Notes

Include PRs that fall into these categories:

1. **New User-Facing Features**
   - New functionality that users can see and use
   - Examples: same gender filter, invite friends feature, new map search, notification feed

2. **Significant UX Improvements**
   - Major redesigns or improvements to existing features
   - Examples: redesigned edit profile page, new landing page, improved reference flow

3. **Important Bug Fixes**
   - Bugs that affect many users or critical functionality
   - Examples: Brisbane missing from map search, unread notification filter broken
   - NOT: minor edge case fixes, typos, CSS tweaks that users wouldn't notice

4. **Safety & Moderation Features**
   - Features that improve platform safety
   - Examples: reporting buttons, block functionality, moderation tools

5. **Community & Events Features**
   - Features related to community building and events
   - Examples: event co-organizers, event reminders, community pages

6. **Major Technical Infrastructure & Important Technical Work**
   - Significant technical changes that improve the platform
   - Examples: mobile app work, IPv6 support, CDN for faster loading
   - Major refactors that improve performance, reliability, or maintainability
   - Serious technical debt cleanup that reduces bugs or improves stability
   - Architectural improvements that enable future features
   - Examples: "Refactored notification system for better reliability", "Cleaned up legacy authentication code to improve security"
   - NOT: routine dependency updates, minor refactoring, CI/CD improvements

# What to EXCLUDE from Release Notes

Do NOT include PRs that are:

1. **Routine Internal Code Changes**
   - Minor refactoring that doesn't significantly improve performance, reliability, or maintainability
   - Small code cleanup and minor tech debt fixes
   - Internal tooling improvements
   - Note: MAJOR refactors and serious tech debt cleanup SHOULD be included (see category 6 above)

2. **Developer Experience Changes**
   - CI/CD improvements
   - Testing infrastructure
   - Development environment fixes
   - Build process changes

3. **Dependency Updates**
   - Routine library upgrades (unless they unlock specific new features or fix critical issues)
   - Package bumps

4. **Minor Bug Fixes**
   - Typos in UI text
   - Small CSS tweaks
   - Edge case fixes affecting very few users

5. **Documentation**
   - README updates
   - Code comments
   - Internal documentation

# Release Note Format

If a PR should be included, generate a one-line summary following this format:

```
Brief description of what changed and why it matters to users
```

**Rules for the summary:**
- Write in past tense (e.g., "Added", "Fixed", "Implemented", "Improved")
- Focus on WHAT changed from the user's perspective, not HOW it was implemented
- Be concise but informative (1 sentence maximum)
- Don't mention technical details unless necessary for user understanding
- Don't include contributor names or PR numbers (those will be added automatically)
- Try to explain to non-technical users what the impact is to them

**Good examples:**
- "Added same gender only filter for strong verified users"
- "Fixed a map search bug that made Brisbane (Australia) not show up in search results"
- "Implemented invite friends feature with personalized shareable links"
- "Redesigned edit profile page to be more user-friendly and highlight important sections"
- "Added quick decline option in host request emails to easily decline requests without needing to log in"
- "Refactored notification delivery system to make sure everyone gets notifications reliably and on time"
- "Cleaned up authentication code to fix intermittent login issues"
- "Rewrote search query builder to improve performance as our userbase grows"

**Bad examples:**
- "Refactored helper function to be more readable" (minor refactoring)
- "Updated MUI to v6" (routine dependency update)
- "Fixed typo in button label" (too minor)
- "Moved utility functions to separate file" (minor code organization)

# Decision Making Process

1. Read the PR title, description, and files changed carefully
2. Determine if this is something an end user would notice or care about, OR if it's a particularly important technical improvement
3. If unsure, err on the side of NOT including it (we can always add it later)
4. If it should be included, write a clear, user-focused one-line summary

Remember: Release notes are primarily for END USERS, but can also include particularly important technical work that improves the platform!
"""


# ============================================================================
# Structured Output Schema
# ============================================================================

class ReleaseNotesDecision(str, Enum):
    """Decision on whether PR should be in release notes."""
    INCLUDE = "include"
    EXCLUDE = "exclude"


class BotDecision(BaseModel):
    """Structured output from the LLM defining actions to take."""

    reasoning: str = Field(
        description="Brief explanation of why this decision was made"
    )

    decision: ReleaseNotesDecision = Field(
        description="Whether to include this PR in release notes or not"
    )

    release_note: Optional[str] = Field(
        default=None,
        description="One-line summary for release notes (only if decision is INCLUDE). "
                    "Do NOT include contributor names or PR numbers."
    )


# ============================================================================
# Bot Implementation
# ============================================================================

class PRReleaseNotesBot:
    """Release Note Bot with LLM-powered decision making."""

    def __init__(self):
        self.llm = LLM(model=os.environ["LLM_MODEL"])
        self.github_client = Github(auth=Auth.Token(os.environ["GITHUB_TOKEN"]))

        # Get PR details from environment
        self.repo_name = os.environ["REPOSITORY"]
        self.pr_number = int(os.environ["PR_NUMBER"])

        # Get repository and PR objects
        self.repo = self.github_client.get_repo(self.repo_name)
        self.pr = self.repo.get_pull(self.pr_number)

        # Check if already labeled
        self.current_labels = {label.name for label in self.pr.labels}

    def should_process(self) -> bool:
        """Check if this PR should be processed."""
        # Don't process if already labeled
        if RELEASE_NOTES_PENDING_LABEL in self.current_labels:
            print(f"PR #{self.pr_number} already has '{RELEASE_NOTES_PENDING_LABEL}' label, skipping")
            return False
        if RELEASE_NOTES_NOT_NEEDED_LABEL in self.current_labels:
            print(f"PR #{self.pr_number} already has '{RELEASE_NOTES_NOT_NEEDED_LABEL}' label, skipping")
            return False
        return True

    def _find_linked_issues(self) -> List[int]:
        """Find all linked issue numbers from PR body and comments."""
        issue_numbers = set()

        # Regex patterns for finding issue references
        # Matches: #123, fixes #123, closes #123, resolves #123, etc.
        patterns = [
            r'(?:fix(?:es|ed)?|close(?:s|d)?|resolve(?:s|d)?)\s+#(\d+)',
            r'(?:^|\s)#(\d+)(?:\s|$|,|\.)',
        ]

        # Check PR body
        if self.pr.body:
            for pattern in patterns:
                matches = re.finditer(pattern, self.pr.body, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    issue_numbers.add(int(match.group(1)))

        # Check PR comments
        for comment in self.pr.get_issue_comments():
            if comment.body:
                for pattern in patterns:
                    matches = re.finditer(pattern, comment.body, re.IGNORECASE | re.MULTILINE)
                    for match in matches:
                        issue_numbers.add(int(match.group(1)))

        return sorted(list(issue_numbers))

    def _get_pr_conversation(self) -> str:
        """Get all PR comments and reviews as formatted text."""
        conversation = []

        # Get all PR comments (issue comments)
        comments = list(self.pr.get_issue_comments())

        # Get all PR reviews
        reviews = list(self.pr.get_reviews())

        # Get all review comments (inline code comments)
        review_comments = list(self.pr.get_review_comments())

        # Combine and sort by creation time
        all_items = []

        for comment in comments:
            all_items.append({
                'type': 'comment',
                'created_at': comment.created_at,
                'user': comment.user.login,
                'body': comment.body
            })

        for review in reviews:
            if review.body:  # Only include reviews with body text
                all_items.append({
                    'type': 'review',
                    'created_at': review.submitted_at or review.created_at,
                    'user': review.user.login,
                    'state': review.state,
                    'body': review.body
                })

        for review_comment in review_comments:
            all_items.append({
                'type': 'review_comment',
                'created_at': review_comment.created_at,
                'user': review_comment.user.login,
                'path': review_comment.path,
                'body': review_comment.body
            })

        # Sort by creation time
        all_items.sort(key=lambda x: x['created_at'])

        # Format as text
        if not all_items:
            return "(no comments or reviews)"

        for item in all_items:
            if item['type'] == 'comment':
                conversation.append(f"**@{item['user']}** commented:")
                conversation.append(item['body'])
                conversation.append("")
            elif item['type'] == 'review':
                state_emoji = {'APPROVED': '✅', 'CHANGES_REQUESTED': '❌', 'COMMENTED': '💬'}.get(item['state'], '')
                conversation.append(f"**@{item['user']}** {state_emoji} reviewed:")
                conversation.append(item['body'])
                conversation.append("")
            elif item['type'] == 'review_comment':
                conversation.append(f"**@{item['user']}** commented on `{item['path']}`:")
                conversation.append(item['body'])
                conversation.append("")

        return "\n".join(conversation)

    def _get_linked_issue_details(self, issue_number: int) -> Dict[str, Any]:
        """Get details and comments for a linked issue."""
        issue = self.repo.get_issue(issue_number)

        # Get all comments
        comments = list(issue.get_comments())
        comments_text = []

        for comment in comments:
            comments_text.append(f"**@{comment.user.login}** commented:")
            comments_text.append(comment.body)
            comments_text.append("")

        return {
            'number': issue_number,
            'title': issue.title,
            'body': issue.body or "(no description)",
            'author': issue.user.login,
            'state': issue.state,
            'comments': "\n".join(comments_text) if comments_text else "(no comments)"
        }

    def _get_pr_diff(self, max_lines: int = 2000) -> str:
        """Get the PR diff, truncated if necessary."""
        # Get the diff using the GitHub API
        # We need to make a raw request with the diff media type
        headers = {
            'Authorization': f'token {os.environ["GITHUB_TOKEN"]}',
            'Accept': 'application/vnd.github.v3.diff'
        }
        response = requests.get(self.pr.url, headers=headers)
        response.raise_for_status()

        diff = response.text

        if not diff:
            return "(no diff available)"

        # Split into lines and truncate if necessary
        lines = diff.split('\n')

        if len(lines) > max_lines:
            truncated_diff = '\n'.join(lines[:max_lines])
            truncated_diff += f"\n\n... (diff truncated, showing first {max_lines} of {len(lines)} lines)"
            return truncated_diff

        return diff

    def analyze_pr(self) -> BotDecision:
        """Use LLM to analyze the PR and determine if it should be in release notes."""

        # Get PR details
        files_changed = [f.filename for f in self.pr.get_files()]
        files_summary = "\n".join(f"- {f}" for f in files_changed[:20])  # Limit to first 20 files
        if len(files_changed) > 20:
            files_summary += f"\n... and {len(files_changed) - 20} more files"

        # Get PR conversation
        print("Fetching PR conversation...")
        pr_conversation = self._get_pr_conversation()

        # Get PR diff
        print("Fetching PR diff...")
        pr_diff = self._get_pr_diff()

        # Find and fetch linked issues
        print("Finding linked issues...")
        linked_issue_numbers = self._find_linked_issues()
        linked_issues_text = ""

        if linked_issue_numbers:
            print(f"Found {len(linked_issue_numbers)} linked issue(s): {linked_issue_numbers}")
            linked_issues_details = []

            for issue_num in linked_issue_numbers:
                issue_details = self._get_linked_issue_details(issue_num)
                linked_issues_details.append(issue_details)

            linked_issues_text = "\n\n**Linked Issues:**\n\n"
            for issue in linked_issues_details:
                linked_issues_text += f"### Issue #{issue['number']}: {issue['title']}\n\n"
                linked_issues_text += f"**Author:** @{issue['author']}\n"
                linked_issues_text += f"**State:** {issue['state']}\n\n"
                linked_issues_text += f"**Description:**\n{issue['body']}\n\n"
                linked_issues_text += f"**Comments:**\n{issue['comments']}\n\n"
                linked_issues_text += "---\n\n"
        else:
            print("No linked issues found")

        prompt = f"""{SYSTEM_PROMPT}

Analyze this GitHub Pull Request:

**Title:** {self.pr.title}

**Author:** @{self.pr.user.login}

**Description:**
{self.pr.body or "(no description provided)"}

**Files Changed ({len(files_changed)} files):**
{files_summary}

**Diff:**
```diff
{pr_diff}
```

**PR Conversation:**
{pr_conversation}
{linked_issues_text}

Based on the guidelines provided, should this PR be included in the release notes?

If yes, provide a one-line summary suitable for release notes.
If no, explain why not.
"""

        print(f"Analyzing PR #{self.pr_number}: {self.pr.title}")
        print(f"Author: @{self.pr.user.login}")
        print(f"Files changed: {len(files_changed)}")

        # Print the entire prompt for debugging
        print("\n" + "="*80)
        print("FULL PROMPT BEING SENT TO LLM:")
        print("="*80)
        print(prompt)
        print("="*80 + "\n")

        # Call LLM with structured output
        decision_dict = self.llm.json_complete(prompt, response_format=BotDecision)
        decision = BotDecision(**decision_dict)

        print(f"\nLLM Decision: {decision.decision}")
        print(f"Reasoning: {decision.reasoning}")
        if decision.release_note:
            print(f"Release note: {decision.release_note}")

        return decision

    def _format_debug_section(self, decision: BotDecision) -> str:
        """Format the debug information as a collapsible section."""
        debug_info = f"""

<details>
<summary>🤖 Bot Debug Information</summary>

**Model:** `{os.environ.get('LLM_MODEL', 'unknown')}`
**Decision:** `{decision.decision.value}`
**Reasoning:** {decision.reasoning}

</details>"""
        return debug_info

    def apply_decision(self, decision: BotDecision):
        """Apply the bot's decision to the PR."""

        if decision.decision == ReleaseNotesDecision.INCLUDE:
            # Add "release notes: pending" label
            print(f"\nAdding '{RELEASE_NOTES_PENDING_LABEL}' label...")
            self.pr.add_to_labels(RELEASE_NOTES_PENDING_LABEL)

            # Post comment with release note
            if decision.release_note:
                comment_body = f"""## 📝 Release Notes

This PR should be included in the release notes.

**Suggested release note:**

```
{decision.release_note}
```

"""
                comment_body += self._format_debug_section(decision)

                print(f"\nPosting release note comment...")
                self.pr.create_issue_comment(comment_body)

        else:  # EXCLUDE
            # Add "release notes: not needed" label
            print(f"\nAdding '{RELEASE_NOTES_NOT_NEEDED_LABEL}' label...")
            self.pr.add_to_labels(RELEASE_NOTES_NOT_NEEDED_LABEL)

            # Optionally post a comment explaining why
            comment_body = f"""## 📝 Release Notes

This PR does not need to be included in release notes.

**Reason:** {decision.reasoning}
"""
            comment_body += self._format_debug_section(decision)

            print(f"\nPosting exclusion comment...")
            self.pr.create_issue_comment(comment_body)

        print(f"\n✅ Successfully processed PR #{self.pr_number}")

    def announce_to_slack(self, decision: BotDecision):
        """Announce an included PR to Slack."""

        if decision.decision != ReleaseNotesDecision.INCLUDE or not decision.release_note:
            return

        # Seeded on the PR number so a re-run of the job doesn't reword the same announcement
        rng = random.Random(self.pr_number)
        intro = rng.choice(SLACK_INTROS)
        verb = rng.choice(SLACK_VERBS)

        send_slack_message(
            f"{intro}! @{self.pr.user.login} {verb} "
            f"(PR: <{self.pr.html_url}|#{self.pr_number}: {self.pr.title}>):\n\n"
            f"{decision.release_note}"
        )

    def run(self):
        """Main execution flow."""
        if not self.should_process():
            return

        try:
            decision = self.analyze_pr()
            self.apply_decision(decision)
        except Exception as e:
            print(f"❌ Error processing PR: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            # Post a comment about the error so humans know
            self.pr.create_issue_comment(
                f"⚠️ The Release Note Bot encountered an error while processing this PR. "
                f"A human maintainer will review it shortly.\n\n"
                f"Error: `{type(e).__name__}: {str(e)}`"
            )
            sys.exit(1)

        # Outside the handler above: the labelling and comment have already landed, so a
        # Slack failure should fail the job loudly rather than claim the PR needs a human
        self.announce_to_slack(decision)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    PRReleaseNotesBot().run()
