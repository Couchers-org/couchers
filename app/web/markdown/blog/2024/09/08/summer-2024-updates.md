---
title: "Summer of 2024 Updates"
slug: summer-2024-updates
description: "Catch up on news with Couchers: read about what's been going on and what's coming up this in the rest of 2024!"
date: 2024/09/08
author: Aapeli
share_image: https://couchers.org/img/blog/20241001_active_couchers_zoom.png
---

*This post was updated with a screenshot of volunteers and new member numbers on the 4th of October before the newsletter version was sent out.*

Hi all, we're excited to share with you some news on the Couchers project as well as some updates on what we're still working on and will be releasing next! It's been a while since we sent a newsletter or updated the community on what the volunteering team has been up to, so there are quite a few things to cover.

Many of you might have noticed that there was a period of inactivity on the project: but worry not, we are back! I wrote a little bit about what happened that caused the inactivity and what we've done to make sure we keep moving forward with a steady pace in the future on our [last blog post](https://couchers.org/blog/2024/06/12/where-we-are-and-where-we-are-going).

Our active volunteer group has grown a lot since that post, the following screenshot shows some of our volunteer developers in our weekly meeting. If you'd like to help out as a dev, please [join us on GitHub](https://github.com/Couchers-org/couchers).

![A screenshot of our volunteer developer meeting in late September](/img/blog/20241001_active_couchers_zoom.png)

## Public roadmap and milestones

