# Backend team meeting #17

When: 17/2/21, 21:00 UTC
Attending: Aapeli, Christian, Lucas, Sam

## Notes

* Chat about PRs
* Background jobs: should not rely on scheduler for correctness (they should be idempotent, etc)
* Emails: don't send out too many, and people need a way to opt out
* Operating systems: people are having issues with Windows
* Models vs migrations, speeding up CI
* Christian is looking into models/migrations pains in tests
* Lucas, priorities from frontend:
  - Search
  - Events
  - Invitations
  - Blocking
  - References
* Refactoring stuff (not urgent currently)
  - Standardizing API, more resource oriented?
  - SQLAlchemy relationships
