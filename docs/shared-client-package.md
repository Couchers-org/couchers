# The shared client package

`app/client-shared` holds resource bundles that both `app/web` and `app/mobile` use — currently translation JSON, later `proto` and `services`. It owns **data only**; each app keeps its own i18next setup, because web and mobile differ on language detection, storage and SSR.

Background: [#9385](https://github.com/Couchers-org/couchers/issues/9385), [#9360](https://github.com/Couchers-org/couchers/issues/9360).

## Why it exists

The WebView shows web's UI, translated into up to 24 languages. A native screen built with new mobile-only keys starts **English only** — so a naive port turns a 12-language screen into a 1-language one.

Reusing web's existing keys means a native screen inherits every existing translation on day one. Avoiding that language regression is the main reason for this package; saving translator effort is a bonus.

## What lives where

```
              app/client-shared/locales/<namespace>/<lang>.json
              ────────────────────────────────────────────────
              Weblate's source of truth

                  global/   in, web reads it
                  <next>/   moves in when a screen needs it

                     ▲                        ▲
          link:      │                        │      file:
     ────────────────┘                        └────────────────

  app/web                                app/mobile
  ───────                                ──────────
  features/<ns>/locales/                 i18n/locales/
    13 namespaces not yet shared           native-only strings
  i18n/                                  i18n/
    next-i18next, SSR                      react-i18next, device language
```

Each app reads **shared + its own**. Neither imports from the other.

## Current state

`global` is shared and web reads it from there. **Mobile imports nothing yet** — it declares the dependency but still uses only its own 32 strings. Namespaces move in one screen at a time.

## Porting a screen

1. **Reuse web's existing keys wherever the text is the same.** This is what preserves translations — the default, not an optimisation.
2. If the namespace that screen needs isn't shared yet, move it (see [Moving a namespace](#moving-a-namespace)), import it in `app/mobile/i18n/resources.ts`, **and add it to `resources` in `app/mobile/i18n/react-i18next-types.d.ts`** — that last part is what type-checks its keys.
3. **Only add new keys where native genuinely needs different words** — shorter tab labels, permission prompts, offline banners. These start English only.
4. Before enabling the screen's GrowthBook flag, check its translation coverage against the web screen it replaces. Don't ship a screen that lost languages.

New strings go in `en.json` only; Weblate fills the rest.

### If web deletes a key mobile needs, web's PR goes red

Mobile's keys are type-checked: `app/mobile/i18n/react-i18next-types.d.ts` augments i18next's `CustomTypeOptions`, so `t("gone.key")` is a compile error. And mobile's CI jobs run on changes to `app/client-shared/**/*`. Together that means a **web** PR removing a shared key mobile uses fails `test:mobile-typecheck` on that PR — the failure names the mobile file and the missing key.

This matters because mobile has no equivalent of web's `missingKeyHandler`, which throws during `next build` and reports to Sentry in the browser. Mobile would just render the raw key.

Two things to know:

- The guard only covers namespaces mobile imports **and** lists in `react-i18next-types.d.ts`. Miss the second step and the keys aren't typed, so nothing catches the deletion.
- The augmentation must target `declare module "i18next"`, not `"react-i18next"` — `CustomTypeOptions` is exported from `i18next`, and augmenting the wrong module fails silently rather than erroring. Web currently augments the wrong one, so it has runtime key checking but not compile-time; correcting it surfaces ~111 pre-existing errors and is tracked separately.

### Move whole namespaces, not individual keys

The keys mobile needs from a namespace are keys web needs too — that's why they're already translated. So they aren't a subset to extract: pulling them out leaves web still needing them, requires editing files Weblate owns, and gains nothing.

**A namespace is shared if both apps use it.** Neither app using every key is normal, the same way neither uses every function in a shared util module.

Moving a whole namespace is a set of pure renames with zero content change. Carving keys out is not.

### Mobile only bundles what it imports

Namespaces sitting in the package unimported cost mobile nothing — they're separate files. The real cost is unused _keys_ inside a namespace it does import: `global` is 277 keys (~296KB across 24 languages) and mobile will use a fraction.

That's worth fixing eventually by splitting `global` into smaller semantic namespaces (`nav`, `actions`, `errors`) — i18next's own guidance is to split around 300 segments, and `global` has become a grab-bag. That split serves both apps and is also rename-only, so nothing here makes it harder later.

## Decisions

### Each app keeps its package manager. There is no workspace.

- `app/web` (yarn 1) depends on it as `link:../client-shared`
- `app/mobile` (npm) depends on it as `file:../client-shared`

Both produce a symlink, so edits show up with no reinstall.

Yarn 1's **`file:`** protocol copies rather than symlinks — edits don't propagate, and a plain `yarn install` doesn't even refresh it (only `yarn install --force`). **`link:`** is built for this and symlinks correctly, so no package-manager migration was needed. npm symlinks `file:` deps even above the project root.

A workspace root would have forced both apps onto one package manager, moved `node_modules`, and broken the web Docker build and Vercel's root directory.

### Layout is `locales/<namespace>/<lang>.json`, with underscores

Namespaces are **semantic**, never per-platform — per i18next's guidance, and because a `web/` + `mobile/` split would duplicate every string both apps use. Filenames use underscores (`es_419.json`) to match web's existing Weblate-tracked files, so no tracked file ever needs renaming.

### `localePath` points at `node_modules`, deliberately

`next-i18next.config.js` resolves `global` via `node_modules/@couchers/client-shared/locales/global/<lang>.json`.

`require.resolve` would be the idiomatic way to locate a package, but webpack bundles that config and rewrites `require.resolve` into a numeric module id — `path.dirname()` of it then throws during prerender, failing the build on every page. The literal path is confined to two commented places: `localePath`, and the matching glob in `next.config.js`.

### Locale JSON needs explicit file tracing, and a smoke test

Locale files are read **from disk at request time** (`next-i18next` uses `i18next-fs-backend`, and our pages are `fallback: "blocking"`), but `Dockerfile.prod`'s runner stage copies no locale directory. They reach the image only through `.next/standalone` file tracing.

That failure mode is silent: `next build` passes either way, because the builder stage has the files on disk, and `missingKeyHandler` only throws when a key resolves to _nothing_ — every locale falls back to `en`, which resolves. So:

- `next.config.js` declares the paths in `outputFileTracingIncludes`
- `app/web/ci-i18n-smoke.sh` runs the built image in `build:web` and asserts a `fallback: "blocking"` route really serves translations

### Web's Docker build gets the package as a named build context

`app/client-shared` is a sibling of the `app/web` build context, so `.gitlab-ci.yml` passes `--build-context shared=app/client-shared/` and both Dockerfiles `COPY --from=shared . /client-shared`.

That `COPY` sits **after** `yarn install`, because `link:` tolerates a missing target — so editing a locale never invalidates the install layer. Widening the context to `app/` was rejected: it would stop `app/web/.dockerignore` applying and pull `app/mobile/{node_modules,ios,android,certs}` into the build.

## Moving a namespace

`git mv` the whole namespace, repoint `localePath` and `i18n/resources.ts`, then follow [weblate.md](weblate.md): push → merge Weblate's PR → **lock** → merge yours → repoint the file mask → check the string count → **unlock**.

Then test:

```sh
# the move changed no content - git should report every locale file as a rename
git status --short | grep -c '^R '

cd app/web
yarn install --frozen-lockfile && npx tsc --noEmit && yarn test && yarn build

# the namespace reached the traced output (expect 24, one per language)
ls .next/standalone/node_modules/@couchers/client-shared/locales/<ns>/*.json | wc -l

cd ../mobile
npm ci && npx tsc --noEmit && npm test && npm run fingerprints:check   # want "match"
```

Then the runtime check, which is the one that catches a broken locale path:

```sh
cd $(git rev-parse --show-toplevel)
docker buildx build --build-context shared=$PWD/app/client-shared/ \
  --build-arg environment=production -f app/web/Dockerfile.prod \
  -t web-test $PWD/app/web/ --load
./app/web/ci-i18n-smoke.sh web-test
```

Two gotchas: run web tests with `yarn test`, not bare `npx jest` — the script sets `NEXT_PUBLIC_API_BASE_URL`, without which ~115 suites fail on an unrelated-looking error. And `--build-arg environment` must be one of `development`, `localdev`, `next`, `production`; there is no `.env.preview`.

## Rules

- **Only ever edit `en.json` in git.** Translators own every other language via Weblate. Moving an existing translation with its key is fine; authoring or reformatting one is not.
- When a language has no translation yet, leave an empty `{}` file for Weblate to fill.
- `app/client-shared/.prettierignore` keeps prettier off translator-owned files.
- Add `app/client-shared/**/*` to the `changes:` list of any new web or mobile CI job, or it won't run for translation-only changes — and Weblate PRs are exactly that.
