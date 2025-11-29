"""
GitHub PR Release Notes Tagger with LLM-powered decision making.

This bot processes approved/merged PRs using an LLM to determine whether
they should be included in release notes, and if so, generates a one-line
summary in the appropriate format.
"""

import os
import sys
import json
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field
from a5.ai import LLM
from github import Github, Auth


# ============================================================================
# Configuration
# ============================================================================

RELEASE_NOTES_PENDING_LABEL = "release notes: pending"
RELEASE_NOTES_NOT_NEEDED_LABEL = "release notes: not needed"

SYSTEM_PROMPT = """You are a release notes triage bot for Couchers.org, a non-profit couch surfing platform.

**Important context about Couchers.org:**
- Couchers is a couch surfing platform for end users (not a library or framework)
- Release notes should focus on changes that are significant and noticeable to end users
- Release notes can also include major technical infrastructure changes that affect the platform

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

6. **Major Technical Infrastructure**
   - Only if it significantly affects user experience
   - Examples: mobile app work, IPv6 support, CDN for faster loading
   - NOT: dependency updates, internal refactoring, CI/CD improvements

# What to EXCLUDE from Release Notes

Do NOT include PRs that are:

1. **Internal Code Changes**
   - Refactoring that doesn't change behavior
   - Code cleanup, tech debt
   - Internal tooling improvements

2. **Developer Experience Changes**
   - CI/CD improvements
   - Testing infrastructure
   - Development environment fixes
   - Build process changes

3. **Dependency Updates**
   - Library upgrades (unless they unlock specific new features)
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
- Be concise but informative (1-2 sentences maximum)
- Don't mention technical details unless necessary for user understanding
- Don't include contributor names or PR numbers (those will be added automatically)

**Good examples:**
- "Added same gender only filter for strong verified users"
- "Fixed Brisbane (Australia) missing from map search bug"
- "Implemented invite friends feature with personalized links"
- "Redesigned edit profile page to be more user-friendly and highlight important sections"
- "Added quick decline option in host request emails"

**Bad examples:**
- "Refactored authentication service to use new pattern" (internal change)
- "Updated MUI to v6" (dependency update without user impact)
- "Fixed typo in button label" (too minor)
- "Implemented new AbstractFactoryBuilder for request handling" (too technical)

# Decision Making Process

1. Read the PR title, description, and files changed carefully
2. Determine if this is something an end user would notice or care about
3. If unsure, err on the side of NOT including it (we can always add it later)
4. If it should be included, write a clear, user-focused one-line summary

Remember: Release notes are for END USERS of the couch surfing platform, not developers!
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
    """GitHub PR release notes bot with LLM-powered decision making."""

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

    def analyze_pr(self) -> BotDecision:
        """Use LLM to analyze the PR and determine if it should be in release notes."""

        # Get PR details
        files_changed = [f.filename for f in self.pr.get_files()]
        files_summary = "\n".join(f"- {f}" for f in files_changed[:20])  # Limit to first 20 files
        if len(files_changed) > 20:
            files_summary += f"\n... and {len(files_changed) - 20} more files"

        # Get review comments if any
        reviews = list(self.pr.get_reviews())
        review_summary = ""
        if reviews:
            review_summary = "\n\n**Review Comments:**\n"
            for review in reviews[-3:]:  # Last 3 reviews
                if review.body:
                    review_summary += f"- {review.user.login}: {review.body[:200]}\n"

        prompt = f"""{SYSTEM_PROMPT}

Analyze this GitHub Pull Request:

**Title:** {self.pr.title}

**Author:** @{self.pr.user.login}

**Description:**
{self.pr.body or "(no description provided)"}

**Files Changed ({len(files_changed)} files):**
{files_summary}
{review_summary}

Based on the guidelines provided, should this PR be included in the release notes?

If yes, provide a one-line summary suitable for release notes.
If no, explain why not.
"""

        print(f"Analyzing PR #{self.pr_number}: {self.pr.title}")
        print(f"Author: @{self.pr.user.login}")
        print(f"Files changed: {len(files_changed)}")

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
{decision.release_note} by @{self.pr.user.login} [[#{self.pr.number}]({self.pr.html_url})]
```

*Note: The release note should use the contributor's Couchers.org username (e.g., `[Username](https://couchers.org/user/username)`) instead of their GitHub username when added to the blog post.*
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

    def run(self):
        """Main execution flow."""
        try:
            if not self.should_process():
                return

            decision = self.analyze_pr()
            self.apply_decision(decision)
        except Exception as e:
            print(f"❌ Error processing PR: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            # Post a comment about the error so humans know
            try:
                self.pr.create_issue_comment(
                    f"⚠️ The release notes bot encountered an error while processing this PR. "
                    f"A human maintainer will review it shortly.\n\n"
                    f"Error: `{type(e).__name__}: {str(e)}`"
                )
            except:
                pass  # If we can't even post a comment, just fail
            sys.exit(1)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    PRReleaseNotesBot().run()
