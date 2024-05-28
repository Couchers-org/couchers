# Contributor Guide

Couchers.org is currently split into teams, among them: product (divided into backend, web, mobile, and devops), design, community, marketing, and support and moderation.

This guide was written primarily for product team members to contribute to the codebase, but other contributors will find value in [Finding an issue](#finding-an-issue), [Detailing a task](#detailing-a-task), and [Project management](#project-management).

First of all though, please take a look at our [public roadmap](https://github.com/orgs/Couchers-org/projects/4/views/7) to follow our big picture progress and promises. For more detail on feature development, check out the [contributor roadmap](https://github.com/orgs/Couchers-org/projects/4/views/4) to see where the team is heading.

## Finding an issue

If you are a new contributor, we recommend starting with a [good first issue](https://github.com/orgs/Couchers-org/projects/4/views/6?sliceBy%5Bvalue%5D=good+first+issue) and then a [good second issue](https://github.com/orgs/Couchers-org/projects/4/views/6?sliceBy%5Bvalue%5D=good+second+issue). Otherwise, please look at [current open tasks](https://github.com/orgs/Couchers-org/projects/4/views/3?sliceBy%5Bvalue%5D=_noValue) or even [next sprint's open tasks](https://github.com/orgs/Couchers-org/projects/4/views/9?sliceBy%5Bvalue%5D=_noValue) if nothing is currently open. When you find a task you want to work on, leave a comment saying the same and assign the task to yourself.

## Detailing a task

Our development team is spread over many timezones and therefore works asynchronously. For this to be a success, it's important that tasks have as much detail as possible for any contributor to understand and engage with it. When detailing a task, it's best to overshare and favor verbosity over terseness in order to avoid cryptic and imprecise language that can make a task inactionable.

Knowing this, here are some important expectations to keep in mind when working on a contribution:

1. Issues and pull requests should provide the motivation and scope of a change. Please use a relevant issue template and mention related issues and pull requests to scope within existing work.
2. Name tasks succinctly. If it's a bug report, state what is broken. If it's a feature request or improvement, state what could exist.
3. Assign the task to the development cycle it is actually worked on within.
4. Ensure the priority is accurate to our primary objectives.
5. Specify the complexity for you to implement and estimate how long you expect to take to complete the task. This is helpful for project leads to assist you and recalibrate expectations and timelines.
6. Plan the start and finish within the range of the development cycle. It is best to limit this to less than half of the cycle duration; otherwise, we should reconsider how the task is defined and assigned.
7. The more comments the better! When you make edits to any of these details, it is recommended to provide more context so project leads can address potential issues earlier.

## Developing

We collaborate through `git` version control hosted on GitHub. If you are a software engineer familiar with these tools and you are interested in contributing, you should request write access to the codebase.

Our application code lives in a monorepo with the `develop` branch as the development trunk. We use the pull request model in our git workflow with merge commits. Please follow the workflow below when developing:

1. Create a new branch off `develop`:
    - `git switch develop`
    - `git pull`
    - `git switch -c branch-name`
2. Name branches with the `{component}/{type}/{slug}` format, where component is either `web` or `backend`, type is `feature`, `bugfix`, `refactor`, etc; and slug is a brief name for the branch, for example:
    - `web/feature/avatar-component`
    - `backend/bugfix/email-html-escaping`
3. Work on the new branch, feel free to commit regularly. Ideally a commit should make one change to the code but the code should compile and run both before and after the change (though this is not always possible). Each feature or bugfix should be self-contained and if possible, split a change up into multiple smaller PRs so they're easier to review.
4. Push the new branch to GitHub, and open a Pull Request (PR). If your branch is ready to be merged, pending review, make it a normal PR. If it's still work in progress and you don't want a review yet, you can make it a [draft PR](https://github.blog/2019-02-14-introducing-draft-pull-requests/). Choose some appropriate labels on the PR, such as `web`/`backend` and `feature`/`bugfix` to make it easier for others to navigate the list of PRs.
5. When you are ready for a review, select a reviewer and ask them to review the code. Feel free to choose someone you know can review it, or if you don't know who else, just select @aapeliv who'll delegate someone. You can also message on the appropriate channel on Slack.
6. The reviewer should review the pull request and comment, suggest changes, or approve the review.
7. Once you and the reviewer are ready for the PR to be merged, someone on the core team can merge it into `develop`.

### Why code review?

In addition to maintaining high code quality, the purpose of code review is to make sure that each team member learns from their peers, and we all assimilate knowledge from each other. You're sure to learn a lot from reviewing other people's code and having your code reviewed by others. It also helps maintain our code so that we have some shared patterns and standard way of doing things.

### Continuous Integration (CI)

In addition to code review, pull requests must pass certain checks defined in our CI pipeline set up on [GitLab.com/couchers/couchers](https://gitlab.com/couchers/couchers/) before merging will be permitted. When you open a PR, a pipeline will automatically run the tests, deploy previews of the web frontend, and compute code coverage. You can check the status of your pipeline in the GitHub status check or by going to [the pipelines page](https://gitlab.com/couchers/couchers/-/pipelines). You can read more about the setup on [docs/cicd.md](cicd.md).

### Namespacing

All python code should live in the `couchers` namespace (i.e. a folder within the package). This allows us to easily distinguish our code from third party library code.

### Code style

We adhere to [PEP8](https://www.python.org/dev/peps/pep-0008/), but it's automatically done with [black](https://github.com/psf/black). We also sort imports with `isort` and we remove unused imports with `autoflake`.

All are installed automatically if you install the requirements on your computer (or you can install them with `pip install black isort autoflake`, e.g. if you work with Docker). Run `autoflake --exclude src/proto -r -i --remove-all-unused-imports src && isort . && black .` in the `//app/backend` folder before you commit (or before asking for review) so that it picks up the config in `pyproject.toml`.

Additionally, we strive to use the ["Google" docstring format](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html). We will auto-generate docs from code, so it's important to adhere to a uniform docstring style.

If you have `clang-format` installed, you can format the proto files by running `clang-format --style=file -i *.proto` in `//app/proto`.

In the **web frontend**, make sure to run `yarn format` in `//app/web` before asking for a review.

## Project Management

Couchers contributions are managed by all teams collectively within the [GitHub Project](https://github.com/orgs/Couchers-org/projects/4). Product development is done in pursuit of quarterly release milestones by which the team strives to release platform features and content relevant to our primary objectives. Consistency and focus is maintained through Scrum-style development cycles every month during which we develop, assess, plan, and repeat both asynchronously and in weekly discussion meetings.

Building upon [expected task details](#detailing-a-task), we have [several](https://github.com/orgs/Couchers-org/projects/4/views/3) [useful](https://github.com/orgs/Couchers-org/projects/4/views/6) [dashboards](https://github.com/orgs/Couchers-org/projects/4/views/4) for tracking our tasks through a common development lifecycle with the following essential workflows:

### Sharing ideas

The process begins with ideation. If you have an idea for something to fix or add or change on the platform, you [search for it](https://github.com/orgs/Couchers-org/projects/4/views/4). If the thoughts are already captured by an ongoing issue, it's best to comment there to avoid duplication. If relevant work was previously completed but was not sufficient, you can [create a new issue](https://github.com/Couchers-org/couchers/issues/new) and reference the old one. Please [be specific](#detailing-a-task) when suggesting new work.

### Triaging bugs

Sometimes ideas come from reporting unexpected and undesired behavior in the application. Bug reports are still treated like tasks in our paradigm and are expected to carry the same relevant details of any other actionable development. When [new bugs](https://github.com/orgs/Couchers-org/projects/4/views/6?sliceBy%5Bvalue%5D=bug) come in, they should be linked with existing reports and prioritized the same as [planning features](#planning-features), perhaps with a slightly inflated priority if it can be sufficiently investigated and resolved. It is better to have a stable platform than an unstable one.

### Planning features

Having lots of ideas is inspiring, but generating them almost always quickly outpaces a team's capacity to address and implement them. Prioritization is arguably the most important requirement of a successful project management system. We must determine what we work on next primarily by what serves our interests the most.

To come to consensus on which improvements have higher priority and should be addressed sooner than others, we review the [idea backlog](https://github.com/orgs/Couchers-org/projects/4/views/6) together. Once priority is established and labeled, we plan them in a cycle accordingly, being mindful of how demanding it is and who is responsible for its completion.

In addition to weekly reviews, we debrief our progress in the [current development cycle](https://github.com/orgs/Couchers-org/projects/4/views/3) in order to make adjustments in the [upcoming development cycle](https://github.com/orgs/Couchers-org/projects/4/views/9)

### Shifting timelines

Prioritization isn't sufficient in reality because it's impossible to perfectly determine when and how well tasks will be completed. Our project management must be flexible to changing priorities and unforeseen complexities. A common occurrence would be an extended deadline, in the event of which the assignee should document the need for it and the group can decide in follow-up how to push dependent timelines or reassign tasks to distribute workload.

### Balancing workload

Skill redundancy makes us more resilient as a team to shifting timelines. Some people have more time than others to give to the project, and it's important for development leads to ensure we keep delivering on our promises to the Couchers community even when schedules are in flux. Some features are also more challenging than others, so by being honest about the relative complexity of tasks and how long one can expect to spend on them, the team can self-regulate better by not overcommitting to involved features. This can become a critical exercise in the weekly and cycle review process that leads can use to best match tasks with team members' skills and commitment levels. With breakdowns and rollup sums of these features in every linked view above, one can easily evaluate and resolve overcommitment.
