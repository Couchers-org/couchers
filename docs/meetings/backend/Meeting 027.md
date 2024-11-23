# Backend team meeting #27

When: 7/7/21, 20:00 UTC.
Attending: Aapeli, Christian, Lucas, Sam

## Notes

* 2.1k users!
* Sam has been doing MVP refactoring for SQLAlchemy 2
* Christian is on vacation
* Aapeli made a pypi package: we'll change it to use API keys
* Lucas merged signup v2 frontend bit, Aapeli will fix the backend bug if there's another one
* Lucas: messaging/chats refactoring
* API compatibility: try to maintain it for now, and soon release v1 (after refactors)
* isort issue: Aapeli has issues with 5.9.x, he'll just use 5.8.x for now
* pypi package import stuff: it's okay to keep it as `import couchers` though this means you can't install it in backend venv
* proto backward compatibility stuff, etc
* image upload for communities: create a new page for that and load images only from our domains
