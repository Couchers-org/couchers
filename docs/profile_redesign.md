# Profile Redesign

Todos for the profile redesign, in the order we plan to build them. Each item is meant to be one small PR. Tick items off as they merge.

Design canvas: https://claude.ai/artifact/5TNzzDbecW4bmQGXLvKJUy (not set in stone, we'll adjust as needed with each smaller PR)

The native app shows the web profile, so web changes cover mobile too.

## 1. Quick wins

- [ ] **Profile box header:** soft card (1px border, radius 16, no shadow), round photo, teal pin before the city, "@username · local time", teal couch and pin icons for hosting and meetup status.
- [ ] **Three stat boxes:** references count (links to the References tab), last active and "Coucher since", in one bordered row. Long values wrap, never truncate.

## 2. Trust signals in the overview (inside today's tabs)

- [ ] **Latest reference preview card** with "Read all N references", switching to the References tab. Hidden when there are no references.
- [ ] **"Staying with X" teaser:** one essentials line (sleeping privacy, max guests, last-minute) linking to the Home tab.
- [ ] **Connections card:** one card with two versions. On someone else's profile, friends in common (call `ListMutualFriends` from the web, avatars via `useLiteUsers`), hidden when there are none or when logged out. On your own profile, "Your connections": friend count, avatar stack, "N new friend requests · Review". Replaces the outlined "My connections" button in `Overview.tsx`.
- [ ] **Profile completeness on your own profile:** a scale (e.g. "Your profile is 70% complete") with the next steps to finish it, like adding a photo, writing more about yourself, filling in My home or getting verified. Today completeness is only yes/no (`profile_complete`, `has_completed_my_home`), so decide which fields count and whether it's worked out on the web or the backend.
- [ ] **Action buttons:** Request to stay (contained), Message (outlined), Add friend and Report as small grey text buttons.

## 3. Restyle each section (still in tabs)

- [ ] **"Who is X?":** full bio in larger type, Mansalva title, free time and additional info in two columns, details box with dotted rows.
- [ ] **"Staying with X" (Home tab):** host's own text first, House rules callout, Hosting preferences and My home lists showing every field.
- [ ] **References, backend:** add `hosting_city` to `Reference` (join `HostRequest` in `ListReferences`, no lazy loading). Exposes stay cities publicly, so confirm with Aapeli first.
- [ ] **References, frontend:** type label pills, "Mika stayed with Sophie in Lyon" sentences, latest 3 then "Show all N references".
- [ ] **Travel card:** smaller map, "Travelled to" clamped to 2 lines with "Show all N".

## 4. Edit one section at a time

Today you edit your whole profile on one page with "about" and "home" tabs. Instead, each section of your own profile gets its own Edit button that opens only that section's fields, and saves only them.

- [ ] **Edit "Who is X?":** bio, free time, additional information.
- [ ] **Edit details:** languages, grew up in, occupation, education.
- [ ] **Edit "Staying with X":** about my home, sleeping arrangement, local area, house rules.
- [ ] **Edit Hosting preferences and My home** answers.
- [ ] **Edit travel:** regions lived in and travelled to.
- [ ] **Retire the full edit page,** or keep it as a fallback, once every section can be edited on its own.

## 5. One-page profile (behind a GrowthBook flag)

- [ ] **One page, no tabs:** sections stacked with stable ids. Old tab URLs (`/user/:username/home`, `/references`) scroll to `#home` / `#references` instead of 404ing.
- [ ] **Desktop layout:** sticky left panel (~330px) and content column (max 700px).
- [ ] **Mobile sticky bottom action bar:** hosting/meetup status on the left, Message and Request to stay on the right.
- [ ] **Message compose in the left panel** on desktop, and as a bottom sheet on mobile.
- [ ] **Remove the flag** once it's been live for everyone.

## Related, outside the profile

- [ ] **"My connections" in the avatar menu**, after Profile, with the pending friend request count badge (`useNotifications()`). Can ship any time.

## Later

- [ ] "My Home" photos, up to 3 (#10091)
- [ ] Request to stay in the left panel, like Message
- [ ] Share / copy profile link
- [ ] Active public trips on the profile
