# Backend team meeting #34

When: 13/10/21, 20:00 UTC.
Attending: Aapeli, Christian, Graham, Pedro, Sam, Sander

## Notes

* Introductions
* Discussion about gRPC TLS PR
  - We'll just wait for now until gRPC updates their roots
* Magic link login
  - Getting rid of it because it's complicated
  - Want to make it a backup if you forgot password/got it wrong
* Aapeli did a session on Saturday for new devs to join Zoom and get help setting up a dev env, but no one turned up!
* Christian had issues getting `black` and `isort` to run
  - It's because the `.gitignore`s aren't in the generated dockerfile where it's being run
  - He'll try to set it up as a separate step in Gitlab CI/CD to run on the full checked out git repo
* Language lists
  - We discussed this a lot
  - Conclusions:
    * we're trying to keep it as simple as possible
    * want to allow users to express themselves
  - Will close the Low German issue since that's just the form in which we do dialects
  - Will rename "Chinese (Yue)" to "Chinese (Cantonese/Yue)"
  - If someone knowledgeable is interested in coming in and doing research on how different language groups/dialects work and how to improve out list for those, that'd be great and we'd be happy to tweak the list
* Getting new devs set up with good first issues
  - Graham comments that the issues could be worded better to make it more explicit what exactly has to be done
  - We went through each one and discussed briefly
  - Assigned one to each new dev
