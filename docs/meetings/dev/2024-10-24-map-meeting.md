# Map meeting

When: 24/10/24, 20:30 UTC.
Present: David, Jesse, Krishna, Nicole, Yannic

# Notes

- What is the problem with the map?

  - We display all users of the platform, but once we search we return a very small subset
  - We don't have pagination
  - These two things combined might confuse the user, since the behavior isn't consistent at all
  - What’s on the sidebar doesn’t always relate to the map
  - Appears like there are less users than there are, bad for users.

- What's been done so far:

  - David has a proposal in [#4847](https://github.com/Couchers-org/couchers/issues/4847)
  - David and Jesse have discussed already gone through map reported issues

- Worries we have

  - Showing every user on the map is a very intensive query, probably not scalable. What's the use case besides users seeing how many users we have? We can probably convey that info another way if it's the only use case

- Solutions we discussed

  - Don't load map until there is some kind of region or city in the search
  - Add spinner when searching, user is confused and doesn't know when it's loading
  - Make list only optional view - this should be default on mobile. Maps are not great UI on mobile devices.
  - Pagination vs. infinite scroll. Maybe pagination better for lots of results, i.e. user searching for host, there are 50 pages, they want to take a break and continue looking at profiles where they left off.
  - Add number of results for user feedback, then they are clear they are seeing a truncated portion

- Outstanding decisions
  - What do we show on initial load? User's home location zoomed in? Or nothing until user types in location search box?
  - Do we have pagination on the backend?
  - Where do we start? We mentioned starting with the initial loading decision.
