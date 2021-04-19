# Backend team meeting #21

When: 14/4/21, 20:00 UTC.
Attending: Aapeli, Ben, Christian, Omer, Sam, Yannic

## Notes

* Beta launched, congrats everybody, good work!
* Migrations should be "immutable" once merged into develop
* Users blocking other users:
    - Either using 2 queries: get list of hidden users
    - Or using 1 hectic query: do a double/quad join on blocked users table, etc
    - Aapeli: wants to table it for now and attack it later, not worth the added complexity in code (lots of extra boilerplate in many places), and added performance hit of multiple queries/joins, etc
    - Sam: wants to do it given he's already going through every query
    - If done, it should be done with some nice SQLAlchemy magic like `.filter(User.visible_for(context.user_id))` or even `.filter(User.visible(context))`, which either does a query or a subquery
* What everyone's working on:
    - Ben: returning image URLs that contain generic size param (#871)
    - Christian: testing to make sure migrations/models coincide (#885), then Slack Aapeli
    - Omer: lat/lng to timezone (#795)
    - Sam: user hiding (#610)/blocking (#414), a few other things
    - Yannic: coordinate wrapping (#835)
* Introductions at the end :P
