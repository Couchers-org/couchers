# Native update logic — `CheckNativeStatus` evergreen + ban

Design for the backend logic behind `CheckNativeStatus`. The mobile app pings this
on cold start / foreground with a diagnostics payload and gets back a
`NativeUpdateInfo` telling it whether (and how) to update. Today the servicer is a
stub that always returns `NATIVE_UPDATE_ACTION_NONE`. This replaces it with a real
**evergreen + ban** decision, factored into a shared module so the OTA manifest
endpoint can reuse the policy bits.

**Status:** design / not yet implemented.

---

## Principles

- **Evergreen.** A build is supported for a fixed time from when it was created.
  Past that, the client must update. Keeps everyone on recent code.
- **Bannable.** A specific bad build can be force-expired immediately, regardless
  of age.
- **GrowthBook = policy, never data.** GrowthBook decides the OTA **channel**
  (`stable` vs `edge`) and the **support-time limits** / ban list / presentation.
  It does not hold release data. (The current `native_ota_bundles` flag is a
  temporary hack and is not part of this decision.)
- **No reinstall.** `REINSTALL` is a true last resort for an actual brick, not a
  routine outcome — never derived from version/time rules here.

---

## Two clocks

Two independent support windows apply to two different things:

- **Store window (~91d)** gates the **native binary**. Always applies. A fresh OTA
  still runs on top of an old binary, so no OTA can rescue a binary past its window
  → the only fix is a store update.
- **OTA window (~28d)** gates the **JS bundle** running on top. Applies only when
  the client is actually running an OTA bundle.

Each clock needs the relevant build's own creation time. The client reports the
running bundle's created-at and (one way or another) the embedded binary's
created-at; the exact request format is pinned later (see Open items).

## Per-clock state

```
frac = age / window
banned      → block
frac ≥ 1.0  → block
frac ≥ 0.75 → warn
else        → none
```

The `0.75` warning threshold is derived from the window, not a separate knob.

## Resolving the two clocks

Resolve by **severity first, then store precedence**:

- `overall` = worst state across the applicable clocks (store always; OTA only when
  running one).
- **block:** the blocking clock decides the action — `STORE` if the binary is
  blocking (no OTA rescues it), otherwise `OTA`.
- **warn:** `STORE` if the binary is warning, otherwise `OTA`.
- **none:** `NATIVE_UPDATE_ACTION_NONE`.

This handles mixed states correctly — e.g. binary at 80% (warn) but the running OTA
past 28d (block) → **OTA block** (fetch fresh JS; the binary still has life), not a
dismissible store warning.

## Mapping to the client contract

`NativeUpdateInfo` is filled from the resolved decision:

- Actionable (`warn` or `block`): `action` = chosen action, `required = true`,
  `act_by = created_at + window` for the chosen clock (banned → `act_by = now`),
  plus `message` / `link_url` / `link_text` from policy.
- `none`: `action = NATIVE_UPDATE_ACTION_NONE`, `required = false`.

The mobile client already turns this into the right UI: `required` + future `act_by`
→ dismissible **warn** (shows the deadline); `required` + past/unset `act_by` →
non-dismissible **block**; not required → nothing. So the warn→block transition at
the deadline happens client-side automatically — the backend only decides **when to
start emitting** (≥75%) and **which clock/action**.

---

## GrowthBook policy flags

Policy only; defaults baked in code so an unconfigured flag = current behaviour.

| Flag | Type | Default | Purpose |
| --- | --- | --- | --- |
| `native_ota_channel` | string | `stable` | `stable` \| `edge`, per user. **Shared** with the OTA endpoint, which serves the channel's bundle. |
| `native_ota_support_days` | int | `28` | OTA (JS bundle) window. |
| `native_store_support_days` | int | `91` | Store (native binary) window. |
| `native_banned_builds` | list | `[]` | Build identifiers to force-expire immediately. |
| `native_store_url` / messages | object | — | Per-platform store link + prompt copy. |

---

## Module: `couchers/native_updates.py`

Pure logic, no proto/servicer deps; reads flags through `CouchersContext`.

- `parse_client_info(debug_json) -> NativeClientInfo` — tolerant parse (malformed →
  empty, logged, never raises). Abstract over the exact fields for now.
- `select_ota_channel(context) -> "stable" | "edge"` — **shared** with
  `GetNativeUpdateManifest`.
- `is_banned(context, info)` — **shared**.
- `decide_native_update(context, info, now) -> NativeUpdateDecision` — the two-clock
  rule above. The `CheckNativeStatus` servicer maps the returned decision onto
  `NativeUpdateInfo`.

`CheckNativeStatus` becomes: `parse_client_info` → `decide_native_update` → map to
proto. `GetNativeUpdateManifest` adopts `select_ota_channel` / `is_banned`; replacing
its `native_ota_bundles` data path is out of scope for this change.

---

## Open items

- **Request format.** Exact `debug_json` fields (native binary created-at, running
  bundle created-at, launch type, ban identifiers) are designed abstractly here and
  pinned in stone once this is closed.
- **Ban identifiers.** What we match `native_banned_builds` against (update id for
  OTAs, debug/display version for store builds, or fingerprint).
- **Replacing `native_ota_bundles`.** The OTA endpoint's release-data source is a
  separate follow-up; this change only shares the policy helpers.
