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

### 6. Write the PR description

Read the PR template from `.github/pull_request_template.md` and fill it in.

The description has one job: give a reviewer who context-switches in enough to understand what the change is about and why it exists, without reading the code. Nothing else.

**Shape.** One paragraph. Open with high-level context — which subsystem this touches, what it is for, why it matters — so a reviewer who may be familiar with this area but did not drive the session is oriented. Then what is wrong, missing, or needed, and what the change does about it. Add a second short paragraph only for a behaviour change reviewers need to know about, a stacking or follow-up relationship to another PR, or a human-directed decision (see below). Most descriptions should be well under 150 words.

**Stay above the code.** Write in terms a reviewer can follow without opening a file — the authentication system, the notification emails, the search page — rather than the private helpers, local variables and internal functions that implement them. Nobody remembers what those do, including whoever wrote them. Identifiers are fine where a reviewer would recognise them from outside: RPC and service names, database tables, proto messages, settings and env vars, feature flags, URLs.

**Tone.** You are describing the change and the human's decisions about it. You are not an engineer offering your take. Never write anything that reads as your own engineering judgement or as an invitation to discuss it — no "worth a reviewer's opinion", no "happy to change this", no flagged concerns, no recommendations, no notes to reviewers. If something genuinely needs discussion, raise it with the user instead.

**Never include:**

- Anything about tests, formatting, linting, type checking, or CI. It all runs automatically, so there is nothing to report — no test names, no pass counts, no "`make mypy` clean", no "verified to fail before the fix".
- *How* the change is implemented. The diff shows that. No per-file or per-function walkthrough, no lists of the fields/files/keys/symbols added, no tables.
- Any narration of the session: what you tried first, what you ruled out, what you deliberately left alone, what you couldn't run locally, environment problems.
- Design or implementation choices that were yours rather than the user's, however much work went into them.
- Annotations on checklist items. Tick or leave unticked.
- Headings, tables, or bold sub-headings beyond the template's own.
- A first sentence that restates the title.

**The one exception.** If the user explicitly directed a design or implementation decision during the session, and it is consequential and looks wrong on its face — or was picked after real work on an alternative — record it in a sentence or two as their decision. Nothing you decided on your own ever qualifies.

**Testing section.** Leave it out unless a human has to do something by hand to exercise the change that isn't obvious; then give one line of steps. Never test results.

**Checklists.** Include the checklist(s) — backend, web, or both — matching the areas changed, and remove the ones that don't apply. Tick honestly, annotate never. Keep the "For maintainers" section as-is.

Append the following note as the very last line of the PR body, after the "For maintainers" section (separated by a blank line):

  ```
  _This PR was created with the Couchers PR skill._
  ```

### 7. Prune the description

Read the draft description once more as if you had no context on the change and were a busy person with other PRs to get through. Ask what could be dropped and what needs clarifying: a sentence they would skip, a phrase they would have to re-read, a term they would have to look up.

Then make one more editing pass for simplification and clarification. You may only prune and reword — the description must not get longer.

### 8. Create the PR

```bash
gh pr create --base develop --title "<short title>" --body "$(cat <<'EOF'
<filled-in PR template>

_This PR was created with the Couchers PR skill._
EOF
)"
```

### 9. Report back

Tell the user the PR URL when done. If the change alters the UI, say that screenshots are still needed — you can't take them.
