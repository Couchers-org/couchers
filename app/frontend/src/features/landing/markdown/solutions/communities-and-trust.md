---
title: Community-first Framework and Improved Verification
subtitle: "Our plan to fix the problem of [Neglected communities](/issues/communities-and-trust)"
crumb: Community-first framework
url: solutions/communities-and-trust
---

<span class="tag is-success is-large">Governance</span>

## Focusing on communities

In the couch surfing world, we have the global community and many local communities that have sprung up. **The aim of a platform for couch surfers ought to be to foster the very act of couch surfing by serving and growing the global community while creating and enlarging local communities.** Our hope is to facilitate more people joining and sharing the value of non-transactional experiences globally, and more people connecting and feeling like they belong to their local communities. These communities grow out of many purposes, some are formed based on where we live, others by where we travel, and even more communities form as we stay in touch after returning home.

**The first step in this process is opening communication channels with the global community, and committing to keeping them open.** That involves directly allowing the public to put forward their ideas and steer the decision making process. It also involves going through and studying the countless articles and forum posts that have already been written by members Couchsurfing&#8482; and other services, incorporating their complaints and ideas into a combined solution.

We aim to incorporate the community into the structure of this platform through its governance structure.

## Improving trust

Communities are built on trust between people, especially in the setting of couch surfing. Our trust model is based on two important measures: Community Verification and Community Standing. Community Standing tells other users whether they found you safe to be around and felt that you positively contribute to the couch surfing community. [You can read about Community Standing here](/solutions/reviews). Verification tells users whether they can trust that a user is who they claim to be.

**We strongly believe in user privacy, and so we designed a verification system that does not require you to provide us with your personal information.** Instead, you will require other members of the community to verify you. Our model is in contrast to the current Verification model on Couchsurfing&#8482;, which is broken and cannot really give people full faith that a user really is who they claim to be.

### The verification method

As a new, unverified member, you will have the opportunity to meet other members through the platform. Many users will not agree to let you host them or won't surf with you, but it will be easy enough to meet other members through hangouts and events. When you then meet another member of the community, you may explain to them that you are a new member, and if they agree to verify you, you may show them a form of ID. That member will scan a QR code from your app which brings up a few questions on their phone. You show your government photo ID to the user who will verify that the photo and basic details are correct, then indicate on the app what form of ID, and record the last few digits of your ID number<sup>[1](#fn1)</sup>.

Having a community member verify your account will add some percentage to your verification score, and you can repeat this a couple more times with different members. Your score will increase more if

- The verification score of the member verifying you is higher
- The ID you've presented is different than another one you've presented before
- The member verifying you is from a different location and does not know the people that have verified you before
- The ID is more difficult to forge (e.g. a passport with security features versus a driver's license)

**After verifying with three or more well-trusted people that are not connected with each other, you will be "fully verified".** For example, if you're surfing for the first time, you might head to a hangout in your home town before going on your trip, where you can go to another when you arrive, giving you a fair amount of verification to start surfing.

This not only allows the community to have a real, working verification system that gives them a high degree of trust that verified users are who they claim to be; but it also encourages new users to meet members of the couch surfing community that are in good standing, allowing new users to learn more about the community.

### Rationale

Users should be able to trust that other users are who they say they are. This is important because it prevents spam accounts and from from creating more than one account. If users are banned or even just earn low enough Community Standing scores from making others feel unsafe, then we don't want them to be able to make new accounts.

Couchsurfing&#8482; smashed together their verification and payment methods in a way that disincentivized real verification and undermined trust in the community. By re-separating verification and stressing its importance, it will be utilized as an important element of trust in our platform.

**Having members verify each other in-person means we can keep information offline and away from paid third-party services** (apart from a few digits that differentiate between your different IDs for future reference). Preferring separate IDs makes it easier for real people to be verified faster while making it harder for the few people with fake IDs.

The verification system will be based on a graph algorithm that ranks the amount of "connectedness" users have to the rest of the verified community, allowing us to weed out obvious cliques of fraudulent accounts verifying each other, and other fakes. This is simplified by the cross-pollinating nature of the couch surfing community, where users travel frequently between different local communities. We can therefore anchor different communities together based on the cross-verifications of their users and the amount of interaction between them. An account that is verified by well-trusted people from different places is much more likely to be a real person, and we can trace their verification chain back to a central verified hub of known real users.

<a name="fn1">1</a>: This allows us to check whether the ID has been verified before, giving users a higher score if they verify with different members using different photo IDs. It also stops users to some degree from creating multiple accounts with different IDs.
