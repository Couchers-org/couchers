---
title: "Couchers.org Fall Release ― What's New?"
slug: couchers-fall-release
description: "We've released a number of new features, and fixed many bugs. We discuss more of what's next below. We also moved to roughly a quarterly release schedule, which helps us keep on track better with smaller releases."
date: 2025/10/28
author: Nicole
---

*Quick summary: we've released a number of new features, and fixed many bugs. We discuss more of what's next below. We also moved to roughly a quarterly release schedule, which helps us keep on track better with smaller releases.*


## New Features for Fall Release

### Same gender only filter for strong verified users

* Added a filter that allows you to filter results by only your own gender if you have completed strong verification (it's free). This has been requested by several users so we're happy to offer it now! By [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6955](https://github.com/Couchers-org/couchers/pull/6955)]

![Screenshot of the same gender only toggle](/img/blog/20251028_show_same_gender_only.png)


### Map Search

* Add chick emoji for no references by [Itsi](https://couchers.org/user/itsi), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6371](https://github.com/Couchers-org/couchers/pull/6371)]
* Map style improvements and fixes by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Jesse](https://couchers.org/user/jesse) [[#6492](https://github.com/Couchers-org/couchers/pull/6492)]

### Host Request and Reference Flow Improvements

We were getting a lot of bug tickets from people confused with the reference flow. We added some improvements:

* Require reference scale rating and make scale empty by default by [Felix](https://couchers.org/user/nepo36), with assistance from [Jesse](https://couchers.org/user/jesse) and [Nicole](https://couchers.org/user/unsettleddown) [[#6569](https://github.com/Couchers-org/couchers/pull/6569)]
* Add clearer error messages for references past 14 days, already written reference, need to be friends to write friend reference, etc; Differentiate on site better between friend and host reference; add pending host reference to that user's reference tab page; remove 0 on the reference tab for people with 0 references by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli), [Felix](https://couchers.org/user/nepo36) and [Jesse](https://couchers.org/user/jesse) [[#6814](https://github.com/Couchers-org/couchers/pull/6814)]
* Improved rating slider color interpolation by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Jesse](https://couchers.org/user/jesse) [[#6577](https://github.com/Couchers-org/couchers/pull/6577)]
* Backend to add location where hosting happens by [Andrei](https://couchers.org/user/andrei_k), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6379](https://github.com/Couchers-org/couchers/pull/6379)]
* Context refactor + quick decline via email by [Aapeli](https://couchers.org/user/aapeli) [[#6326](https://github.com/Couchers-org/couchers/pull/6326)]
* Decline flow improvements (backend) by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6556](https://github.com/Couchers-org/couchers/pull/6556)]
* Add host request characters remaining by [Nicole](https://couchers.org/user/unsettleddown) [[#6729](https://github.com/Couchers-org/couchers/pull/6729)]

### Events

* Allow users to add/remove event co-organizers by [Felix](https://couchers.org/user/nepo36) and [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6593](https://github.com/Couchers-org/couchers/pull/6593), [#6599](https://github.com/Couchers-org/couchers/pull/6599)]

![Screenshot showing how to make an attendee an event co-organizer](/img/blog/20251028_event_coorganizer.png)

* Fixed stretched community event image by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6595](https://github.com/Couchers-org/couchers/pull/6595)]
* Add comment count in Discover and Your Events tiles by [Dieu](https://couchers.org/user/dieu), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6937](https://github.com/Couchers-org/couchers/pull/6937)]
* Add boolean to turn community events/discussions off by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Andrei](https://couchers.org/user/andrei_k) [[#6477](https://github.com/Couchers-org/couchers/pull/6477)]
* Add upcoming event reminders with templates, migration, and tests by [Andrei](https://couchers.org/user/andrei_k), with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#6236](https://github.com/Couchers-org/couchers/pull/6236)]

### Invite friends feature

* Added an "Invite friends" feature to the main dropdown menu. You can get a personalized link now to invite friends to Couchers and see how many people signed up via the link by [Andrei](https://couchers.org/user/andrei_k) and [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6526](https://github.com/Couchers-org/couchers/pull/6526), [#6767](https://github.com/Couchers-org/couchers/pull/6767)]

![Screenshot showing the invite feature](/img/blog/20251028_invite_members.png)

### Host-Surfer Connection Improvements

* **Activeness probes**: Added a feature that emails users if they haven't signed in for a year checking if they still want to host. If they don't log in after that, we automatically change their status to "can't host". We hope this helps surfers more easily find active hosts by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Itsi](https://couchers.org/user/itsi) [[#6369](https://github.com/Couchers-org/couchers/pull/6369), [#6412](https://github.com/Couchers-org/couchers/pull/6412), [#6478](https://github.com/Couchers-org/couchers/pull/6478)]
* **Map search results ranking** Adjusted the ranking of search results for the map search. We realized new users were often showing low in search results and seasoned hosts were complaining of too many requests. We adjusted map search results to show a mix of new and seasoned users by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Itsi](https://couchers.org/user/itsi) and [Nicole](https://couchers.org/user/unsettleddown) [[#6557](https://github.com/Couchers-org/couchers/pull/6557)]
* **Search default filters to hide empty profile and can't host** by [Itsi](https://couchers.org/user/itsi), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6359](https://github.com/Couchers-org/couchers/pull/6359)]

![Screenshot showing the search bar with a message that empty profiles have been hidden by default](/img/blog/20251028_filter_empty_profile.png)

* Adjust order and color of host request response buttons by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Felix](https://couchers.org/user/nepo36) [[#6913](https://github.com/Couchers-org/couchers/pull/6913)]

### Total Redesign of Edit Profile Page

We redesigned the Edit Profile Page as felt it was out of date, not very user friendly and didn't highlight the most important aspects of the page. We added more guidance for users about what sections show in map search, made the hosting status more prominent and grouped the sections more intuitively

* Redesign the edit profile page by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Jesse](https://couchers.org/user/jesse) [[#6494](https://github.com/Couchers-org/couchers/pull/6494)]
* Web/UI changes edit profile by [Dieu](https://couchers.org/user/dieu), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6852](https://github.com/Couchers-org/couchers/pull/6852)]

![Screenshot showing hosting and meetup preference editing](/img/blog/20251028_editprofile_redesign_1.png)

![Screenshot showing the top of the profile editing page](/img/blog/20251028_editprofile_redesign_2.png)


### What is Couch Surfing Page

We recognize that there's a whole new generation of couch surfers now so we wanted to provide some information about the concept and history for newbies. [Find that page here](https://couchers.org/what-is-couch-surfing) by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6638](https://github.com/Couchers-org/couchers/pull/6638)].

### Moderation and Security

* Add duplicate accounts backend feature including api call to append, remove and get duplicated users by [Pablo](https://couchers.org/user/pcolt86), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#5967](https://github.com/Couchers-org/couchers/pull/5967)]
* Rework report reasons by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#6235](https://github.com/Couchers-org/couchers/pull/6235)]
* Implement warning emails and blocking limits on host requests/friend requests/chat initiations by [Yannic](https://couchers.org/user/spreeni), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6023](https://github.com/Couchers-org/couchers/pull/6023)]
* Update sleeping arrangement meanings by [Colleen](https://couchers.org/user/colleen), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Jesse](https://couchers.org/user/jesse) [[#6093](https://github.com/Couchers-org/couchers/pull/6093)]

### Miscellaneous Changes

* Add expand all to notification settings by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Jesse](https://couchers.org/user/jesse) [[#6508](https://github.com/Couchers-org/couchers/pull/6508)]
* New volunteer table and team page by [Aapeli](https://couchers.org/user/aapeli) and [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Chris](https://couchers.org/user/chrisk) [[#6539](https://github.com/Couchers-org/couchers/pull/6539), [#6545](https://github.com/Couchers-org/couchers/pull/6545), [#6553](https://github.com/Couchers-org/couchers/pull/6553), [#6641](https://github.com/Couchers-org/couchers/pull/6641)]
* Restrict ellipsis menu item types by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6644](https://github.com/Couchers-org/couchers/pull/6644)]
* Redirect authenticated users from index to dashboard by [Felix](https://couchers.org/user/nepo36), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6643](https://github.com/Couchers-org/couchers/pull/6643)]
* Increase envoy buffer size by [Aapeli](https://couchers.org/user/aapeli), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6601](https://github.com/Couchers-org/couchers/pull/6601)]
* Fixed docker services not working on Apple silicon by [Felix](https://couchers.org/user/nepo36), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6598](https://github.com/Couchers-org/couchers/pull/6598)]
* Request donation after strong verification by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6564](https://github.com/Couchers-org/couchers/pull/6564)]
* Increase client_max_body_size by [Aapeli](https://couchers.org/user/aapeli) [[#6555](https://github.com/Couchers-org/couchers/pull/6555)]
* Add newsletter signup link to footer by [Nicole](https://couchers.org/user/unsettleddown) [[#6766](https://github.com/Couchers-org/couchers/pull/6766)]
* Start preparing unified moderation system by [Rafael](https://couchers.org/user/rafael_ferreira), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#5977](https://github.com/Couchers-org/couchers/pull/5977)]
* Update social share image by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6280](https://github.com/Couchers-org/couchers/pull/6280)]
* Reminders (backend) by [Aapeli](https://couchers.org/user/aapeli) [[#6537](https://github.com/Couchers-org/couchers/pull/6537)]
* Start work on mobile app by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6880](https://github.com/Couchers-org/couchers/pull/6880)]

### Bug Fixes

* Fix Brisbane, AUS missing maps search bug and add extended nomatim tests by [Nicole](https://couchers.org/user/unsettleddown) [[#6721](https://github.com/Couchers-org/couchers/pull/6721)]
* Fix unread notif filter and switch spinner to skeleton by [Nicole](https://couchers.org/user/unsettleddown) [[#6932](https://github.com/Couchers-org/couchers/pull/6932)]
* Fixed many bugs and missing translations by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Felix](https://couchers.org/user/nepo36), [Jesse](https://couchers.org/user/jesse), [Aapeli](https://couchers.org/user/aapeli) and [Chris](https://couchers.org/user/chrisk) [[#6625](https://github.com/Couchers-org/couchers/pull/6625), [#6745](https://github.com/Couchers-org/couchers/pull/6745), [#6939](https://github.com/Couchers-org/couchers/pull/6939), [#6949](https://github.com/Couchers-org/couchers/pull/6949), [#6950](https://github.com/Couchers-org/couchers/pull/6950), [#6956](https://github.com/Couchers-org/couchers/pull/6956), [#6968](https://github.com/Couchers-org/couchers/pull/6968), [#6970](https://github.com/Couchers-org/couchers/pull/6970), [#6981](https://github.com/Couchers-org/couchers/pull/6981)]
* Cleaned up landing page after initial v1 release by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6393](https://github.com/Couchers-org/couchers/pull/6393)]

### Tech Debt

* Upgrade MUI to latest version by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Felix](https://couchers.org/user/nepo36) [[#6685](https://github.com/Couchers-org/couchers/pull/6685)]
* Adjust test_migrations for new postgres release by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Andrei](https://couchers.org/user/andrei_k) [[#6684](https://github.com/Couchers-org/couchers/pull/6684)]
* Fix build warnings and improve build time by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6890](https://github.com/Couchers-org/couchers/pull/6890)]
* Upgrade Sentry by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#6723](https://github.com/Couchers-org/couchers/pull/6723)]
* Upgrade react-query from v3 to v5 by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Felix](https://couchers.org/user/nepo36) [[#6543](https://github.com/Couchers-org/couchers/pull/6543)]
* Remove NextLink legacyBehavior by [Nicole](https://couchers.org/user/unsettleddown) [[#6525](https://github.com/Couchers-org/couchers/pull/6525)]
## CouchOps (e.g. Operations) Updates

### Translations

We've done a big push in the area of translations to make Couchers more accessible to other parts of the world.

Shoutout to our Translation Manager Chris who completed our German translations, our Russian Language Lead Vas who completed our Russian translations and our Language Leads Dale (French), Marc (Catalan), Hakan (Turkish) and Henriëtte (Dutch) who contributed over the last quarter. A big thank you to our numerous other translators that submitted suggestions in various languages.

We also introduced some new translation features and structure.

* Now languages with less than 50% translations are filtered out of the language picker and those with less than 80% are greyed out by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Chris](https://couchers.org/user/chrisk) [[#6971](https://github.com/Couchers-org/couchers/pull/6971)]

![Screenshot showing the new language picker](/img/blog/20251028_language_picker.png)

* We also added a translation progress page where you can keep track of our progress in various languages.

![Screenshot showing the translation progress page](/img/blog/20251028_translation_progress_page.png)


Shoutout to Chris for the idea of translation benchmarks and Nicole for making the translation progress page. [Find it here.](https://couchers.org/translate)

[Don't see your language? Join our team of Couchers translations and contribute some translations!](https://couchers.org/volunteer/translator)


### Proofread and update Couchers website pages

* Proofread and update FAQ by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aditi](https://couchers.org/user/adititrips) and [Aapeli](https://couchers.org/user/aapeli) [[#6725](https://github.com/Couchers-org/couchers/pull/6725)]
* Update Open Source Page after proofreading by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aditi](https://couchers.org/user/adititrips) and [Jesse](https://couchers.org/user/jesse) [[#6749](https://github.com/Couchers-org/couchers/pull/6749)]
* Text review for foundation, mission, plan pages by [Nicole](https://couchers.org/user/unsettleddown), with assistance from [Aditi](https://couchers.org/user/adititrips) and [Aapeli](https://couchers.org/user/aapeli) [[#6912](https://github.com/Couchers-org/couchers/pull/6912)]
* Update Other pages "roadmap" by [Chris](https://couchers.org/user/chrisk), with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#6855](https://github.com/Couchers-org/couchers/pull/6855)]
* Update donate page by [Aapeli](https://couchers.org/user/aapeli) [[#6915](https://github.com/Couchers-org/couchers/pull/6915)]

### Miscellaneous

* Aditi has organized our operations boards and is working to improve our volunteer onboarding process.


## Volunteering At Couchers Updates

With a couple of our major contributors becoming busy due to life changes and new jobs, we really could use more support.

To support a volunteer recruitment push next quarter, our volunteer Cameron recently totally re-did our volunteer application flow to make it more streamlined and gather the information we actually need to know from potential volunteers.

Want to help us make Couchers thrive? We especially need:

* **Senior Backend Python Developers** who are able to help review PRs as well as do feature and maintenance work
* **Mid and Senior Frontend Developers** in Typescript and React
* **Blog Writers** We currently have our developers writing our blog posts please save us.
* **UI/UX Designers** Help us come up with Figma designs for new features we have in the works!
* **Community Builders** Help us get a Couchers community thriving in your city! WRITE MORE HERE WE HAVE ZULIP ETC.

[Interested? Apply here!](/volunteer/form)

*Written by [Nicole](https://couchers.org/user/unsettleddown). Published on 2025/10/28*
