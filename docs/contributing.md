# Contributing to the Couchers.org codebase

This document is primarily for developers.

## Basic development model

1. We create issues for each task/feature/issue/bug on this GitHub repository. Non-developers will also occasionally add issues.
2. These are triaged and added to the backlog.
3. You pick a task (preferably from the top of the backlog), and assign it to yourself.
4. You create a feature branch off `develop`, complete the task, and create a Pull Request (PR).
5. Another developer reviews your code and either approves it, requests comments, or pulls in someone else to review it.
6. Once the PR is approved, you merge it back into `develop`.

`develop` is regularly tested, then merged into `master`, which is deployed live. Ideally each PR will include tests that need to pass before the PR is merged.

## Writing issues

We're a very asynchronous team: everyone is basically in a different timezone, and it's rare that people are working at the same time.

It's therefore important to write issues that don't require clarification and that are easy for anyone to pick up and tackle. So when you write issues, it's better to overshare and make them verbose than to write terse issues, as these often end up being a bit cryptic and hard to get started on.

## How we work with the other teams

Couchers.org is currently split into three teams: backend (us), frontend/design, and the community team.

The purpose of the backend team is to develop, deploy, and maintain the backend and infrastructure for the Couchers.org database and apps.

The community team is in charge of growing the Couchers.org community (and thus userbase), and listening to community feedback and figuring out which features they want the most. Frontend works with the community team to figure out how those features could be implemented and how they would look in the apps. We then work with both, the community and frontend teams to build and deploy the changes in the database and backend to facilitate this.

The point is not to build silos, rather, the community is pretty huge, and there are a lot of voices and opinions, so the community is there to front us and help us distil those ideas into something that a lot of users want and something that's actionable and valuable for us to build.

## Namespacing

<!-- TODO(aapeli): implement this change in code -->

All python code should live in the `couchers` namespace (i.e. a folder within the package). This allows us to easily distinguish our code from library code.

## Code style

<!-- TODO(aapeli): flesh out this section -->

Please adhere to [PEP8](https://www.python.org/dev/peps/pep-0008/).

Additionally, we strive to use the ["Google" docstring format](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html). We will auto-generate docs from code, so it's important to adhere to a uniform docstring style.
