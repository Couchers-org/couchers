# TEMP — mobile pipeline validation (revert before prod)

This branch (`mobile/v1.1.20`) carries temporary CI wiring used to validate the
native build / OTA / TestFlight pipeline on-device. **All of the items below must
be reverted before merging to `develop` / shipping to production.** They mostly
make jobs that should run on the release branch (`develop`) run on this branch
instead, and enable a store submit that should not happen from a feature branch.

Everything lives in `app/.gitlab-ci.yml` unless noted.

## Must revert

1. **`DEVTOOL_BUILD_BRANCH`** (~line 20) — currently `disabled` (matches no branch),
   which turns the Dev Tool native rebuild (`build:devtool-native`) **off** while we
   iterate on the production build. **TODO:** to resume on-device Dev Tool
   validation, point it back at `mobile/v1.1.20`; the final value on revert is
   `develop`. NOTE: while disabled, nothing builds the Android app on this branch
   (production Android is release-only), so Android-side native changes aren't
   CI-validated here until then.

2. **Per-job `TEMP` rules pinning to `mobile/v1.1.20`** — remove the extra
   `- if: $CI_COMMIT_BRANCH == "mobile/v1.1.20"` rule (and its TEMP comment) from
   each of these jobs, leaving only the `$CI_COMMIT_BRANCH == $RELEASE_BRANCH`
   rule:
   - `build:mobile-ota-staging`
   - `deploy:mobile-ota-staging`
   - `.production-native` (shared by the production native build jobs)
   - `build:mobile-ota-prod`
   - `preview:mobile-ota-prod`
   - `build:native-ota-manifest`
   - `deploy:native-ota-info`

3. **`deploy:production-native-ios`** — remove the TEMP rule that submits to
   TestFlight from this branch. Submits should only happen on `$RELEASE_BRANCH`.

4. **Production Android build + submit disabled (`rules: - when: never`)** —
   `build:production-native-android` and `deploy:production-native-android` are
   turned off everywhere while we iterate on iOS/TestFlight (Android-side native
   bits like `@expo/app-integrity` / Play Integrity aren't validated yet). **TODO:**
   re-enable by restoring the release-only rule on both jobs:
   `- if: ($BUILD_MOBILE == "true") && ($CI_COMMIT_BRANCH == $RELEASE_BRANCH)`
   (the version-compute `before_script` + `GIT_DEPTH: 0` are already in place, so
   it's just the rule). Then drop `.production-native`'s TEMP rule per item 2.

## Notes

- These are CI gating changes only; the Sentry setup, source-map upload, and the
  build-status check in `scripts/production-build.sh` are permanent and should
  stay.
- Sanity check after reverting: no job rule should reference `mobile/v1.1.20`
  (`grep -n "mobile/v1.1.20" app/.gitlab-ci.yml` should return nothing).
