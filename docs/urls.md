# URL plan

This file specifies the URL format of various resources within
couchers. It is recommended that frontends use these URLs whenever a
resource is shared outside the frontend. The slug is the part after
the ID number and it should be ignored when parsing the URL.

This file also describes URLs included in all emails that is sent by
the couchers server. For more information, see discussion in
https://github.com/Couchers-org/couchers/issues/501 .

## Core features

### Messaging/requests

* Messages overview: `/messages`
* All group chats: `/messages/chats`
* Group chat: `/messages/chats/{group chat id}`
* All surfing requests (i.e. requests sent by us): `/messages/surfing`
* All hosting requests (i.e. requests received by us): `/messages/hosting`
* Request (surfing or hosting): `/messages/request/{host request id}`

## Sydney example for community features

Title: Sydney
Explanation: Page for the Sydney Community
URL: https://couchers.org/community/14362/sydney-nsw-australia
Navigation: Australia > NSW > Sydney

Title: Sydney Opera House
Explanation: A "place"/"point of interest" page
URL: https://couchers.org/place/39293/sydney-opera-house-australia
Navigation: Australia > NSW > Sydney > Sydney Opera House

Title: Best Food in Sydney
Explanation: A guide to food in Sydney
URL: https://couchers.org/guide/72833/best-food-in-sydney
Navigation: Australia > NSW > Sydney > Best Food in Sydney

Title: Sydney Art Tour
Explanation: An event for an art tour around Sydney
URL: https://couchers.org/event/31312/sydney-art-tour
Navigation: Australia > NSW > Sydney > Sydney Art Tour

Title: Best Views in Sydney for NYE fireworks?
Explanation: A reddit-style dicussion page about best place to view fireworks
URL: https://couchers.org/discussion/85548/best-views-in-sydney-for-nye-fireworks
Navigation: Australia > NSW > Sydney > Best Views in Sydney for NYE fireworks?

Title: East Coast Hitchhikers
Explanation: A hitchhiking-focussed subgroup of the Australia community
URL: https://couchers.org/group/18421/east-coast-hitchhikers-australia
Navigation: Australia > East Coast Hitchhikers

## Other resources

Title: User's profile
URL: https://couchers.org/user/denvercoder9
