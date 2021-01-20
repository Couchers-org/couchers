# Backend team meeting #15

When: 20/1/21, 22:00 UTC
Attending: Aapeli, Christian, Itsi, Lucas, Sam, Yannic

## Notes

* Introduce Yannic
* Aapeli's been working a bit on communities and groups, and also a lot on non-dev stuff with Itsi and others
* Beta:
  - the idea is to bundle a bunch of pretty things together to make a nice "press release", newsletter, etc
  - main features: communities, react migration (frontend), branding, and a few other bits
  - trying to get out beta in mid-March so we have plenty of time to fix bugs and polish the interface, build a community and userbase, and add a few other features by v1.0
  - aiming for v1.0 by mid-May when lifetime users will start getting kicked off another platform
* Vue (alpha) sunset:
  - code will inevitably go out of date as APIs start being modified for new features exclusively built on react
  - Idea: move alpha to `legacy` branch, and only backport any needed fixes
  - Move API endpoint to `legacy-api.couchers.org` so CI/CD will point to new stuff, etc
  - We'll do development on `develop`, deployed to `beta.couchers.org` (or similar), using API at `api.couchers.org`
  - Not public until switch over on beta release
* Lucas: when will the message merge happen (having messages and host requests separately is confusing, etc). Aapeli suggests we wait to refactor after beta is out as messaging will require a bunch of other stuff too
* Sam: message muting: if we implement dumb email message notifications (before smart push-notifications), chats need to be mutable

What are people working on:
* Christian: finishing threads (Aapeli will review over weekend), then undo models.py split (makes current `develop`/`communities`), maybe help with writing tests for communities
* Yannic: is busy for a few weeks
* Sam: working on tweaking models (and associated APIs, servicers, and tests) to match up to new designs
* Aapeli: review some PRs, then keep working on communities

* Meeting will be moved to start an hour early to accomodate the majority who are in Europe
