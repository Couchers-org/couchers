# Weblate dev guide

Weblate is our translation platform which we self-host at https://translate.couchershq.org. It provides a UI for translators to consume our `locales/en.json` files and produce `locales/<not-en>.json` files for every locale we support.

Weblate maintains a clone of the `git` repo. It appends commits with translation changes to its `develop` branch, and periodically opens pull requests to merge its `develop` branch into GitHub's. Sometimes conflicts can happen where this merge operation fails, at which point Weblate locks up until we resolve it.

Although all Weblate components share the same `git` repo clone, the [web-app-auth](https://translate.couchershq.org/git/couchers/web-app-auth) component is configured to own the clone, and other components are configured to refence it. As such, all Weblate repo maintenance operations are on the `web-app-auth` component.

You can add Weblate's repo clone for read-only access as any other remote. We usually call it `weblate`:

```sh
# From your couchers git repo clone
git remote add weblate https://translate.couchershq.org/git/couchers/web-app-auth/
git fetch weblate develop
```

## Avoiding conflicts

- ✅ DO: Always merge Weblate PRs using the `merge` strategy. To make this easier, the [weblate-automerge.yml](.github/weblate-automerge.yml) GitHub workflow will mark new Weblate PRs as auto-merging with the `merge` strategy.
  - ❌ DO NOT: Merge them using the `squash` strategy.
- ✅ DO: Whenever possible, only modify `en.json` files in GitHub, and only modify translation files via Weblate.
  - ❌ AVOID: Modifying translation files in GitHub.
- ✅ DO: When removing strings, only remove them from `en.json` and let Weblate automatically clean up the translation files.
  - ❌ AVOID: Removing strings from translation files in GitHub.

### Changing string keys

Changing string keys is tricky as you might want to update the key in translation files at the same time, which can cause conflicts if nearby strings are being modified in Weblate.

**For one-offs string key changes**, or if the string text is changing as well, consider leaving the translation files untouched in your PR. After merging, Weblate will delete the string from translation files and translators will need to retranslate the new string, but they can reuse the previous text using Weblate's translation memory.

If you're confident that your string's translations and its viscinity are not being changed in any language, you can take a risk and update them in your PR.

**For larger string key refactorings**, follow these steps:

1. Go to [Weblate repo maintenance](https://translate.couchershq.org/projects/couchers/web-app-auth/#repository) and use the "Push" button to flush any new Weblate commits to a pull request.
1. Lock the Weblate component from its [admin console](https://translate.couchershq.org/admin/trans/component/).
1. Approve and merge the pull request.
1. Refactor the string keys, open a PR and merge it.
1. Unlock the Weblate component.

## Why conflicts occur

Weblate conflicts occur when it fails to reconciliate GitHub's `develop` branch with its own `develop`, meaning that a translation file was modified in GitHub and differently in Weblate. Surprisingly, conflicts are also likely when merging Weblate PRs using the `squash` strategy, since Weblate's won't find its commits in upstream, and its individual commits might conflict with the final squashed commit in GitHub, even if they lead to the same file state. For this reason, Webl

## Resolving conflicts

The goal of conflict resolution is to allow Weblate to reconciliate its queued commits with what's already in GitHub. Weblate gives a few tools to modify its `develop` branch, but those are fraught (big scary red buttons), so the better approach is to merge Weblate's queued commits into GitHub, after which it will automatically clear its queue. Follow the steps below, and make sure to merge your PR with the `merge` strategy!

```sh
git fetch origin develop
git checkout origin/develop

git fetch weblate develop
git merge weblate/develop

# <resolve any conflicts and commit the resolution>

git checkout -b i18n/merge-weblate
git push
```
