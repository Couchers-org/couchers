#!/usr/bin/env python3
"""
GitHub Issue Bot with LLM-powered decision making.

This bot processes new issues using an LLM to determine appropriate actions
such as tagging, closing, translating, or requesting more information.
"""

import os
import sys
import json
from typing import List, Optional
from enum import Enum

from pydantic import BaseModel, Field
from a5.ai import LLM
from github import Github


# ============================================================================
# Configuration
# ============================================================================

SYSTEM_PROMPT = """You are a GitHub issue triage bot for Couchers.org, a couch surfing platform.

Your job is to analyze newly opened issues and determine what actions to take. Follow these rules precisely:

1. **Suspended/Banned Account Issues**:
   - If the issue is about a suspended, banned, or blocked account
   - Close the issue
   - Post comment: "Not a bug."

2. **Foreign Language Issues**:
   - If the issue is written in a language other than English
   - Translate the title and body to English
   - Post the translation as a comment
   - Keep the issue open
   - Do not add any labels or make other modifications

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

    translated_title: Optional[str] = Field(
        default=None,
        description="Translated issue title if original was in foreign language"
    )

    translated_body: Optional[str] = Field(
        default=None,
        description="Translated issue body if original was in foreign language"
    )


# ============================================================================
# Bot Implementation
# ============================================================================

class IssueBot:
    """GitHub issue bot with LLM-powered decision making."""

    def __init__(self):
        self.llm = LLM(model=os.environ["BOT_LLM_MODEL"])
        self.github_client = Github(os.environ["GITHUB_TOKEN"])

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

    def apply_decision(self, decision: BotDecision):
        """Apply the bot's decision to the issue."""

        # Add labels
        if decision.labels_to_add:
            print(f"\nAdding labels: {decision.labels_to_add}")
            self.issue.add_to_labels(*decision.labels_to_add)

        # Post comment if needed
        if decision.comment:
            comment_body = decision.comment

            # If there's a translation, add it to the comment
            if decision.translated_title or decision.translated_body:
                translation_section = "\n\n---\n\n## 🌐 Translation\n\n"
                if decision.translated_title:
                    translation_section += f"**Translated Title:** {decision.translated_title}\n\n"
                if decision.translated_body:
                    translation_section += f"**Translated Body:**\n\n{decision.translated_body}"
                comment_body += translation_section

            print(f"\nPosting comment...")
            self.issue.create_comment(comment_body)

        # Close issue if needed
        if decision.action == IssueAction.CLOSE:
            print(f"\nClosing issue...")
            self.issue.edit(state="closed")

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
            sys.exit(1)


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    IssueBot().run()
