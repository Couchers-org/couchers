---
title: "Couchers.org Fall Release: What's New in v1.1?"
slug: couchers-fall-release
description: "We've released a number of new features, and fixed many bugs. We discuss more of what's next. We also moved to roughly a quarterly release schedule, which helps us keep on track better with smaller releases."
date: 2025/10/28
author: Nicole
author_username: unsettleddown
---

*Quick summary: we've released a number of new features, and fixed many bugs. We discuss more of what's next. We also moved to roughly a quarterly release schedule, which helps us keep on track better with smaller releases.*

## Big picture stuff

*Section written by [Aapeli](https://couchers.org/user/aapeli).*

In the [v1 release](/blog/2025/07/01/releasing-couchers-v1), we announced our new strategy around aiming to be the safest, healthiest, and most active couch surfing community. In order to achieve this, we've spent a lot of time in the last four months making sure the core hosting and surfing features (like finding hosts, leaving references) are really nailed down. We also started the CouchOps (Couchers Operations) team that, and since the v1 release, have put a lot of effort into getting the non-engineering part of the Couchers project into a healthy state. We recruited a bunch of great new volunteers to help us out on CouchOps. They've lead projects like translating the platform to many new languages, which helps us reach more people and bring them into the couch surfing community.

Our primary long-term priority right now is improving the core couch surfing experience through what we call *platform dynamics*.

This means making it easier for surfers to find great hosts, and making it easier for great hosts to get the kinds of requests they'd like. We've spent a lot of time behind the scenes on better understanding our user base by conducting in-depth data analysis and creating dashboards and metrics that track key parts of the host request flow. For example, what proportion of requests receive responses in a timely manner. We think this data-driven approach will help us improve the platform, and we have already made some small changes due to this like changing the order that users are shown in search results.

Our other major long-term goal is launching the mobile app. We've already made some progress towards this goal and hope to share more concrete updates by the next release!

## New Features in the Fall Release (v1.1)

### Same gender only filter for strong verified users

We've implemented a filter that enables users to view only profiles matching their own gender after completing the **free** strong verification process. This has been a popular request, and we're excited to make it available! This has been requested by several users so we're happy to offer it now! Built by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6955](https://github.com/Couchers-org/couchers/pull/6955)].

<p align="center">
<img src="/img/blog/20251028_show_same_gender_only.png" alt="Screenshot of the same gender only toggle" />
</p>

### Map Search

* We now add a cute chick emoji when users have no references by [Itsi](https://couchers.org/user/itsi), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6371](https://github.com/Couchers-org/couchers/pull/6371)]
* We improved the map style and made other fixes by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Jesse](https://couchers.org/user/jesse) [[#6492](https://github.com/Couchers-org/couchers/pull/6492)]

### Host Request and Reference Flow Improvements

We were receiving a lot of bug tickets from users who were confused by the reference flow, so we did a full iteration on it. We added some improvements:

* Require reference scale rating and make scale empty by default by [Felix](https://couchers.org/user/nepo36), with assistance from [Jesse](https://couchers.org/user/jesse) and [Nicole](https://couchers.org/user/unsettleddown) [[#6569](https://github.com/Couchers-org/couchers/pull/6569)]
* Add clearer error messages for references past 14 days, already written references, that you need to be friends to write friend references, etc; differentiate on site better between friend and host references; add pending host references to that user's reference tab page; remove 0 on the reference tab for people with 0 references by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli), [Felix](https://couchers.org/user/nepo36) and [Jesse](https://couchers.org/user/jesse) [[#6814](https://github.com/Couchers-org/couchers/pull/6814)]
* Improved rating slider color interpolation by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Jesse](https://couchers.org/user/jesse) [[#6577](https://github.com/Couchers-org/couchers/pull/6577)]
* Implemented backend functionality to add location where hosting happens by [Andrei](https://couchers.org/user/andrei_k), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6379](https://github.com/Couchers-org/couchers/pull/6379)]
* Added a quick decline option in emails by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6326](https://github.com/Couchers-org/couchers/pull/6326), [#6556](https://github.com/Couchers-org/couchers/pull/6556)]
* Add required characters remaining in host request by [Nicole](https://couchers.org/user/unsettleddown) [[#6729](https://github.com/Couchers-org/couchers/pull/6729)]

### Events

We implemented a bunch of updates to the on-platform events functionality.

* Allow users to add/remove event co-organizers by [Felix](https://couchers.org/user/nepo36) and [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6593](https://github.com/Couchers-org/couchers/pull/6593), [#6599](https://github.com/Couchers-org/couchers/pull/6599)]

<p align="center">
<img src="/img/blog/20251028_event_coorganizer.png" alt="Screenshot showing how to make an attendee an event co-organizer" />
</p>

* Fixed stretched community event image issue by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6595](https://github.com/Couchers-org/couchers/pull/6595)]
* Add comment count in Discover and Your Events tiles by [Dieu](https://couchers.org/user/dieu), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6937](https://github.com/Couchers-org/couchers/pull/6937)]
* Add functionality to turn community events/discussions off by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Andrei](https://couchers.org/user/andrei_k) [[#6477](https://github.com/Couchers-org/couchers/pull/6477)]
* Add emails for upcoming event reminder by [Andrei](https://couchers.org/user/andrei_k), with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#6236](https://github.com/Couchers-org/couchers/pull/6236)]

### Invite friends feature

We added an "Invite friends" feature to the main dropdown menu. You can now get a personalized link to invite friends to Couchers and see how many people signed up via the link by [Andrei](https://couchers.org/user/andrei_k) and [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6526](https://github.com/Couchers-org/couchers/pull/6526), [#6767](https://github.com/Couchers-org/couchers/pull/6767)]!

<p align="center">
<img src="/img/blog/20251028_invite_members.png" alt="Screenshot showing the invite feature" />
</p>

### Host-Surfer Connection Improvements

**Activeness probes**: Added a feature that emails users if they haven't signed in for a long time checking if they still want to host. If they don't log in after that, we automatically change their status to "may host". We hope this helps surfers more easily find active hosts by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Itsi](https://couchers.org/user/itsi) [[#6369](https://github.com/Couchers-org/couchers/pull/6369), [#6412](https://github.com/Couchers-org/couchers/pull/6412), [#6478](https://github.com/Couchers-org/couchers/pull/6478)].

**Map search results ranking**: Adjusted the ranking of search results for the map search. We realized new users were often showing low in search results and seasoned hosts were complaining of too many requests. We adjusted map search results to show a mix of new and seasoned users by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Itsi](https://couchers.org/user/itsi) and [Nicole](https://couchers.org/user/unsettleddown) [[#6557](https://github.com/Couchers-org/couchers/pull/6557)].

**Hide users with empty profiles or those that can't host by default** by [Itsi](https://couchers.org/user/itsi), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6359](https://github.com/Couchers-org/couchers/pull/6359)].

<p align="center">
<img src="/img/blog/20251028_filter_empty_profile.png" alt="Screenshot showing the search bar with a message that empty profiles have been hidden by default" />
</p>

Adjust order and color of host request response buttons by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Felix](https://couchers.org/user/nepo36) [[#6913](https://github.com/Couchers-org/couchers/pull/6913)].

### Total Redesign of Edit Profile Page

We redesigned the Edit Profile Page as it was not very user friendly and didn't highlight the most important aspects of the page. We added more guidance for users about what sections show in map search, made the hosting status more prominent and grouped the sections more intuitively:

* Redesign the edit profile page by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Jesse](https://couchers.org/user/jesse) [[#6494](https://github.com/Couchers-org/couchers/pull/6494)]
* Web/UI changes edit profile by [Dieu](https://couchers.org/user/dieu), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6852](https://github.com/Couchers-org/couchers/pull/6852)]

<p align="center">
<img src="/img/blog/20251028_editprofile_redesign_1.png" alt="Screenshot showing hosting and meetup preference editing" />
</p>

<p align="center">
<img src="/img/blog/20251028_editprofile_redesign_2.png" alt="Screenshot showing the top of the profile editing page" />
</p>

### "What is Couch Surfing" Page

We recognize that there's a whole new generation of couch surfers now so we wanted to provide some information about the concept and history for newbies. [Find that page here](https://couchers.org/what-is-couch-surfing) by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aditi](https://couchers.org/user/adititrips) and [Aapeli](https://couchers.org/user/aapeli) [[#6638](https://github.com/Couchers-org/couchers/pull/6638)].

### Moderation and Safety

We implemented a range of new moderation and safety-related features, many of which operate on the backend and are used by our moderators.

* Rework report reasons by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#6235](https://github.com/Couchers-org/couchers/pull/6235)]
* Update sleeping arrangement meanings by [Colleen](https://couchers.org/user/colleen), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Jesse](https://couchers.org/user/jesse) [[#6093](https://github.com/Couchers-org/couchers/pull/6093)]
* Implement warning emails and limits by [Yannic](https://couchers.org/user/spreeni), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6023](https://github.com/Couchers-org/couchers/pull/6023)]
* Add duplicate accounts moderation feature by [Pablo](https://couchers.org/user/pcolt86), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#5967](https://github.com/Couchers-org/couchers/pull/5967)]

### Miscellaneous Changes

* Start work on mobile app by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6880](https://github.com/Couchers-org/couchers/pull/6880)]
* Update social share image by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6280](https://github.com/Couchers-org/couchers/pull/6280)]
* Add "expand all" to notification settings by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Jesse](https://couchers.org/user/jesse) [[#6508](https://github.com/Couchers-org/couchers/pull/6508)]
* New volunteer team page by [Aapeli](https://couchers.org/user/aapeli) and [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Chris](https://couchers.org/user/chrisk) [[#6539](https://github.com/Couchers-org/couchers/pull/6539), [#6545](https://github.com/Couchers-org/couchers/pull/6545), [#6553](https://github.com/Couchers-org/couchers/pull/6553), [#6641](https://github.com/Couchers-org/couchers/pull/6641)]
* Restrict ellipsis menu item types by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6644](https://github.com/Couchers-org/couchers/pull/6644)]
* Redirect authenticated users from index to dashboard by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6643](https://github.com/Couchers-org/couchers/pull/6643)]
* Increase proxy buffer size to fix map by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6601](https://github.com/Couchers-org/couchers/pull/6601), [#6555](https://github.com/Couchers-org/couchers/pull/6555)]
* Fix docker services not working on Apple silicon by [Felix](https://couchers.org/user/nepo36), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6598](https://github.com/Couchers-org/couchers/pull/6598)]
* Request donation after strong verification by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6564](https://github.com/Couchers-org/couchers/pull/6564)]
* Add newsletter signup link to footer by [Nicole](https://couchers.org/user/unsettleddown) [[#6766](https://github.com/Couchers-org/couchers/pull/6766)]
* Reminders backend by [Aapeli](https://couchers.org/user/aapeli) [[#6537](https://github.com/Couchers-org/couchers/pull/6537)]

### Bug Fixes

Thanks to [Vas](https://couchers.org/user/vas_traveler), who did a ton of QA testing and scoured all our sites for bugs! We caught a lot of bugs and pushed fixes thanks to him.

* Fix Brisbane (Australia) missing from map search bug and add extended tests by [Nicole](https://couchers.org/user/unsettleddown) [[#6721](https://github.com/Couchers-org/couchers/pull/6721)]
* Fix unread notification filter by [Nicole](https://couchers.org/user/unsettleddown) [[#6932](https://github.com/Couchers-org/couchers/pull/6932)]
* Fix many bugs and missing translations by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Felix](https://couchers.org/user/nepo36), [Jesse](https://couchers.org/user/jesse), [Aapeli](https://couchers.org/user/aapeli) and [Chris](https://couchers.org/user/chrisk) [[#6625](https://github.com/Couchers-org/couchers/pull/6625), [#6745](https://github.com/Couchers-org/couchers/pull/6745), [#6939](https://github.com/Couchers-org/couchers/pull/6939), [#6949](https://github.com/Couchers-org/couchers/pull/6949), [#6950](https://github.com/Couchers-org/couchers/pull/6950), [#6956](https://github.com/Couchers-org/couchers/pull/6956), [#6968](https://github.com/Couchers-org/couchers/pull/6968), [#6970](https://github.com/Couchers-org/couchers/pull/6970), [#6981](https://github.com/Couchers-org/couchers/pull/6981)]
* Clean up landing page after initial v1 release by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6393](https://github.com/Couchers-org/couchers/pull/6393)]

### Tech Debt

* Upgrade Material UI to latest version by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Felix](https://couchers.org/user/nepo36) [[#6685](https://github.com/Couchers-org/couchers/pull/6685)]
* Adjust `test_migrations` for new postgres release by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Andrei](https://couchers.org/user/andrei_k) [[#6684](https://github.com/Couchers-org/couchers/pull/6684)]
* Fix build warnings and improve build time by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6890](https://github.com/Couchers-org/couchers/pull/6890)]
* Upgrade Sentry by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6723](https://github.com/Couchers-org/couchers/pull/6723)]
* Upgrade `react-query` by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Felix](https://couchers.org/user/nepo36) [[#6543](https://github.com/Couchers-org/couchers/pull/6543)]
* Remove NextLink legacyBehavior by [Nicole](https://couchers.org/user/unsettleddown) [[#6525](https://github.com/Couchers-org/couchers/pull/6525)]

## CouchOps Team Updates

The CouchOps team is responsible for the non-engineering operations side of Couchers.

### Translations

We've done a big push in the area of translations to make Couchers more accessible to users that don't speak English.

Shoutout to our Translation Manager [Chris](https://couchers.org/user/chrisk) who completed our German translations, our Russian Language Lead [Vas](https://couchers.org/user/vas_traveler) who completed our Russian translations and our Language Leads [Dale](https://couchers.org/user/oskyldig) (French), [Marc](https://couchers.org/user/markusand) (Catalan), [Hakan](https://couchers.org/user/thelosttraveler) (Turkish) and [Henriëtte](https://couchers.org/user/henriettesays) (Dutch) who contributed significantly to these languages over the last quarter. A big thank you to our numerous other translators that did translation or submitted suggestions in various languages.

We also introduced some new translation features and structure.

* Now languages with less than 50% translations are filtered out from the language picker and those with less than 80% are greyed out by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Chris](https://couchers.org/user/chrisk) [[#6971](https://github.com/Couchers-org/couchers/pull/6971)]

<p align="center">
<img src="/img/blog/20251028_language_picker.png" alt="Screenshot showing the new language picker" />
</p>

* We added a translation progress page where you can keep track of our progress in various languages.

<p align="center">
<img src="/img/blog/20251028_translation_progress_page.png" alt="Screenshot showing the translation progress page" />
</p>

Shoutout to [Chris](https://couchers.org/user/chrisk) for the idea of translation benchmarks and [Nicole](https://couchers.org/user/unsettleddown) for making the translation progress page. [Find it here.](https://couchers.org/translate)

Don't see your language? [Join our team of Couchers translations and contribute some translations!](https://couchers.org/volunteer/translator)

### Proofreading and updating the Couchers website pages

We did some updating of our website pages to make sure they're up to date. This was mostly driven by [Aditi](https://couchers.org/user/adititrips) and implemented by [Nicole](https://couchers.org/user/unsettleddown) with some additional checking by [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#6725](https://github.com/Couchers-org/couchers/pull/6725), [#6749](https://github.com/Couchers-org/couchers/pull/6749), [#6912](https://github.com/Couchers-org/couchers/pull/6912), [#6915](https://github.com/Couchers-org/couchers/pull/6915)].

[Chris](https://couchers.org/user/chrisk) has done a phenomenal job keeping the roadmap page up to date with what the dev team is doing.

### Miscellaneous

[Aditi](https://couchers.org/user/adititrips) has organized our operations boards and is working to improve our volunteer onboarding process. Alongside making internal systems run smoother, she continues to rework UX functionality for future feature ideas, develop marketing materials, and dive into growth metrics to align our overall strategy going forward!

## Updates on Volunteering at Couchers

With a couple of our major contributors becoming more busy due to life changes and new jobs, we really could use more support!

To support a volunteer recruitment push next quarter, our volunteer [Cameron](https://couchers.org/user/camtastic) recently totally re-did our volunteer application flow to make it more streamlined and gather the information we actually need to know from potential volunteers.

Want to help us make Couchers thrive? We especially need:

* A **Senior Backend Python Developer** who is able to do bigger feature work and help review PRs
* **Mid and Senior Frontend Developers** with familiarity with Typescript and React
* **Blog Writers**: we currently have our developers writing our blog posts (please save us).
* **UI/UX Designers**: Help us create Figma designs for new features we have in the works!
* **Community Builders**: Help us get a Couchers community thriving in your city!

[Interested? Apply here!](/volunteer/form)

