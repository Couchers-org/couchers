# PR Release Notes Tagger Bot

This bot automatically triages pull requests to determine if they should be included in release notes.

## How It Works

When a PR is **approved** or **merged**, the bot:

1. Analyzes the PR title, description, files changed, and review comments
2. Uses an LLM to decide if this PR should be in release notes
3. Adds one of two labels:
   - `release notes: pending` - This PR should be in the release notes
   - `release notes: not needed` - This PR doesn't need to be in release notes
4. Posts a comment with either:
   - A suggested one-line release note (if it should be included)
   - An explanation of why it was excluded

## What Gets Included?

The bot includes PRs that are **significant to end users**:

- ✅ New user-facing features
- ✅ Significant UX improvements
- ✅ Important bug fixes (affecting many users)
- ✅ Safety & moderation features
- ✅ Community & events features
- ✅ Major technical infrastructure (if it affects users)

## What Gets Excluded?

The bot excludes PRs that are **internal/technical**:

- ❌ Internal code refactoring
- ❌ Developer experience changes
- ❌ Dependency updates
- ❌ Minor bug fixes (typos, small CSS tweaks)
- ❌ Documentation updates

## Release Note Format

For PRs that should be included, the bot generates a comment like:

```
## 📝 Release Notes

This PR should be included in the release notes.

**Suggested release note:**

```
Added same gender only filter for strong verified users by @username [[#1234](PR-URL)]
```

*Note: The release note should use the contributor's Couchers.org username (e.g., `[Username](https://couchers.org/user/username)`) instead of their GitHub username when added to the blog post.*
```

## Workflow Triggers

The workflow runs on:
- `pull_request_review` with type `submitted` and state `approved`
- `pull_request` with type `closed` and `merged == true`

This ensures the bot runs **at most once per PR** when it's either approved or merged.

## Manual Override

If the bot makes a mistake, you can:

1. Remove the incorrect label
2. Add the correct label manually
3. The bot won't re-process (it skips PRs that already have a release notes label)

## System Prompt

The bot uses a carefully crafted system prompt (see `pr_release_notes.py`) that:

- Explains Couchers.org's context as an end-user platform
- Provides clear rules for inclusion/exclusion
- Includes many examples of good and bad release notes
- Emphasizes writing from the user's perspective

The system prompt is designed to be reusable and can be updated as needed to improve decision quality.

## Dependencies

- Python 3.13
- a5 (LLM library)
- PyGithub
- Pydantic

## Local Testing

To test locally:

```bash
cd .github/pr-release-notes

# Set environment variables
export GITHUB_TOKEN="your-token"
export LLM_API_KEY="your-llm-key"
export LLM_MODEL="claude-sonnet-4-5"
export PR_NUMBER="1234"
export REPOSITORY="Couchers-org/couchers"

# Run the bot
uv run pr_release_notes.py
```

## Future Improvements

Potential enhancements:
- Add a `/release-note` slash command to re-trigger analysis
- Collect release notes automatically into a draft blog post
- Learn from manual label corrections to improve accuracy
