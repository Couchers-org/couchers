# CI/CD

This lists some of the stuff the CI/CD pipeline does.

It runs on GitLab at [couchers/couchers](https://gitlab.com/couchers/couchers/). Their CI/CD is super awesome and we're supposed to be getting an open-source license to get even more of that good stuff.

Note on slugs: each branch has a slug generated from the branch name, normally you just replace non-alphanumberic stuff with dashes, so a branch name of `web/feature/login` gets a slug of `web-feature-login`. The previews and artifacts can usually be identified based on this slug or the commit hash. (The slug is useful for use in places where you can't use slashes, e.g. URLs or docker image names).

## Quick links

* Latest compiled protos: <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=protos>
* Built react web frontend: <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=build:web>
* Web as at `develop`: <https://develop--web.preview.couchershq.org/>
* Storybook previews off `develop`: <https://develop--storybook.preview.couchershq.org/>
* Current backend test coverage on `develop`: <https://develop--bcov.preview.couchershq.org/>
* Current web test coverage on `develop`: <https://develop--wcov.preview.couchershq.org/>

## Tests

The CI/CD pipeline runs the tests in `//app/backend`, `//app/media`, and `//app/frontend/couchers-*`. You can see test results in the pipeline overview. If the tests fail, the status check will fail and you won't be able to merge a PR.

## Pre-compiled protos and web frontend

You can download compiled protos from the "artifacts" section. Each has a unique URL also, and you can get the latest compiled protos from here <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=protos>. E.g. if you don't want to run docker to compile them. You will need to drop them in the right spots though.

Similarly you can download a built web frontend, e.g. at <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=build:web> if you want the built web frontend (this is what we deploy).

## Web previews

The pipeline builds previews of the web frontend (`web`), the storybook boards (`storybook`), and code coverage for backend (`bcov`) and web frontend (`wcov`). You can access these are <https://{slug/hash}--{type}.preview.couchershq.org> where `slug/hash` is either the branch slug or its short hash (first 8 characters of the commit hash), `type` is one of `web/storybook/bcov/wcov`. The previews point to the current prod API.

These links are also printed at the end of the `preview` jobs in the pipeline.

## Docker images

The whole point of the pipeline is to build docker images, so of course you can get those too. You can get the latest versions of our containers as:

* registry.gitlab.com/couchers/couchers/backend
* registry.gitlab.com/couchers/couchers/media
* registry.gitlab.com/couchers/couchers/proxy
* registry.gitlab.com/couchers/couchers/nginx
* registry.gitlab.com/couchers/couchers/web

For example, to start the web frontend in docker locally, you could theoretically run `docker run registry.gitlab.com/couchers/couchers/web`.

Note that although we aim to keep the `develop` branch always stable, we guarantee nothing, and sometimes things do break even there. Similarly, at the moment we release manually, so the app might not always be running the `:latest` containers.
