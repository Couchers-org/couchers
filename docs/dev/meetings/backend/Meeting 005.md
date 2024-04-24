# Backend team meeting #5

Attending: Aapeli, Christian, Claudio, Itsi, Josh, Lucas, Michael, Nick, Sam

## Rough Agenda

Focus is on getting new members up and running and giving them good tasks to poke around on the codebase.

* Welcome to all new members: Claudio, Michael, Nick, Sam
* Where we're at with backend and the product
* How comfortable are people with git and GitHub?
* Reminder about collaboration tools: freedcamp, github, [our dev workflow (dev contributor guide)](https://github.com/Couchers-org/couchers/blob/develop/docs/contributing.md)
* Overview of architecture: postgres for persistence, backend in python/sqlalchemy/grpc, envoy proxy in middle, frontend in Vue.js
* Screenshare and go through current list of issues, demo app a bit, talk about code for a moment
* Discussion on alpha release: DB is botched due to Aapeli using "features" of SQLite, we'll slap it on an EC2 server for now and move to postgres in next few days.

## Current state of tasks & new task assignment

* Worked on currently
    - DevOps for deployment [#176](https://github.com/Couchers-org/couchers/issues/176)
    - Move to postgres [#132](https://github.com/Couchers-org/couchers/issues/132)
    - Messaging v1.1 [#116](https://github.com/Couchers-org/couchers/issues/116)
    - Database migrations with Alembic [#190](https://github.com/Couchers-org/couchers/issues/190)

* Good first tasks:
    - Sam: Sending emails for messages, hosting requests, friend requests [#175](https://github.com/Couchers-org/couchers/issues/175)
    - Andreas?: Bug reporting form/tool [#188](https://github.com/Couchers-org/couchers/issues/188)
    - Rick: Account management [#158](https://github.com/Couchers-org/couchers/issues/158)
    - Write documentation and architecture overview [#189](https://github.com/Couchers-org/couchers/issues/189)
    - Josh: Clean up friend page [#125](https://github.com/Couchers-org/couchers/issues/125) + user component [#124](https://github.com/Couchers-org/couchers/issues/124)
    - Lucas: Lots of frontend fixes [#179](https://github.com/Couchers-org/couchers/issues/179)
    - Aapeli: Basic branding [#185](https://github.com/Couchers-org/couchers/issues/185)
    - Christian: Add cache headers to media server [#173](https://github.com/Couchers-org/couchers/issues/173)
    - Markdown input sanitisation [#153](https://github.com/Couchers-org/couchers/issues/153)
    - CloudFront access identity [#170](https://github.com/Couchers-org/couchers/issues/170)
    - Cron jobs: purging of tokens [#65](https://github.com/Couchers-org/couchers/issues/65)
    - Move media server to use S3?

* Next big tasks:
    - Aapeli or someone else?: Start thinking about location and world map, GIS
    - Lucas?: Events

* Bug tracking/grroming, deduplication, etc: Claudio is interested and has experience. Aapeli & Itsi will follow up with him.
* Claudio brought up conversation around security, PII and legal implications (GDPR, CCPA, etc) as it should be built from the foundations and closely related to the architecture. Current situation is that software security is done well (e.g. correctly hashed passwords) but legal stuff and the marriage between the two (e.g. TOS fields in DB) have not been looked at.
* Lucas proposes adding new issue labels for priorities, e.g. "p1" to "p6", probably don't need that many.
* Lucas might help Aapeli on messaging which has been lingering for a long time. Main issues are chat events and DB issues with sqlite/postgres
* Itsi: we need an easy way to report bugs in the app, Aapeli will work on it.
* Aapeli: working on alembic for database migrations
* CLA will be out in next few days: standard stuff if you've ever contributed to open source projects, gribbed from Apache foundation
