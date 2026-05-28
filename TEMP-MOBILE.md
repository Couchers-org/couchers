# TEMP — mobile pipeline validation (revert before prod)

This branch (`mobile/v1.1.20`) carries temporary CI wiring used to validate the
native build / OTA / TestFlight pipeline on-device. **All of the items below must
be reverted before merging to `develop` / shipping to production.** They mostly
make jobs that should run on the release branch (`develop`) run on this branch
instead, and enable a store submit that should not happen from a feature branch.

Everything lives in `app/.gitlab-ci.yml` unless noted.

## Must revert

1. **`DEVTOOL_BUILD_BRANCH: mobile/v1.1.20`** (~line 20) — set back to `develop`.
   Controls where `build:devtool-native` runs.

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

4. **`build:production-native-android` `rules:` override** — this override
   (release-branch-only) was added to stop Android rebuilding every pipeline on
   the temp branch, since its submit (and therefore its fingerprint-marker write)
   is disabled here. Once item 2 removes `.production-native`'s TEMP rule, the
   parent is release-only again and this override is redundant — delete it so the
   job inherits `.production-native` like `build:production-native-ios`.

## Notes

- These are CI gating changes only; the Sentry setup, source-map upload, and the
  build-status check in `scripts/production-build.sh` are permanent and should
  stay.
- Sanity check after reverting: no job rule should reference `mobile/v1.1.20`
  (`grep -n "mobile/v1.1.20" app/.gitlab-ci.yml` should return nothing).
