# CI/CD

This lists some of the stuff the CI/CD pipeline does.

It runs on GitLab at [couchers/couchers](https://gitlab.com/couchers/couchers/). Their CI/CD is super awesome and we're supposed to be getting an open-source license to get even more of that good stuff.

Note on slugs: each branch has a slug, normally you just replace non-alphanumberic stuff with dashes, so `frontend/feature/login` becomes `frontend-feature-login`. The previews and artifacts can usually be identified based on this slug or the commit hash.

## Quick links

* Latest compiled protos: <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=protos>
* Built react frontend: <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=build:frontend>
* Frontend as at `develop`: <https://develop--frontend.preview.coucher.org/>
* (legaccy) vue frontend from `develop`: <https://develop--vue.preview.coucher.org/>
* Storybook previews off `develop`: <https://develop--storybook.preview.coucher.org/>
* Current backend test coverage on `develop`: <https://develop--bcov.preview.coucher.org/>
* Current frontend test coverage on `develop`: <https://develop--fcov.preview.coucher.org/>

## Tests

The CI/CD pipeline runs the tests in `//app/backend`, `//app/media`, and `//app/frontend`. You can see test results in the pipeline overview. If the tests fail, the status check will fail and you won't be able to merge a PR.

## Pre-compiled protos and frontends

You can download compiled protos from the "artifacts" section. Each has a unique URL also, and you can get the latest compiled protos from here <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=protos>. E.g. if you don't want to run docker to compile them. You will need to drop them in the right spots though.

Similarly you can download a built frontend, e.g. at <https://gitlab.com/couchers/couchers/-/jobs/artifacts/develop/download?job=build:frontend> if you want the built react frontend (this is what we deploy).

## Frontend previews

The pipeline builds previews of the react frontend (`frontend`), the old vue frontend (`vue`), the storybook boards (`storybook`), and code coverage for backend (`bcov`) and frontend (`fcov`). You can access these are <https://{slug/hash}--{type}.preview.coucher.org> where `slug/hash` is either the branch slug or its short hash (first 8 characters of the commit hash), `type` is one of `frontend/vue/storybook/bcov/fcov`. The previews point to the current prod API.

These links are also printed at the end of the `preview` jobs in the pipeline.

## Docker images

The whole point of the pipeline is to build docker images, so of course you can get those too. You can get the latest versions of our containers as:

* registry.gitlab.com/couchers/couchers/backend
* registry.gitlab.com/couchers/couchers/media
* registry.gitlab.com/couchers/couchers/proxy
* registry.gitlab.com/couchers/couchers/nginx
* registry.gitlab.com/couchers/couchers/frontend

For example, to start the frontend in docker locally, you could theoretically run `docker run registry.gitlab.com/couchers/couchers/frontend`.

Note that although we aim to keep the `develop` branch always stable, we guarantee nothing, and sometimes things do break even there. Similarly, at the moment we release manually, so the app might not always be running the `:latest` containers.
