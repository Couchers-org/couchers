---
name: pr
description: Commit all changes, push to a new branch, and create a pull request using the repo's PR template. Use when the user says to make a PR or submit changes.
disable-model-invocation: true
allowed-tools: Bash Read Glob Grep Agent
---

# Create a Pull Request

Create a branch, commit, push, and open a PR for the current changes.

## Steps

### 1. Assess the current state

Run in parallel:
- `git status` (never use `-uall`)
- `git diff` and `git diff --staged` to understand all changes
- `git log --oneline -5` to see recent commit message style

Identify which files should be committed. Do NOT commit files that are:
- Scratch/debug/temporary files
- Files containing secrets (`.env`, credentials, etc.)

If there are no meaningful changes to commit, tell the user and stop.

### 2. Determine the branch name

Branch names in this repo follow the pattern: `<area>/<type>/<short-description>`

Where:
- `<area>` is one of: `backend`, `web`, `frontend`, `mobile`, or a username/handle for cross-cutting changes
- `<type>` is one of: `feature`, `bugfix`, `fix`, `refactor`, or similar
- `<short-description>` is a short kebab-case description

Infer area and type from the changed files and the nature of the changes. If you can't determine the area, use the user's GitHub username from `git config user.name` (lowercased).

### 3. Run linters and formatters

Before committing, run the appropriate linters and formatters for the changed areas:
- **Backend**: `make format` and `make mypy` from `/app/backend`
- **Web/Frontend**: lint/format as appropriate

Fix any issues before proceeding. If linters produce changes, include those in the commit.

### 4. Create the branch and commit

If there are already commits on the current branch and no uncommitted changes remain (e.g. changes were already committed earlier), skip the commit and proceed to pushing.

Otherwise:

```
git checkout -b <branch-name>
git add <specific files>  # add only the relevant files by name
git commit -m "<message>"
```

Write a concise commit message (1-2 sentences) that describes what changed and why.

### 5. Push the branch

```
git push -u origin <branch-name>
```

### 6. Create the PR

Read the PR template from `.github/pull_request_template.md` in this repo. Fill it in based on the actual changes:

- Fill in the description at the top (what and why)
- Fill in the Testing section with what was done or what should be done
- Include the appropriate checklist(s) — backend, web, or both — based on which areas were changed. Remove checklists that don't apply.
- Keep the "For maintainers" section as-is
- Append the following note as the very last line of the PR body, after the "For maintainers" section (separated by a blank line):

  ```
  _This PR was created with the Couchers PR skill._
  ```

```bash
gh pr create --base develop --title "<short title>" --body "$(cat <<'EOF'
<filled-in PR template>

_This PR was created with the Couchers PR skill._
EOF
)"
```

### 7. Report back

Tell the user the PR URL when done.
