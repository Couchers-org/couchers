# Backend team meeting #10

When: 11/11/20, 22:00 UTC
Attending: Aapeli, Christian, Claudio, Darren, Itsi, Lucas, Marco, Tina

## Notes

* Location
    1. Should it be mandatory: yes, you can always fuzz it/set it to a nearby city, whatever
    2. How to store half signups and how to get current alpha users to add their location
    - Jail concept: review PR idea & discuss on Slack/GH
* Local communities
    - Background and explanation by Itsi
    - Tina proposes everything to be a simple structure of wikis and communities, some are official (part of the official hierarchy), some are not
    - Game plan:
        - Set up a public slack channel
        - Timeline
        - Agree mental model
        - Database model
        - etc
* Lucas: should remember to implement actual lookup/search by location once user location is implemented
* Darren: frontend needs more people
* Marco: uint64s coming out weird from protobufs
* Lucas: messages and host requests unified/different screens?
* Darren: default protobuf library is java-esque and tedious, protobuf.js?
* Aapeli: is fixing CI/CD again after circle-ci mess
* Christian: fighting with postgres