We are launching a new [Roadmap page](https://couchers.org/roadmap) that we will keep up to date with the latest developments on what has been worked on and what the priorities are next. A lot of people asked us to communicate more clearly what the strategic and development goals of the project are, so we hope this will help you keep up to date.

We currently build around a quarter-based system of strategic *milestones*. We divide the year into calendar quarters, Q1 (Jan to Mar) to Q4 (Oct to Dec) and choose a strategic and development focus that we call a *milestone* for each quarter. This helps the various teams at Couchers align behind a common goal and have clarity on what they should be working on together. Each strategic milestone is brainstormed and chosen by the [Board of Directors](https://couchers.org/foundation) along with the [volunteer team](https://couchers.org/team) using input from the community.

Our first and current official milestone starting in this July has been a focus on *Safe and Active Community*. This means working on features that both increase safety and trust on the platform, as well as help us highlight active users. You can read more about this on the [Roadmap page](https://couchers.org/roadmap).

At the conclusion of each milestone we will send out an update to those signed up to receive the newsletter, where we will inform you about the progress made towards that milestone during the quarter and highlight the upcoming quarterly milestone and what we will be working on during it.


## Latest feature updates

This summer, we've launched a bunch of exciting feature updates:

* **A new notification infrastructure**: we've overhauled the way notifications are processed and sent on the platform. This is in preparation for mobile apps (iOS & Android), as well as web push notifications. You might have noticed the new layout of Couchers email messages that went live a few months ago, which are part of this overhaul.
* **Notification preference settings**: you can now also change your notification preferences on the account settings page, thanks to one of our new volunteer developers. A big thanks to Nicole, we're excited to have you on the team!
* **Community invites for events**: you can now invite nearby users to your event. Find it under the "Invite the Community" button on an event you created. The invite is sent after moderator approval. You can read more about this feature [on the help page](https://help.couchers.org/hc/couchersorg-help-center/articles/1720304409-how-does-the-invite-the-community-feature-work).
* **Map Search overhaul**: we've rebuilt the map search page based on user feedback, fixing a bunch of bugs in the process and preparing for more map awesomeness. We've also updated the map style in preparation for the mobile apps! Thanks to David for his hard work in rebuilding the map!
* **Strong Verification**: we are working on a new identity verification feature called "Strong Verification" that allows you to securely verify your passport information (via cryptographic signatures embedded in passports). It's currently available as a preview feature and we'll be building out the rest of the frontend implementation soon.
* **Profile badges**: we've added profile badges for donors, verified users (passport or phone), volunteers (past and present), and so on. We'll add a few more as we go, but these are a nice little addition to recognize our volunteers and supporters. If you are missing a "past volunteer" badge and would like one, please see the section at the end of this post for how to get one on your profile!
* **Travel map on profile**: we've added a map that shows the places you've visited and lived according to what you fill out, and it adds some more color to the profiles!

There are also a few less visible or less exciting updates:

* **We removed all password optionality in the backend**: there were some relics of the old password-optional regime that have been removed, and we also simplified the login form to show the username and password inputs straight away.
* **A variety of behind-the-scenes upgrades**: we've also done a lot of work that's not very visible. There was a really gnarly bug that was causing havoc for a week or so but that we managed to squash last Sunday. We've also created a bunch of reliability-related monitoring and observability infrastructure that has helped us speed up some parts of the platform that, you might notice it's a bit more snappy now (but there's more to come)! We made some upgrades to the infrastructure that helps us run the project. Finally we also built some new admin tooling that helps mods keep the platform safe, fun, and friendly with much less effort!
* **New support infrastructure**: we switched out our support platform from a very old and flaky open source platform to a much more modern open source platform called Chatwoot! We also switched from using a commercial mailing list provider to a self-hosted, open source platform that will save us a bunch of money.
* **You now "decline" requests** instead of "rejecting" them, because this sounds friendlier and Couchers is a friendly place :).


## Celebrating our community of 44k Couchers!

Couchers is continuing to grow quickly with over 44,500 registered Couchers! Getting many more couch surfers to join our community and getting them onto the platform is one of our most important goals at the moment.

You can help us with this goal by spreading the word online and at events, as well as continuing to use the platform, provide feedback, and help us grow!


## Our long-term strategic goal: the safest couch surfing platform

For a long time our marketing has centered around being "like CouchSurfing™, but better". While this is still the core vision and has resonated strongly with current and former CouchSurfing™ users, we believe we need to explain what sets us apart from CouchSurfing™ and other platforms, and also better appeal to fist-time couch surfers.

We believe a core value of couch surfing, and what enables the whole activity, is the trust and safety we have in other humans. This is also (by no coincidence) the biggest inhibitor of outsiders joining our community. Through our many past, current, and future efforts, we believe Couchers can effectively position ourselves to be the **safest couch surfing platform** out there. By focusing our efforts around this goal, we think we can best serve both current and future couch surfers looking for the most safe platform for couch surfing.

We have always believed that in building this community, it's important that we set clear expectations for the community, such as via our Community Guidelines. By taking an opinionated stance on these issues and keeping up a system of careful moderation, we believe we can create the safest, healthiest, and most trustworthy couch surfing community.


## Changes to our Board of Directors

Couchers.org is operated by Couchers, Inc., a 501(c)(3) non-profit organization run entirely by volunteers. As part of future-proofing the project, we have invited some new people onto our Board of Directors. The current Board Members are the Founders Aapeli ([@aapeli](https://couchers.org/user/aapeli)) and Itsi ([@itsi](https://couchers.org/user/itsi)), as well as at-large Board Members Emily ([@emily](https://couchers.org/user/emily)), Yannic ([@spreeni](https://couchers.org/user/spreeni)), Natalia ([@natalia](https://couchers.org/user/natalia)), Paul ([@paul](https://couchers.org/user/paul)), and Jesse ([@jesse](https://couchers.org/user/jesse)). These folks have all been involved with the project for a long time and the outgoing board is firm in their belief as good custodians of the project with the right values, spirit, and vision for our community.

You can read more about these wonderful community members and other minor governance changes on the [blog post announcing the changes](https://couchers.org/blog/2024/04/30/new-board-members).


## Past volunteers: get a badge on your profile!

Couchers has been built by an incredible army of volunteers, to whom our whole community is incredibly grateful for. We want to recognize and celebrate the invaluable contributions every past developer has made to the project.

If you have volunteered for Couchers.org and would like to be recognized for it on your profile, please fill in the following form and we'll add one to your profile:

[Past Volunteer form](https://forms.gle/UYdBHn8S1tCNiVgNA)


## Support Couchers: volunteer or donate!

The Couchers.org platform and community is built by a team of volunteers in their spare time, organized around a non-profit. All our work is open source and community lead. You too can support the project.

We are currently raising money for development tools to build mobile apps for Android and iOS. This endeavour costs money, so we are looking for some extra financial support from the community. We are also hoping to produce some merchandise (Couchers t-shirts & hoodies, stickers, and of course decorative couch pillow covers, etc), which has some upfront costs.

[Donate to Couchers](https://couchers.org/donate)


### Volunteer

We are looking for motivated and self-driven volunteers to help build out the community or develop the platform. Our recruiting resources are currently quite limited, so we are looking for people who are able to join the project and take charge of individual projects or initiatives.

In particular, we are currently looking for the volunteers with the following skills:

* Mobile app software engineers: we are building the mobile app in React Native (expo), and are looking for some folks to help with that undertaking
* Backend software engineers: with Python experience (also SQL Alchemy, Postgres/PostGIS, protobuf/grpc)
* Frontend software engineers: with React experience (also TypeScript, Material UI, React Query, etc)

_Written by [Aapeli](/user/aapeli). Published on 2024/09/08_

**Want to help write our blog or volunteer? [Sign up](/volunteer) and let us know. Volunteers and [donations](/donate) are what make Couchers.org possible!**
