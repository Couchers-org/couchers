"""
GitHub Issue Bot with LLM-powered decision making.

This bot processes new issues using an LLM to determine appropriate actions
such as tagging, closing, translating, or requesting more information.
"""

import json
import os
import sys
from enum import Enum
from typing import List, Optional

from a5.ai import LLM
from github import Auth, Github
from pydantic import BaseModel, Field

# ============================================================================
# Configuration
# ============================================================================

# Allowlist of labels that the bot is permitted to add
ALLOWED_LABELS = {
    "0.kind bug report",
    "0.kind feature request",
    "bot-processed",
}

SYSTEM_PROMPT = """You are a GitHub issue triage bot for Couchers.org, a couch surfing platform.

Your job is to analyze newly opened issues and determine what actions to take. Follow these rules precisely:

**IMPORTANT: Check for foreign language issues FIRST before applying any other rules.**

1. **Foreign Language Issues**:
   - If the issue is written in a language other than English
   - Translate the entire issue (title and body) to English
   - After translation, continue analyzing using the translated content to determine if it's a bug report, feature request, has no info, etc.
   - The bot will automatically update the issue title and post the translation

2. **Suspended/Banned Account Issues**:
   - If the issue is about a suspended, banned, or blocked account
   - Close the issue
   - Post comment: "Not a bug."

3. **Issues With No Information**:
   - If the issue has no meaningful information (e.g., empty body, only "can't login" with no details)
   - Close the issue
   - Post comment: "Not enough information."

4. **Bug Reports**:
   - If it's a bug report with sufficient information
   - Add label: "0.kind bug report"
   - Post comment: "I think this is a bug report."
   - Keep the issue open

5. **Feature Requests**:
   - If it's a feature request or enhancement suggestion
   - Add label: "0.kind feature request"
   - Post comment: "I think this is a feature request."
   - Keep the issue open

**Important**: You can ONLY use these labels: "0.kind bug report", "0.kind feature request"
Do not suggest any other labels.

6. **Everything Else**:
   - If you're not sure what the issue is or it doesn't fit the above categories
   - Post comment: "I'm not sure what this is, so I'm not touching it."
   - Keep the issue open
   - Do not add any labels

Analyze the issue carefully and provide clear reasoning for your decisions."""


# ============================================================================
# Structured Output Schema
# ============================================================================

class IssueAction(str, Enum):
    """Actions the bot can take on an issue."""
    CLOSE = "close"
    KEEP_OPEN = "keep_open"


class BotDecision(BaseModel):
    """Structured output from the LLM defining actions to take."""

    reasoning: str = Field(
        description="Brief explanation of why these actions were chosen"
    )

    action: IssueAction = Field(
        description="Whether to close the issue or keep it open"
    )

    labels_to_add: List[str] = Field(
        default_factory=list,
        description="List of labels to add to the issue"
    )

    comment: Optional[str] = Field(
        default=None,
        description="Comment to post on the issue (if any). Use markdown formatting."
    )

    translation: Optional[str] = Field(
        default=None,
        description="English translation of the issue body if original was in foreign language"
    )

    translated_title: Optional[str] = Field(
        default=None,
        description="English translation of the issue title if original was in foreign language"
    )


# ============================================================================
# Bot Implementation
# ============================================================================

