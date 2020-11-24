# Developer Contributor Guide

We collaborate on code through git, hosted on GitHub. If you are a software engineer (frontend/backend), you should request write access to the codebase.

## The development process

All our code is in one repository (monorepo). We currently use the pull request model as our git workflow, our main development branch is `develop`.

1. Create a new branch off `develop`:
    - `git checkout develop`
    - `git pull`
    - `git checkout -b branch-name`
2. Branches ought to be named with the `{component}-{type}-{slug}` format, where component is either `frontend` or `backend`, the type is `feature`, `bugfix`, etc; and slug is a brief name for the branch, for example:
    - `frontend-feature-avatar-component`
    - `backend-bugfix-email-html-escaping`
3. Work on the new branch, feel free to commit regularly. Ideally a commit should make one change to the code but the code should compile and run both before and after the change (though this is not always possible).
4. Push the new branch to GitHub, and open a Pull Request (PR). If your branch is ready to be merged, pending review, prepend `[MRG]` to the pull request title. If it’s still work in progress, prepend `[WIP]`.
5. When you are ready for a review, select a reviewer and ask them to review the code. Feel free to choose someone you know can review it, or if you don’t know who else, select the maintainer, or ping the appropriate channel on Slack.
6. The reviewer should review the pull request and comment, suggest changes, or approve the review.
7. Once you and the reviewer are ready for the PR to be merged, mark the PR with `[MRG]` and notify the owner.
8. The owner will then do a quick review to double check, and merge the PR into develop.

## How code review works and why we do it

In addition to maintaining high code quality, the purpose of code review is to make sure that each team member learns from their peers, and we all assimilate knowledge from each other. You’re sure to learn a lot from reviewing other people’s code and having your code reviewed by others. It also helps maintain our code so that we have some shared patterns and standard way of doing things.

## Code ownership

Each directory has owners, who are responsible for that part of code. Owners also merge pull requests into their part of code.

Owners have the following responsibilities:
* They have final say on decisions regarding the code
* They are responsible for approving and merging pull requests in the code
* It is their job to make sure the code works and 
* They are there to help you get started and work efficiently

At the moment, Aapeli is the owner of the [Couchers-org/couchers](https://github.com/Couchers-org/couchers) repository. As we assemble the frontend team and as the codebase grows, we'll be dividing up different partitions for others!

<!-- To find the owner of a directory, look for the OWNERS file. If it’s not present, look in the parent directory, etc. Continue until you find the owner.

TODO(aapeli): add OWNERS files on git -->

## Writing issues

We're a very asynchronous team: everyone is basically in a different timezone, and it's rare that people are working at the same time.

It's therefore important to write issues that don't require clarification and that are easy for anyone to pick up and tackle. So when you write issues, it's better to overshare and make them verbose than to write terse issues, as these often end up being a bit cryptic and hard to get started on.

## Other Couchers.org teams

Couchers.org is currently split into four teams: product (divided into backend and frontend), design, community, and marketing.

The purpose of the backend team is to develop, deploy, and maintain the backend and infrastructure for the Couchers.org database and apps.

## Namespacing

All python code should live in the `couchers` namespace (i.e. a folder within the package). This allows us to easily distinguish our code from third party library code.

## Code style

We adhere to [PEP8](https://www.python.org/dev/peps/pep-0008/), but it's automatically done with [black](https://github.com/psf/black).

Install it with `pip install black` and run it in app/backend before
you commit, or before you ask for review for your branch: `black .`
Also run `isort .` to sort import statements.

Additionally, we strive to use the ["Google" docstring format](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html). We will auto-generate docs from code, so it's important to adhere to a uniform docstring style.

Please use double quotes `"`, instead of single quotes `'`.

In the **frontend**, make sure to run `yarn format` in `app/frontend` before asking for a review.

The server should operate in UTC, and we should always use datetimes with timezones. Please use the utility functions in `couchers.utils`. For now we pretend the whole world operates in UTC, which will of course have to change soon given we're going to care about local times. How this responsibility is divided up between the frontend and backend is not entirely clear yet though.
