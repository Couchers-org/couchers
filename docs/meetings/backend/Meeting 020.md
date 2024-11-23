# Backend team meeting #20

When: 31/3/21, 20:00 UTC.
Attending: Aapeli, Christian, Lucas, Sam, Yannic

## Notes

* (lat, lng) to tz conversion
    - Aapeli thinks pulling in a python lib is not the way to go given we already have the heavy machinery of postgis
    - We should pull the data into the database directly from https://github.com/evansiroky/timezone-boundary-builder
    - Introduces the perennial problem of constant data tables in the db and their management
    - Will be discussed on Slack
* Current stuff:
    - Aapeli: References
    - Aapeli: Events
    - Omer: Coordinates to timezones
    - Sam: Countries visited + languages
    - Sam: User hiding/blocking
    - Christian: Schema migrations
    - Yannic: Coordinate wrapping
* Big stuff:
    - Timezone stuff
    - Search for discussions
    - Search in conversations
    - Admin API
    - Mod API
    - Phone verification
    - Invitation feature
    - Map tiling
    - Split user and profile into different tables
    - Making emails pretty
    - More testing?
* Community stuff
* Refactoring stuff:
    - Careful refactoring of API surface given what we learned from the last 10 months, this should either be done pre-mobile or as API v2
    - Real-time notification system
* Small stuff:
    - Set email frequency to 5-6 min
    - Nagging about writing references
    - Full/thumbnail image URL: substitute
    - Checking emails are correct
* Aapeli: get list of basic admin/mod tools from Itsi
* Mobile app stuff, two hard things: making the right technical decisions and recruiting good people. We'll slowly ramp up this effort over the next few months.
