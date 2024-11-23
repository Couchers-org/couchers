# Developer Contributor Guide

We collaborate on code through git, hosted on GitHub. If you are a software engineer (web/mobile/backend), you should request write access to the codebase. If you'd like to contribute regularly, reach out to @aapeliv to join our Slack channel. This is where our main communication happens. We also do video meetings every week where we discuss priorities, architecture, etc.

## Finding an issue

If you are looking for something to help with related to software development, our [Couchers Engineering](https://github.com/orgs/Couchers-org/projects/6) project board is the best place to look! We keep track of the prioritized issues there.


Tickets that are ready to be picked up are under the "Ready" column. The higher the ticket, the bigger the priority, so try to choose from the top if you can. You can also choose a ticket from the "Abandoned" column if you want. These are tickets that were started, but abandoned and need someone to take them over the finish line.

Once you begin a ticket, please assign yourself to it and move it into the "In Progress" column so we know who is working on what. 

If you need clarification on a ticket, you can leave a comment and tag a contributor, or even better, leave a comment on our Slack Channel (reach out to @aapeliv to join).

## The development process

All our code is in one repository (monorepo). We currently use the pull request model as our git workflow, our main development branch is `develop`. 

1. Create a new branch off `develop`:
    - `git switch develop`
    - `git pull`
    - `git switch -c branch-name`
2. Branches ought to be named with the `{component}/{type}/{slug}` format, where component is either `web` or `backend`, the type is `feature`, `bugfix`, `refactor`, etc; and slug is a brief name for the branch, for example:
    - `web/feature/avatar-component`
    - `backend/bugfix/email-html-escaping`
3. Work on the new branch, feel free to commit regularly. Ideally a commit should make one change to the code but the code should compile and run both before and after the change (though this is not always possible). Each feature or bugfix should be self-contained and if possible, split a change up into multiple smaller PRs so they're easier to review.
4. Push the new branch to GitHub, and open a Pull Request (PR). If your branch is ready to be merged, pending review, make it a normal PR. If it's still work in progress and you don't want a review yet, you can make it a [draft PR](https://github.blog/2019-02-14-introducing-draft-pull-requests/). Choose some appropriate labels on the PR, such as `web`/`backend` and `feature`/`bug` to make it easier for others to navigate the list of PRs.
5. When you are ready for a review, select a reviewer and ask them to review the code. Feel free to choose someone you know can review it, or if you don't know who else, just select @aapeliv who'll delegate someone. You can also message on the appropriate channel on Slack.
6. The reviewer should review the pull request and comment, suggest changes, or approve the review.
7. Once you and the reviewer are ready for the PR to be merged, someone on the core team can merge it into `develop`.

## How code review works and why we do it

In addition to maintaining high code quality, the purpose of code review is to make sure that each team member learns from their peers, and we all assimilate knowledge from each other. You're sure to learn a lot from reviewing other people's code and having your code reviewed by others. It also helps maintain our code so that we have some shared patterns and standard way of doing things.

## CI/CD

We have a CI/CD (continuous integration/continuous delivery) pipeline set up on [GitLab.com/couchers/couchers](https://gitlab.com/couchers/couchers/). When you open a PR, a pipeline will automatically run the tests, deploy previews of the web frontend, and compute code coverage. You can check the status of your pipeline in the GitHub status check or by going to [the pipelines page](https://gitlab.com/couchers/couchers/-/pipelines). You can read more about the setup on [docs/cicd.md](cicd.md).

## Opening and writing issues

We're a very asynchronous team: everyone is basically in a different timezone, and it's rare that people are working at the same time.

It's therefore important to write issues that don't require clarification and that are easy for anyone to pick up and tackle. So when you write issues, it's better to overshare and make them verbose than to write terse issues, as these often end up being a bit cryptic and hard to get started on.

## Other Couchers.org teams

Couchers.org is currently split into teams, among them: product (divided into backend, web and mobile), design, community, marketing, and support and moderation.

The purpose of the backend team is to develop, deploy, and maintain the backend and infrastructure for the Couchers.org database and apps.

## Namespacing

All python code should live in the `couchers` namespace (i.e. a folder within the package). This allows us to easily distinguish our code from third party library code.

## Code style

We adhere to [PEP8](https://www.python.org/dev/peps/pep-0008/), but it's automatically done with the [ruff](https://docs.astral.sh/ruff/) formatter, which also sorts imports. Additionally, we use the ruff linter to perform a static code check.

`ruff` is installed automatically if you install the requirements on your computer (or you can install it with `pip install ruff`, e.g. if you work with Docker). Run `ruff check --select I --fix . && ruff check . && ruff format .` in the `//app/backend` folder before you commit (or before asking for review) so that it picks up the config in `pyproject.toml`.

You can run `ruff` linting and autoformatting automatically before each commit via `pre-commit` (It comes with the dependencies, or you can install it via `pip install pre-commit`). For this you have to once run `pre-commit install`. If you don't want to run the pre-commit hook, you can skip commit hooks with the `--no-verify` flag: `git commit --no-verify -m "commit message"`.

Additionally, we strive to use the ["Google" docstring format](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html). We will auto-generate docs from code, so it's important to adhere to a uniform docstring style.

If you have `clang-format` installed, you can format the proto files by running `clang-format --style=file -i *.proto` in `//app/proto`.

In the **web frontend**, make sure to run `yarn format` in `//app/web` before asking for a review.
