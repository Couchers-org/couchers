# Developer Contributor Guide

Thank you for your interest in contributing to Couchers.org! We're a small, passionate team of volunteers building the future of couch surfing.

We collaborate on code through git, hosted on GitHub. If you are a software engineer (web/mobile/backend) who has been onboarded, you should request write access to the codebase.

Before you start, please read this guide carefully to understand our workflow and expectations.

## Expectations for developers

**We are a small volunteer team with limited capacity.** Onboarding new developers and volunteers is a sizeable effort, and we love doing it when we meet a motivated dev who wants to stick around for a good while, but we don't like to do it if people aren't in it for the right reasons.

To make the most of everyone's time and ensure quality contributions, we want to set some ground rules:

1. **We encourage you to contact us before starting work**, e.g. tag @nabramow (frontend) or @aapeliv (backend) on GitHub or reach out on Slack to confirm that:
   - The issue is still relevant and ready to be worked on
   - We have capacity to review your contribution
   - The work aligns with current priorities

2. **We hope that you are looking to commit for 3+ months**. Onboarding takes significant time and effort from our small team. We look for contributors who can commit to staying involved for a while to make the investment worthwhile. The future is always uncertain and we understand you also want to figure out if we are the project you want to spend your time on. But if you know you are between jobs briefly or are looking for a low-effort item on your resume, we are probably not the project for you.
    - See next section about single issue contributions.

3. **Attend weekly meetings**. We hold video meetings every week where we discuss priorities, architecture, and important details. Attending these meetings is essential to prevent miscommunication and avoid lengthy back-and-forth in PR reviews. Priorities and context shared in these meetings often aren't captured elsewhere. It's also a key way in which we make sure contributing is fun, social, and fulfilling to all. Please make an effort to join regularly!

4. **Join our Slack** — This is where our main communication happens. Reach out to @aapeliv or @nabramow to join or email volunteers@couchers.org.

We do welcome independent contributions if you feel you prefer working on your own, but please keep in mind that **we make no guarantee that your PR will be approved, merged, or even reviewed if you don't follow the above ground rules**. In particular, this can happen if our priorities have shifted (our issue board is often a bit out of date), if some detail is missing from GitHub, or if your PR requires significant work and we feel it's not worth our while. This isn't a reflection on your skills—it's simply about managing our bandwidth effectively. You can increase the chances of your PR being approved by carefully making it easy to review and merge for maintainers (e.g. making sure you carefully read our documentation, adhere to our style, run all formatters, and fill out the PR template carefully).

## On recruiting

If you formally apply to volunteer and don't hear back immediately, please be patient — it may take time for us to respond, and we may be defering onboarding until we have more capacity. At any time, we tend to have a relatively small group of core devs doing most work, including recruiting.

If you are a motivated engineer, really want to contribute, and you have the seniority and skills we are looking for, we encourage you to proactively make an effort to make it known. You can pick up a good first issue, figure out how to set up the dev environment locally, and carefully make an easy-to-review PR, also noting that you are hoping to join as a permanent volunteer. We do take note and will probably schedule a chat soon!

We hope you understand the constraints we operate under and that we put a fair bit of effort into onboarding each new volunteer and doing our part in helping them succeed.

## Finding an issue

If you are looking for something to help with related to software development, our [Couchers Engineering](https://github.com/orgs/Couchers-org/projects/6) project board is the best place to look! We keep track of the prioritized issues there.

Tickets that are ready to be picked up are under the "Ready" column. The higher the ticket, the bigger the priority, so try to choose from the top if you can.

**Please review the expectations for developers above before starting on a ticket.** In particular, our project board gets out of date, and we encourage you to communicate with us before commencing work to prevent wasted effort on both sides.

Once you have discussed with us the ticket and are ready to begin, please assign yourself to it and move it into the "In Progress" column so we know who is working on what.

If you need clarification on a ticket, you can leave a comment and tag a contributor, or even better, ask on our Slack Channel (reach out to @aapeliv or @nabramow to join).

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

`ruff` is installed automatically if you install the requirements on your computer (or you can install it with `pip install ruff`, e.g. if you work with Docker). Run `make format` in the `//app/backend` folder before you commit (or before asking for review) so that it picks up the config in `pyproject.toml`.

You can run `ruff` linting and autoformatting automatically before each commit via `pre-commit` (It comes with the dependencies, or you can install it via `pip install pre-commit`). For this you have to once run `pre-commit install`. If you don't want to run the pre-commit hook, you can skip commit hooks with the `--no-verify` flag: `git commit --no-verify -m "commit message"`.

Additionally, we strive to use the ["Google" docstring format](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html). We will auto-generate docs from code, so it's important to adhere to a uniform docstring style.

If you have `clang-format` installed, you can format the proto files by running `clang-format --style=file -i *.proto` in `//app/proto`.

In the **web frontend**, make sure to run `yarn format` in `//app/web` before asking for a review.
