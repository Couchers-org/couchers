# Weblate aka translation platform dev guide

Weblate maintains a copy of the `git` repo, and it will sometimes get out of date and break.

Here are some instructions for fixing weblate for a dev with familiarity with git.

## Cloning the weblate repo

You can just add another remote, say `weblate`:

```sh
# go to the couchers git repo
git remote add weblate https://translate.couchershq.org/git/couchers/web-app-auth/
git fetch weblate
```

## Diffing changes

For now all of our translations are in `.json` files, so you can get a superset of whatever is going on in weblate as a diff like this:

```sh
# e.g. go on develop
git checkout develop
git fetch weblate
git diff develop weblate/develop -- '**/*.json' > translations.diff
# now clean up translations.diff to make sure there's nothing unrelated there
# then apply the differences
git apply < translations.diff
```

In between, you'll want to inspect `translations.diff` and remove anything that doesn't touch translation files.

## Resolving merge conflicts

Once in a while, Weblate will get in a bad state and be unable to merge its `develop` branch with GitHub's. When this happens, you can manually push a PR to perform the merge, resolving any conflicts (sometimes there aren't any):

```sh
git checkout origin/develop
git merge weblate/develop
git checkout -b my-merge-weblate-branch
git push my-merge-weblate-branch
```

After merging that PR, Weblate will try to rebase its branch on the new GitHub `develop` branch. If it doesn't automatically recover, navigate to https://translate.couchershq.org/projects/couchers/web-app-auth and use the "Update with merge" button. This should succeed since the two branches should be identical after your merge.