class IssueBot:
    """GitHub issue bot with LLM-powered decision making."""

    def __init__(self):
        self.llm = LLM(model=os.environ["LLM_MODEL"])
        self.github_client = Github(auth=Auth.Token(os.environ["GITHUB_TOKEN"]))

        # Get issue details from environment
        self.repo_name = os.environ["REPOSITORY"]
        self.issue_number = int(os.environ["ISSUE_NUMBER"])
        self.issue_title = os.environ.get("ISSUE_TITLE", "")
        self.issue_body = os.environ.get("ISSUE_BODY", "")
        self.issue_author = os.environ.get("ISSUE_AUTHOR", "unknown")

        # Get repository and issue objects
        self.repo = self.github_client.get_repo(self.repo_name)
        self.issue = self.repo.get_issue(self.issue_number)

    def analyze_issue(self) -> BotDecision:
        """Use LLM to analyze the issue and determine actions."""
        prompt = f"""{SYSTEM_PROMPT}

Analyze this GitHub issue:

**Title:** {self.issue_title}

**Author:** {self.issue_author}

**Body:**
{self.issue_body or "(empty)"}

Based on the rules provided, what actions should be taken?

Respond only in JSON with the following format:

```json
{json.dumps(BotDecision.model_json_schema())}
```
"""

        print(f"Analyzing issue #{self.issue_number}: {self.issue_title}")
        print(f"Author: {self.issue_author}")
        print(f"Body length: {len(self.issue_body or '')} characters")

        # Call LLM with structured output
        decision_dict = self.llm.json_complete(prompt, response_format=BotDecision)
        decision = BotDecision(**decision_dict)

        print(f"\nLLM Decision: {decision.action}")
        print(f"Reasoning: {decision.reasoning}")
        print(f"Labels to add: {decision.labels_to_add}")

        return decision

    def _format_debug_section(self, decision: BotDecision) -> str:
        """Format the debug information as a collapsible section."""
        debug_info = f"""

<details>
<summary>🤖 Debug Information</summary>

**Model:** `{os.environ.get('LLM_MODEL', 'unknown')}`
**Action:** `{decision.action.value}`
**Labels Added:** {', '.join(f'`{label}`' for label in decision.labels_to_add) if decision.labels_to_add else 'None'}
**Reasoning:** {decision.reasoning}

</details>"""
        return debug_info

    def apply_decision(self, decision: BotDecision):
        """Apply the bot's decision to the issue."""

        # If there's a translated title, update the issue title
        if decision.translated_title:
            print(f"\nUpdating issue title to: {decision.translated_title}")
            self.issue.edit(title=decision.translated_title)

        # Filter labels to only include those in the allowlist
        if decision.labels_to_add:
            allowed_labels = [
                label for label in decision.labels_to_add
                if label in ALLOWED_LABELS
            ]
            rejected_labels = [
                label for label in decision.labels_to_add
                if label not in ALLOWED_LABELS
            ]

            if rejected_labels:
                print(f"\n⚠️ Rejected labels not in allowlist: {rejected_labels}")

            if allowed_labels:
                print(f"\nAdding labels: {allowed_labels}")
                self.issue.add_to_labels(*allowed_labels)

        # Post comment if needed
        if decision.comment:
            comment_body = decision.comment

            # If there's a translation, add it to the comment
            if decision.translation:
                comment_body += f"\n\n---\n\n## 🌐 Translation\n\n{decision.translation}"

            # Add debug information section
            comment_body += self._format_debug_section(decision)

            print("\nPosting comment...")
            self.issue.create_comment(comment_body)

        # Close issue if needed
        if decision.action == IssueAction.CLOSE:
            print("\nClosing issue...")
            self.issue.edit(state="closed")

        # Always add bot-processed label to indicate the bot has taken action
        print("\nAdding bot-processed label...")
        self.issue.add_to_labels("bot-processed")

        print(f"\n✅ Successfully processed issue #{self.issue_number}")

    def run(self):
        """Main execution flow."""
        try:
            decision = self.analyze_issue()
            self.apply_decision(decision)
        except Exception as e:
            print(f"❌ Error processing issue: {e}", file=sys.stderr)
            # Post a comment about the error so humans know
            self.issue.create_comment(
                f"⚠️ The issue bot encountered an error while processing this issue. "
                f"A human maintainer will review it shortly.\n\n"
                f"Error: `{type(e).__name__}`"
            )
            # Add bot-processed label even when there's an error
            self.issue.add_to_labels("bot-processed")
            sys.exit(1)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    IssueBot().run()
