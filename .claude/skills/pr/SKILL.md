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
- `<area>` is one of: `backend`, `web`, `frontend`, `mobile`, `devops`, `docs`, or another area that matches the changed files. For cross-cutting changes spanning multiple areas, pick the one that best describes the change.
- `<type>` is one of: `feature`, `bugfix`, `fix`, `refactor`, or similar
- `<short-description>` is a short kebab-case description

Infer area and type from the changed files and the nature of the changes. Never use a username as the area.

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
- Append the following two lines as the very last lines of the PR body, after the "For maintainers" section (separated by a blank line):

  ```
  _This PR was created with the Couchers PR skill._
  _Claude usage — Design: <score> · Implementation: <score> · Review: <score>_
  _Amount of iteration: <score>_
  ```

  Score each Claude usage category as **None**, **Some**, **Most**, or **All** based on Claude's share of the work:
  - **Design** — deciding *what* to build and the approach (the idea, architecture, API shape, edge cases to handle).
  - **Implementation** — writing the actual code that landed in the diff.
  - **Review** — testing, running the code, verifying behavior, debugging, catching issues.

  Be honest. If the user dictated the approach in detail, Design is None or Some. If the user wrote or substantially rewrote the code themselves, Implementation is None or Some. If the user manually tested or you never ran/tested the changes, Review is None or Some. Judge from the actual conversation, not optimistically.

  Score **Amount of iteration** separately on the same scale — this measures total back-and-forth/rework regardless of who drove it:
  - **None** — one-shot; first attempt accepted as-is.
  - **Some** — minor refinements or follow-up tweaks.
  - **Most** — substantial rework or course correction along the way.
  - **All** — many rounds; repeated redirection or rewriting.

```bash
gh pr create --base develop --title "<short title>" --body "$(cat <<'EOF'
<filled-in PR template>

_This PR was created with the Couchers PR skill._
_Claude usage — Design: <score> · Implementation: <score> · Review: <score>_
_Amount of iteration: <score>_
EOF
)"
```

### 7. Report back

Tell the user the PR URL when done.
