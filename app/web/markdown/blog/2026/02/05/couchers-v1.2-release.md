---
title: "Couchers v1.2 Release: Feature releases and mobile app!"
slug: couchers-v1.2-release
description: "We've been busy! More about our donation drive results, dark mode, merch shop and mobile app Beta."
date: 2026/02/05
author: Nicole
author_username: unsettleddown
has_custom_cta: true
---

We’ve been working hard behind the scenes and have some exciting updates to share! In this post, we’ll reveal the results of our end-of-year donation drive, highlight the major features completed over the last three months, and provide an update on our mobile app progress (spoiler: we're looking for Beta testers).

## Donation Drive

We held our first ever donation drive starting mid-November and wrapping up at the start of the year. Overall it was a success, with us earning about US$2082 in donations during the drive, bringing us to a total of US$4287 for 2025, which will cover most of our expenses for the next year. A sincere thank you to all who donated! It's our community and your support that allows us to keep the servers running and our volunteers staying focused on the actual development and operational parts of keeping Couchers going! We received more donations from more people than we ever have before. Our biggest takeaway is that maybe it's not so bad to ask for support sometimes, or well, at least once a year ;-).

## Couchers.org Merchandise Shop

We now have a shop where you can buy Couchers.org hats, hoodies, stickers, pins and flags! [Check out the Couchers.org Merch Shop here.](https://couchers.org/shop). When you purchase merch, you'll get a "Swagster" badge on your profile too (as long as you use the same email as on your account)!

Interested in other merch? Let us know what you'd like to see!

A massive shoutout to [Chris](https://couchers.org/user/chrisk) who led this entire project and brought it over the line. He's the sole reason the merch shop exists!

* Add swagster badge by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#7274](https://github.com/Couchers-org/couchers/pull/7274)]

## Couchers Mobile App

Our biggest news — we're getting close to releasing a Couchers.org mobile app for iOS and Android! We're looking for some Beta testers to try the app out and help us find any bugs we missed before releasing to the general public.

Interested? [Sign up here and we'll email you once we're ready!](https://couchershq.org/mobile-app-beta.html)

## New Features

We released some big features this last quarter. Here's a summary of the major ones!

### Profile Photo Galleries

At long last, you can upload multiple photos to your profile! This has been requested for ages and we have finally gotten our moderation and backend systems to a place where we felt comfortable releasing it. For now this feature is only for users who complete Strong Verification (for free).

* Profile photo galleries by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli), [Alexey](https://couchers.org/user/ptz) and [Tristan](https://couchers.org/user/tristanlabelle) [[#7530](https://github.com/Couchers-org/couchers/pull/7530)]
* Photo galleries by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) and [Nicole](https://couchers.org/user/unsettleddown) [[#7178](https://github.com/Couchers-org/couchers/pull/7178)]
* Report flags on profile photo gallery by [Jesse](https://couchers.org/user/jesse) [[#7766](https://github.com/Couchers-org/couchers/pull/7766)]

<p align="center">
<img src="/img/blog/20260205_edit_profile_galleries.png" alt="Screenshot of edit profile galleries" />
</p>

<p align="center">
<img src="/img/blog/20260205_view_profile_galleries.png" alt="Screenshot of view profile galleries" />
</p>

### Duplicate Events

Event organizers have been requesting this for awhile. You can now duplicate an existing event so you don't need to type everything in again if you host multiple events.

* Add ability to duplicate events by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Alexey](https://couchers.org/user/ptz) and [Aapeli](https://couchers.org/user/aapeli) [[#7576](https://github.com/Couchers-org/couchers/pull/7576)]

<p align="center">
<img src="/img/blog/20260205_duplicate_event.png" alt="Screenshot of duplicate event" />
</p>

### Communities Search

* Add communities search and refactor page by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) and [Aapeli](https://couchers.org/user/aapeli) [[#7163](https://github.com/Couchers-org/couchers/pull/7163)]
* Implement community search by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Alexey](https://couchers.org/user/ptz) [[#7077](https://github.com/Couchers-org/couchers/pull/7077)]

<p align="center">
<img src="/img/blog/20260205_communities_search.png" alt="Screenshot of communities search" />
</p>

### Dark Mode

In preparation for the mobile app, we released dark mode! You can find this in the top navigation bar as well as in account settings.

* Implement dark mode to web app by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) and [Alexey](https://couchers.org/user/ptz) [[#7527](https://github.com/Couchers-org/couchers/pull/7527)]
* Added dark mode toggle button to the navigation bar for easier access by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Chris](https://couchers.org/user/chrisk) [[#7707](https://github.com/Couchers-org/couchers/pull/7707)]
* Improved dark mode settings with better placement in account settings, clearer instructions, and fixed mobile navigation icon visibility in dark mode by [Nicole](https://couchers.org/user/unsettleddown) [[#7601](https://github.com/Couchers-org/couchers/pull/7601)]

<p align="center">
<img src="/img/blog/20260205_dark_mode.png" alt="Screenshot of dark mode" />
</p>

### Notifications

* Extract push notification strings for localization by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7685](https://github.com/Couchers-org/couchers/pull/7685)]
* Rewrite push notifications following guidelines by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7587](https://github.com/Couchers-org/couchers/pull/7587)]
* Fixed email previews and titles that were missing from notification emails, making them more informative in your inbox by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Alexey](https://couchers.org/user/ptz) and Christian [[#7629](https://github.com/Couchers-org/couchers/pull/7629)]

### UI Improvements

* Added community events to dashboard so users can discover upcoming events from their joined communities in addition to events they're attending by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#7578](https://github.com/Couchers-org/couchers/pull/7578)]
* Modernized and improved readability of the dashboard hero search design by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7673](https://github.com/Couchers-org/couchers/pull/7673)]
* Fixed language detection to preserve user's language choice after logout and only auto-switch to well-translated languages by [Nicole](https://couchers.org/user/unsettleddown) [[#7492](https://github.com/Couchers-org/couchers/pull/7492)]

### Bug Fixes

* Improved message scrolling on mobile devices to keep the message input field visible and accessible when the keyboard is open by [Nicole](https://couchers.org/user/unsettleddown) [[#7792](https://github.com/Couchers-org/couchers/pull/7792)]
* Fixed language fallback system so Portuguese and Spanish speakers see complete translations in their language variant by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7758](https://github.com/Couchers-org/couchers/pull/7758)]
* Fixed squashed text field labels on mobile devices to improve form readability by [Nicole](https://couchers.org/user/unsettleddown) [[#7752](https://github.com/Couchers-org/couchers/pull/7752)]
* Fixed missing timezone name in email footers that was showing 'All times are in ' with blank timezone by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from Christian and [Aapeli](https://couchers.org/user/aapeli) [[#7733](https://github.com/Couchers-org/couchers/pull/7733)]
* Fixed 'Mark all read' button in notifications not working on first click, and clarified button text in messages to indicate it only marks the current tab as read by [Nicole](https://couchers.org/user/unsettleddown) [[#7709](https://github.com/Couchers-org/couchers/pull/7709)]
* Fixed bug where 'Confirm I didn't surf/host' button required a comment even though it was marked as optional by [Nicole](https://couchers.org/user/unsettleddown) [[#7708](https://github.com/Couchers-org/couchers/pull/7708)]
* Fixed a bug where deleted and banned users were incorrectly showing up in badge user lists by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#7516](https://github.com/Couchers-org/couchers/pull/7516)]

### Prep Work for New Features

* Backend: Added ability to archive and unarchive group chats to help organize conversations by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Alexey](https://couchers.org/user/ptz) and [Aapeli](https://couchers.org/user/aapeli) [[#7681](https://github.com/Couchers-org/couchers/pull/7681)]
* Postal verification (start) by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7286](https://github.com/Couchers-org/couchers/pull/7286)]
* Update link to new community invite accept/reject tool by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7054](https://github.com/Couchers-org/couchers/pull/7054)]

### Translations

* Implemented plural rules for all remaining supported languages to ensure grammatically correct translations across the platform by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Alexey](https://couchers.org/user/ptz), [Aapeli](https://couchers.org/user/aapeli) and Christian [[#7533](https://github.com/Couchers-org/couchers/pull/7533)]
* More complete i18next Python implementation by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from Christian, [Alexey](https://couchers.org/user/ptz) and [Aapeli](https://couchers.org/user/aapeli) [[#7475](https://github.com/Couchers-org/couchers/pull/7475)]
* Basic email translation infrastructure by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from Christian [[#7418](https://github.com/Couchers-org/couchers/pull/7418)]
* Updated Community Guidelines to display in the user's selected language instead of always showing in English by [Aapeli](https://couchers.org/user/aapeli) [[#7346](https://github.com/Couchers-org/couchers/pull/7346)]
* Implement backend translations by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7149](https://github.com/Couchers-org/couchers/pull/7149)]
* Fixed language detection to automatically show the site in your browser's language on first visit, and fixed language picker to work properly when logged out by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7487](https://github.com/Couchers-org/couchers/pull/7487)]
* Fixed Community Guidelines always showing in English during signup instead of the user's selected language by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Alexey](https://couchers.org/user/ptz) [[#7769](https://github.com/Couchers-org/couchers/pull/7769)]
* Fixed Community Guidelines and other localized content not displaying in the user's selected language during signup by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#7480](https://github.com/Couchers-org/couchers/pull/7480)]

### Developer Improvements & Tech Debt

* Completed full type annotation of the backend codebase with type-safe database model initialization, improving code reliability and reducing potential bugs by [Alexey](https://couchers.org/user/ptz) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) and [Aapeli](https://couchers.org/user/aapeli) [[#7628](https://github.com/Couchers-org/couchers/pull/7628)]
* Start using MappedAsDataclass for sqlalchemy models by [Alexey](https://couchers.org/user/ptz) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) and [Aapeli](https://couchers.org/user/aapeli) [[#7615](https://github.com/Couchers-org/couchers/pull/7615)]
* Extract Select methods to functions to preserve type information by [Alexey](https://couchers.org/user/ptz) with assistance from [Tristan](https://couchers.org/user/tristanlabelle), [Aapeli](https://couchers.org/user/aapeli), [Nicole](https://couchers.org/user/unsettleddown), [Hakan](https://couchers.org/user/thelosttraveler) and [Chris](https://couchers.org/user/chrisk) [[#7513](https://github.com/Couchers-org/couchers/pull/7513)]
* Completed Next.js v15 migration and upgraded i18next, improving platform performance and enabling future features like dark mode by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7382](https://github.com/Couchers-org/couchers/pull/7382)]
* Upgraded to React v19 and Next.js v15 to support modern features and maintain compatibility with latest web standards by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7367](https://github.com/Couchers-org/couchers/pull/7367)]
* Sped up tests by truncating tables instead of dropping them by [Alexey](https://couchers.org/user/ptz) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7053](https://github.com/Couchers-org/couchers/pull/7053)]
* Migrated to `uv` for backend dependency management by [Alexey](https://couchers.org/user/ptz) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7015](https://github.com/Couchers-org/couchers/pull/7015)]
* Upgraded Stripe by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7027](https://github.com/Couchers-org/couchers/pull/7027)]

### Moderation Tools

* New Unified Moderation System by [Aapeli](https://couchers.org/user/aapeli) and [Rafael](https://couchers.org/user/rafael_ferreira) [[#7201](https://github.com/Couchers-org/couchers/pull/7201)]
* Make Strong Verification enforce passport by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#7055](https://github.com/Couchers-org/couchers/pull/7055)]

### Volunteer Experience

* Allow volunteers to change their information on team page by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Vas](https://couchers.org/user/vas_traveler) and [Nicole](https://couchers.org/user/unsettleddown) [[#7279](https://github.com/Couchers-org/couchers/pull/7279)]
* Sync volunteer badges with volunteer table by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7277](https://github.com/Couchers-org/couchers/pull/7277)]
* Add volunteer management APIs by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7275](https://github.com/Couchers-org/couchers/pull/7275)]
* Add `editor` user level that can edit community stuff by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#7272](https://github.com/Couchers-org/couchers/pull/7272)]

## Volunteer at Couchers.org

Want to help us grow and thrive? Here's some ways you can join the volunteer team:

* [Event Organizers](https://couchers.org/volunteer/event-organizer) - Help run Couchers.org events in your city (or while traveling)!
* [Mid-Senior Frontend Developer](https://couchers.org/volunteer/mid-senior-frontend-developer) - We have the backend ready for many features but could use a couple more frontend developers familiar with React to help get things over the line!
* [Mobile Developer](https://couchers.org/volunteer/mobile-developer) - With the mobile app entering Beta soon, there will be lots of bug fixes and improvements. We could use some help from someone familiar with best practices for Expo and React Native as we're flying by the seat of our pants here.
* [Blog Writer](https://couchers.org/volunteer/blog-writer) - Have you hosted, surfed or run an event with Couchers and would be up for writing a blog post about the experience? We'd love to hear about it! Even a single post is a big help!

That's it for now! We want to take a joyful moment to thank every one of you who made Couchers so special last year. Whether you joined as a new member, organized events, supported others, contributed your time, participated in discussions, or helped build the platform, your presence truly made a difference. Couchers thrives because of people like you, and we’re sincerely grateful for your energy, care, and enthusiasm.

In 2025, together, we achieved so much! Some highlights include:
* Continued **growth of the Couchers community** around the world (1.4x in one year alone!)
* **Surpassing 50,000 users and going viral with [our official v1 launch](https://couchers.org/blog/2025/10/28/couchers-fall-release)** (and even releasing a v1.1!)
* Gaining over 100 new Instagram followers! [Follow our account @couchersorg](https://www.instagram.com/couchersorg) and stay up-to-date with all Couchers news
* The opening of the Couchers [merch shop](https://shop.couchershq.org)
* **Improved accessibility** by translating Couchers to German, Russian and Spanish (above 80% completion) and ongoing translation effort in other languages.
* **Improvements to volunteer tools**, including a new volunteer page and management options in profile settings
* Ongoing support from [community donations](https://couchers.org/donate) that help keep Couchers running

Every achievement last year was made possible by the enthusiasm and generosity of our incredible volunteers and Couchers members. Our community has become more active and supportive, and the progress we’ve made is something we can all be proud of.

We’ve built up so much momentum and excitement this year, and the future is brighter than ever. Thank you for being part of Couchers.

