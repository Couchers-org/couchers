# Backend team meeting #2

Attending: Aapeli, Caleb, Christian, Itsi, Wouter

## Main discussion points:

* Roadmap
* Deployment and CI/CD

## Summary of last two weeks

* Great work on setting up testing and some other structure by Christian + being diligent on coding style
* Thanks to Lucas for writing a great PR (with tests!) and thoughtful code reviews
* Dev setup is now ready and there are some docs on how to work with stuff
* Done: Friends (ugly UI, more robust backend)
* Done: Search v1 (relatively crude but decent UI)

## Discussion

* Discussed past two weeks and structure
* Caleb going to estimate cloud costs to convince community this is feasible
* Updates on frontend & community teams
* Important to search for new devs now: open source model of dev (everyone working on small features that get merged into develop, etc) rather than some very heavily centralised/bureaucratic system
* Caleb will look into CI/CD and deployment using AWS + CircleCI free tier (or similar)
* AWS account for Caleb
* Migrations: Caleb and Wouter think it won't be that hard, all agree that once automated into CD pipeline, this will be a huge asset and ease dev. Alternatively have some seed data and nuke + recreate in dev, only a few migration points for live data that require more scrutiny.
* GIS: OSM data? PostGIS?

### Roadmap

* Authentication
* Profiles
* Friends
* Search v1 (by name/text fields)

7/Jul: today

* References
* Messaging
* Reporting
* Moderation v1 (alert to admins)

21/Jul: halfway to alpha

* Hosting/Surfing
* Host preferences (calendar, accepting guests, guest preferences)
* User media (photos)

4/Aug: first "public" alpha

3 months out: try to get through [full list](https://github.com/Couchers-org/couchers/blob/fb78deb7594ffa52a8ee5dfe83f56c7fa58063f2/docs/features.md).

Also work with graphics team on incorporating their logos, designs, etc.
