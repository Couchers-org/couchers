# Backend team meeting #24

When: 26/5/21, 20:00 UTC.
Attending: Aapeli, Christian, Lennart, Lucas, Sam

## Notes

* New dev joining
* Hit 1k users on beta
* New next.couchershq.org
* Christian:
  - any questions/comments/things to discuss about phone verification?
  - doing it in the bg instead of blocking for user?
  - rate limits on failures: assume good faith and panic when that fails...
* Aapeli: hacky host requests email notifications, and other stuff
* Lennart: prometheus, metrics, etc
  - Aapeli: cool thing would be to do postgres query histograms/monitoring, but Lennart says it's enough to do per-request timings
  - can we get stats from nginx and/or the frontend?
* Lennart will be freed from his worldly constraints soon and will spend a lot of time on Couchers: wooo!
  - Hoping to get done in first two weeks of June:
  - Prometheus, Sentry, some good first issues
  - Later on maybe notification infrastructure
* Sam: busy with a bunch of non-Couchers things, will pick up where he left off if he has time
* Chit chat about a bunch of things
