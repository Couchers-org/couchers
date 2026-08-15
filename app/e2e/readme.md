# Couchers browser automation

Two things live here, built on the same navigation code:

- **Recipes** (`recipes/`) — named capture points. "Get the app into state X and
  screenshot it." Used for before/after PR screenshots, spotting visual
  breakage, and giving translators context for where a string appears.
- **Flows** (`specs/flows/`) — real click-through tests that assert core user
  journeys still work.

## Quick start

You need the web frontend running. The default setup from `app/web/readme.md`
is all this needs — no docker:

```sh
## terminal 1
cd app/web
yarn dev

## terminal 2
cd app/e2e
nvm use
yarn install
npx playwright install chromium
yarn shots
```

Screenshots land in `screenshots/<device>-<theme>/<recipe>/<name>.png`, each
with a `.json` sidecar describing what it is.

## Targets

A target is which running app we point at. Set `E2E_TARGET`:

| Target | Frontend | Backend | Notes |
| --- | --- | --- | --- |
| `next` (default) | `localhost:3000` | `next.couchershq.org` | Plain `yarn dev`. No email access, so no signup flows. |
| `localdev` | `localhost:3000` | `localhost:8888` | Needs `docker compose up` in `app/`. Seeded dummy data and MailDev. |

`E2E_BASE_URL` overrides the frontend URL, for pointing at a Vercel preview or
a deployed build.

## Personas

`anon` needs no credentials and works everywhere. `member` is an established
user with a filled-in profile.

On `localdev`, `member` is the `aapeli` dummy user and works out of the box. On
`next` there is no seeded data, so supply an account:

```sh
export E2E_MEMBER_USERNAME=...
export E2E_MEMBER_PASSWORD=...
```

Without these, recipes needing `member` skip with a message rather than
failing, so `yarn shots` still produces the logged-out set.

Each persona logs in once per run and the session is reused across the whole
matrix (`specs/auth.setup.ts`).

## Narrowing a run

```sh
yarn shots --grep "landing/"          # one area
E2E_DEVICES=desktop yarn shots        # one device
E2E_THEMES=light yarn shots           # one theme
yarn shots --headed                   # watch it happen
yarn report                           # open the last HTML report
```

Devices: `desktop`, `mobile` (both default), plus opt-in `tablet`,
`mobile-safari`, `desktop-firefox`. The defaults are Chromium because MapLibre
needs SwiftShader to render headless, and those flags are Chromium-only — maps
come out blank on the WebKit and Firefox devices.

## Writing a recipe

```ts
// recipes/events.recipe.ts
import { recipe } from "../runner/recipe";

export const eventsList = recipe({
  id: "events/list",
  title: "Events list",
  as: "member",
  async capture({ page, nav, shot }) {
    await nav.goto("/events");
    await shot("default");
    await page.getByRole("tab", { name: "Past" }).click();
    await shot("past");
  },
});
```

Then add the file to `recipes/index.ts`. Notes:

- `id` is the output path and should stay stable — before/after diffing and
  Weblate association both key off it.
- Recipes needing something a target can't offer declare it: `needs: ["maildev"]`
  skips on `next` instead of failing.
- Map canvases are masked automatically; pass `mask: []` to a shot if the map
  is the point.
- Put anything clickable that more than one recipe needs into `pages/`, not
  into the recipe.

## Determinism

Screenshots are only useful for spotting breakage if they don't change on their
own. `runner/stabilize.ts` fixes the clock, kills animations and transitions,
hides the caret, and waits for fonts. The runner pins locale to `en-US` and
timezone to UTC, and masks map canvases. Dev-only chrome (the Next.js overlay,
react-query devtools, the preview-build chip) is hidden at capture time.

If a shot turns out to be flaky, fix the source of the nondeterminism here
rather than adding a sleep to the recipe.
