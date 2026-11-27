# Search Results UX Improvements

Todos for improving the map search results page, in the order we plan to build them. Each item is meant to be one small PR. Tick items off as they merge.

Mockup: https://claude.ai/artifact/K7sXNsMyewXPQzPFyHvYPZ

- [Map view with results sheet](https://claude.ai/artifact/K7sXNsMyewXPQzPFyHvYPZ#artboard-OptionA)
- [List view](https://claude.ai/artifact/K7sXNsMyewXPQzPFyHvYPZ#artboard-OptionAList)
- [Filters sheet with keyword search](https://claude.ai/artifact/K7sXNsMyewXPQzPFyHvYPZ#artboard-Filters)
- [Results line states and paging](https://claude.ai/artifact/K7sXNsMyewXPQzPFyHvYPZ#artboard-States)
- [Compact result card](https://claude.ai/artifact/K7sXNsMyewXPQzPFyHvYPZ#artboard-Card)

## The problems we're solving

- **Members think there are fewer people than there are.** The results line counts only what the current filters show, and location searches quietly hide "can't host" people, so an area with 1,450 members can look like it has 250.
- **It isn't clear when filters are on**, or how to turn them off.
- **On mobile you only see half a result card** on load, under a big map.
- **The search bar is crowded:** a By location / By keyword toggle, the input and the filter button share one small pill.

## 1. Show how many members there really are

- [x] **Count everyone in the area, and stop hiding empty profiles by default** (`nabramow/adjust-search-screen`). Uses the backend's new `total_unfiltered_items` for the area total; when it's 0 (keyword searches, or bfc off) the area line is left out. Removes the Beta tag. Location searches no longer hide empty profiles; "can't host" stays hidden by default until step 3 makes it visible.
- [x] **Clearer results line** (`nabramow/adjust-search-screen`). Replaces "1–100 of N people" with a bold line and a grey line under it: "250 hosts in Berlin" / "of 1,450 members in this area" (members when the hosting filter isn't hosts-only, "…in this area" when no place was searched, no grey area line when filters hide nobody). Keyword searches: "12 members match "climbing"". Nothing matches: "No hosts match your filters" / "5,090 members are in Berlin". Without an area total (keyword searches, or bfc off) the grey line shows "Results 1–100" instead, so the line looks the same with and without bfc.

## 2. Make active filters obvious

- [x] **Count badge on the filter button** (`nabramow/adjust-search-screen`) whenever filters are on, using the shared teal `NotificationBadge`. Replaces the tinted icon and the separate × "Clear filters" button; clearing is in the filters sheet.
- [x] **"2 filters" in the results line** (`nabramow/adjust-search-screen`), with the filter icon, on the grey line; tapping it opens the filters sheet. Removes the "By default, "can't host" profiles are hidden" box and its "Show all profiles" button.

## 3. Hosts | Meetups | All

- [ ] **Add the Hosts | Meetups | All switch** at the top of the results sheet, full width. Hosts = can host or maybe; Meetups = wants to or open to meet up; All = no status filter. These map onto the existing hosting and meetup status filters, so no backend change.
- [ ] **Remove the hidden "can't host" default.** Hosts becomes the visible default instead (the suggestion box is already gone, see step 2). Give the switch its own short text keys with a translator note (members open to meeting in person, not events).

## 4. Simpler search bar

- [ ] **Move keyword search into the filters sheet** as "Search by name or keyword", and remove the By location / By keyword toggle. The search bar becomes location only.
- [ ] **Plain × inside the search field** to clear it (no circle), only shown when there's text.
- [ ] **"Show 42 members" on the sheet's apply button**, saying how many match before applying.

## 5. Compact result card

- [ ] **Shorter card (about 188px instead of 220px)** so more fit on screen: 48px avatar, name and verification badge, "34 · Woman · Kreuzberg", hosting/meetup/references on one row with teal icons, about text clamped to 2 lines.
- [ ] **One activity line** at the bottom: "Active 2 days ago · Replies within a day", combining today's separate Active and Response rate lines. Drop the "open in new tab" icon; tapping the card opens the profile.
- [ ] **Tapping a card opens the profile; selecting happens from the map.** Today tapping a card outlines it, lights its pin and moves the map, and only the name, avatar or icon open the profile. Why change: one job per tap, the way people expect map search to work. On a phone there's no longer a way to go from a card to its pin; the card already shows the person's area. Instead:
  - Tapping a card opens the profile sheet (a new tab on desktop).
  - Tapping a pin lights it up and scrolls the list to that card, outlined.
  - On desktop, hovering a card lights up its pin without moving the map.
- [ ] **Loading skeleton instead of the spinner:** a grey bar for the results line and two placeholder cards shaped like the compact card, in place of the centred spinner in `MapSearchResultsList.tsx`.

## 6. Mobile results sheet

- [ ] **Results sheet over the map** with a drag handle, starting low so about 1.5–2 cards show under the map, as today the map stays visible by default.
- [ ] **Map | list icon toggle** next to the results line, replacing the expand/collapse arrow. In list view the results line and toggle stay pinned under the search bar.
- [ ] **Only search bar, filter button and "Search this area" over the map**, nothing else stacked there.

## 7. Paging

- [ ] **Inline Previous / Next at the end of the list** ("‹ 1–20 of 250 ›") instead of the sticky bar at the bottom of the screen.

## Later

- [ ] Desktop layout pass, using the same results line, switch, badge and card
- [ ] **Log `search.results_rendered` from a `useEffectEvent`** in `SearchPage.tsx`. Why: the effect lists 19 dependencies only because the log reads them; with an Effect Event (React 19.2+, the pattern React's docs use for analytics) it only depends on the results, loading state, search ID and page, and stops re-running on unrelated changes like map moves.
- [ ] **Keep the search state in the URL** (place, area, filters, page). Why: so a search can be shared as a link, survives a refresh, and the back button returns to it. `pages/search.tsx` already reads some of it on load (see the TODO in `mapSearchContext.tsx`).
