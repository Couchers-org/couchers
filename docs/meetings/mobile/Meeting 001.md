# Mobile team meeting #1

When: 15/6/21, 20:00 UTC.
Attending: Aapeli, Faisal, Kiran, Lucas, Mrinal

## Notes

* Introductions
* Overview of what Couchers is, etc
* Overview of the plan
  - 2 prototypes: React Native, and Flutter
  - Want to see how they play with our stack + volunteering structure
* Scope of prototypes (implement or discover it's a pain and why)
  - Login (just so it can be used)
    - Deeplink for magic links
  - Profile display and editing (of subset)
    - Including a markdown field
    - Including location picker (+ from gps?)
    - Including a date picker?
  - Basic map of users with cards (incl. Nominatim style search)
  - General
    - Navigation/routing/etc
    - Offline functionality (caching) of some subset of things (at least)
* Possible/known pain points
  - State management
  - gRPC (https://github.com/grpc/grpc-node/tree/master/packages/grpc-js, https://github.com/grpc/grpc-dart)
  - Maps
  - Deep linking
  - Notifications?
  - Markdown editor
* Plan going forward:
  - Faisal and Kiran will form the React Native team
    - Creating a new channel on slack for react
    - New repo
  - Aapeli will chase up Flutter people + Mrinal for another meeting about flutter stuff
