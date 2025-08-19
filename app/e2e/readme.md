# End-to-end tests

## How to run

If you need help setting up the repository, [please refer to the web dev readme](web/readme.md) first

```sh
# cd into the repository_root/app/e2e directory
# assuming you are currently in the repository root:
cd app/web

# install Playwright
yarn install
# install Playwright browser dependencies
yarn deps:install
# install Playwright browsers
yarn browsers:install
# run tests
yarn test
```

> [!NOTE]
> Tests run against local frontend server by default.

### Configuration

To run the tests against other frontends, set the `FRONTEND_URL`, `TEST_USER_USERNAME` and `TEST_USER_PASSWORD` environment variables to configure the URL and test user credentials
