# Backend team meeting #16

When: 3/2/21, 21:00 UTC
Attending: Aapeli, Christian, Lucas, Sam

## Notes

* Talk about PRs
* Background jobs
  - api/worker/servicers instead of "fg/bg"
  - Launch processes through python or bash?
* Slugify in postgres
  - Needed when getting stuff straight out of postgres, in particular in ST_AsMVT, and similar which automatically generate tiles for map
  - Christian doesn't like the versioning (in particular having multiple versions in codebase)
* Sam is doing okay, busy on stuff but will get
* Christian will work on PR reveiws and then enum.auto
* Lucas asks about threads, whetehr they're ready and how to use them
  - Ready but there's no way to create them for places/guides/events/communities/groups/etc
  - How to do that? We could create it automatically for each object, but a lot of objects probably won't have any discussion
  - Easier to create on-demand, but causes "race condition" where two users load without comments, then attempt to create first comment
  - One way: get rid of thread IDs and instead add comments/replies on the respective pages instead
  - Allows also hiding thread ID from non-backend stuff
