# Couchers.org landing page

![Build badge](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiQ0dZUmlKNGZMREx1RXlxcnRLSTlJTnlnNU9DR3RHRVk3R1NZKzZibkJYN3hTTGdNWVZFZG1raVpyOGxPckVsd3JqcDV6aktGTUI3c1Z4cEhNMkN3ZTdRPSIsIml2UGFyYW1ldGVyU3BlYyI6Ik4rVEd4YmF3UmljQmJYYWYiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

This site is automatically built on CodeBuild and deployed to S3 + CloudFront according to `buildspec.yml`.

## Build Setup

```bash
# install dependencies
$ yarn install

# generate css
$ yarn css-build

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org). We're using [Bulma](https://bulma.io/) for widgets.
