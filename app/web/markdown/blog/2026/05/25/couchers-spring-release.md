---
is_blog_post: true
title: "Couchers.org Spring Release: What's New in v1.3?"
slug: couchers-spring-release
description: "The Couchers.org mobile app is now live on iOS and Android. Plus: a redesigned dashboard, messaging overhaul, better events, and 40+ improvements in one of our biggest releases yet."
date: 2026/05/25
author: Nicole
author_username: unsettleddown
has_custom_cta: true
---

*Quick summary: The Couchers.org mobile app is now live on iOS and Android. Plus: a redesigned dashboard, messaging overhaul, better events, and 40+ improvements in one of our biggest releases yet.*

## Table of Contents

- [Mobile App is out for Android and iOS!](#mobile-app-is-out-for-android-and-ios)
- [Donate devices for mobile testing](#have-an-old-iphone-or-android-donate-devices-for-mobile-testing)
- [New Features in the Spring Release (v1.3)](#new-features-in-the-spring-release-v13)
  - [Dashboard 2.0](#dashboard-20)
  - [Messages Overhaul](#messages-overhaul)
  - [Events](#events)
  - [Profiles](#profiles)
  - [Communities](#communities)
  - [UI and Platform Improvements](#ui-and-platform-dynamics-improvements)
  - [Localization](#localization)
  - [Bug Fixes](#bug-fixes)
  - [Preparation for future features](#preparation-for-future-features)
  - [Backend Improvements](#backend-improvements)
  - [Moderation](#moderation)
  - [Donations](#donations)
- [CouchOps Team Updates](#couchops-team-updates)
- [Current Volunteer Needs at Couchers](#updates-on-volunteering-at-couchers)

We've been very productive at Couchers since the winter release! Not only is the mobile app out on iOS and Android, but we're improving the dashboard to help you find and better interact with your communities

## Mobile App is out for Android and iOS!

We've been working on this since last July and it's out now on Android and iOS. Give it a download via the links below and please give us a good rating in the stores if you like it and tell your friends!

* [Android App on Google Play store](https://play.google.com/store/apps/details?id=org.couchers.android)
* [iOS App on Apple App Store](https://apps.apple.com/us/app/couchers-org/id6623776751)

<div style="text-align: center">

![Couchers mobile app release image](/img/blog/20260515_couchers_mobile_app_release.png)

</div>

Credit to [George](https://couchers.org/user/georgeryang) who created the app demo images.

* Added App Store and Google Play download buttons to the landing page and footer so it’s easier to find and install the Couchers mobile app by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8634](https://github.com/Couchers-org/couchers/pull/8634)]
* Improved the mobile app with profile previews that open without losing your place, faster language switching across tabs, Samsung interaction fixes, and a fix for editing community info on mobile by [Nicole](https://couchers.org/user/unsettleddown) [[#8563](https://github.com/Couchers-org/couchers/pull/8563)]
* Fixed iOS push notifications to show the correct shorter title and subtitle formatting by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8495](https://github.com/Couchers-org/couchers/pull/8495)]
* Fixed a mobile app bug where going back from a profile now restores your previous search results page and scroll position by [Nicole](https://couchers.org/user/unsettleddown) [[#8488](https://github.com/Couchers-org/couchers/pull/8488)]
* Fixed several mobile app bugs to make navigation more reliable, improve back navigation from search results, and fix sign-up links and editing layout issues by [Nicole](https://couchers.org/user/unsettleddown) [[#8485](https://github.com/Couchers-org/couchers/pull/8485)]
* Mobile fixes v1.1.16 - signup confirmation and staging asset links by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8162](https://github.com/Couchers-org/couchers/pull/8162)]
* Fixed a mobile logout issue that could leave people stuck in an in-between logged-in state by [Nicole](https://couchers.org/user/unsettleddown) [[#8260](https://github.com/Couchers-org/couchers/pull/8260)]
* Fixed mobile authentication flow issues that could prevent signup and password reset from completing properly by [Nicole](https://couchers.org/user/unsettleddown) [[#8253](https://github.com/Couchers-org/couchers/pull/8253)]
* Fixed a mobile signup/login issue that could redirect people to the login page at the wrong time in the app by [Nicole](https://couchers.org/user/unsettleddown) [[#8249](https://github.com/Couchers-org/couchers/pull/8249)]
* Fixed a mobile app login issue that could cause confusing screen flashes after signing up or resetting a password by [Nicole](https://couchers.org/user/unsettleddown) [[#8189](https://github.com/Couchers-org/couchers/pull/8189)]
* Fixed the mobile app menu staying open after switching tabs by [Nicole](https://couchers.org/user/unsettleddown) [[#8126](https://github.com/Couchers-org/couchers/pull/8126)]
* Fixed several mobile app navigation issues, including tab switching behavior and menus staying open unexpectedly by [Nicole](https://couchers.org/user/unsettleddown) [[#8120](https://github.com/Couchers-org/couchers/pull/8120)]
* Fixed several mobile app bugs including unexpected logouts, message button routing issues, incorrect tab highlighting, and image uploads being forced to square by [Nicole](https://couchers.org/user/unsettleddown) [[#7982](https://github.com/Couchers-org/couchers/pull/7982)]
* Fixed multiple mobile app issues including caching problems that caused stale content, full-screen menu display, and save button positioning by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7972](https://github.com/Couchers-org/couchers/pull/7972)]
* Added bottom navigation bar for mobile browser users and fixed several mobile app issues including dark mode flash on Android and app detection on Samsung devices by [Nicole](https://couchers.org/user/unsettleddown) [[#7911](https://github.com/Couchers-org/couchers/pull/7911)]
* Fixed dark mode flash and navigation issues on Android mobile app by [Nicole](https://couchers.org/user/unsettleddown) [[#7894](https://github.com/Couchers-org/couchers/pull/7894)]
* Fixed multiple mobile app issues including comment form input erasing on dark mode toggle, double spinner when uploading photos, and improved camera permission flow by [Nicole](https://couchers.org/user/unsettleddown) [[#7879](https://github.com/Couchers-org/couchers/pull/7879)]
* Improved password reset flow to automatically log users in after resetting their password, eliminating the need to log in manually by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#7305](https://github.com/Couchers-org/couchers/pull/7305)]
* Mobile fixes v1.1.8 by [Nicole](https://couchers.org/user/unsettleddown) [[#7751](https://github.com/Couchers-org/couchers/pull/7751)]
* Fixed profile photo uploads on mobile by implementing native camera and photo library integration by [Nicole](https://couchers.org/user/unsettleddown) [[#7779](https://github.com/Couchers-org/couchers/pull/7779)]
* Added universal linking support so Couchers links in emails and elsewhere now open directly in the mobile app when installed by [Nicole](https://couchers.org/user/unsettleddown) [[#7755](https://github.com/Couchers-org/couchers/pull/7755)]

## Have an old iPhone or Android? Donate devices for mobile testing

We could use a few devices to help our mobile developers with QA testing. Most of us only have an iPhone or Android which makes it difficult to test across different devices.

Do you have an old phone that is:
* Not older than 3 years
* In good working condition

**Note**: If you're in the US, you can deduct the fair market value of your donated device from your taxes!

[Let us know if you have a device to donate by filling out this short form](https://forms.gle/4YDAcweDLDLv3Wpd7)

## New Features in the Spring Release (v1.3)

### Dashboard 2.0

We've improved the dashboard to highlight your most important reminders and add some widgets that make it easier to interact with your communities. More improvements to come.

<div style="text-align: center">

![Dashboard Reminders](/img/blog/20260523-dashboard-reminders.png)

</div>

<div style="text-align: center">

![Dashboard 2.0](/img/blog/20260523-dashboard-2-0.png)

</div>

* Added a dashboard widget showing discussions in your communities so you can quickly catch up on community conversations by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8580](https://github.com/Couchers-org/couchers/pull/8580)]
* Added dismissible dashboard reminders so you can hide reminders you’ve already dealt with for one week by [Darren](https://couchers.org/user/darren) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#8679](https://github.com/Couchers-org/couchers/pull/8679)]
* Improved the dashboard events section by separating your upcoming events from events in your communities and making event listings more compact and easier to scan by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) and [Jesse](https://couchers.org/user/jesse) [[#8427](https://github.com/Couchers-org/couchers/pull/8427)]

### Messages Overhaul

We've made it easier to filter messages to find what you're looking for. There is now an unread filter and you can sort by hosting, surfing, chats and archive and unarchive messages to clean up your inbox.

<div style="text-align: center">

![Messages overhaul](/img/blog/20260523-messages-overhaul.png)

</div>

* feat: Unread messages filter by [Darren](https://couchers.org/user/darren) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#8400](https://github.com/Couchers-org/couchers/pull/8400)]
* fix: show create message modal on all message filter tabs by [Jesse](https://couchers.org/user/jesse) [[#8018](https://github.com/Couchers-org/couchers/pull/8018)]
* Added message archiving feature and redesigned messaging tabs with a new unified view and filter pills for easier navigation by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) [[#7941](https://github.com/Couchers-org/couchers/pull/7941)]

### Events

We've made some improvements to the events page including the ability to copy an event link to make it easier to share with friends, and browse attendees.

<div style="text-align: center">

![Events improvements](/img/blog/20260523-events-copy-link.png)

</div>

* Added a copy link option and streamlined event management actions on event pages to make sharing and editing events easier by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8524](https://github.com/Couchers-org/couchers/pull/8524)]
* Improved event pages by making attendee lists wrap directly on the page and adding pagination to browse more attendees more easily by [Valeria](https://couchers.org/user/waleria) with assistance from [Jesse](https://couchers.org/user/jesse), [Tristan](https://couchers.org/user/tristanlabelle) and [Nicole](https://couchers.org/user/unsettleddown) [[#8232](https://github.com/Couchers-org/couchers/pull/8232)]

### Profiles

You now must complete your profile in order to send a friend request. We've also added the abilty to send a first message directly from a user's profile and increased profile gallery photo limits so non-strong verified users can upload 2 photos and strongly verified users can upload 5.

<div style="text-align: center">

![Message from profile](/img/blog/20260523-message-from-profile.png)

</div>

* Increased profile gallery photo limits so non-verified users can upload 2 photos and strongly verified users can upload 5 photos by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8502](https://github.com/Couchers-org/couchers/pull/8502)]
* Web/profile: One-shot message form on user profile by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Jesse](https://couchers.org/user/jesse) and [Nicole](https://couchers.org/user/unsettleddown) [[#8452](https://github.com/Couchers-org/couchers/pull/8452)]
* Required users to complete their profile before sending friend requests by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) and [Tristan](https://couchers.org/user/tristanlabelle) [[#8520](https://github.com/Couchers-org/couchers/pull/8520)]

### Communities

We've added a "My communities" section to the communities page to make it easier to access your commuhities. We've also improved the recently created communities to be more accurate.

* Added a My communities section to the Communities page so you can quickly see and access the communities you’ve joined by [Nicole](https://couchers.org/user/unsettleddown) [[#8394](https://github.com/Couchers-org/couchers/pull/8394)]
* Fixed the new communities list to show the most recently created communities more accurately and reliably by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) and [Nicole](https://couchers.org/user/unsettleddown) [[#8347](https://github.com/Couchers-org/couchers/pull/8347)]
* Add node_type enum to Node model and only notify cities or lower communities by [Aapeli](https://couchers.org/user/aapeli) [[#7907](https://github.com/Couchers-org/couchers/pull/7907)]

### UI and Platform Dynamics Improvements

There have been many smaller UI and user flow improvements to improve user experience on the Couchers website, from clearer prompts and error messages, better strong verification instructions, cleaner push notification titles and smoother password reset flow.

* Improved friend requests by showing a clear prompt to complete your profile before sending one by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8521](https://github.com/Couchers-org/couchers/pull/8521)]
* Removed the strong verification reminder from the dashboard by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8512](https://github.com/Couchers-org/couchers/pull/8512)]
* Added show/hide password buttons to password reset, change email, and change password forms to make entering passwords easier and reduce mistakes by [Valeria](https://couchers.org/user/waleria) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#8412](https://github.com/Couchers-org/couchers/pull/8412)]
* Improved strong verification instructions with clearer NFC scanning tips and troubleshooting help to make passport verification easier by [Nicole](https://couchers.org/user/unsettleddown) [[#8334](https://github.com/Couchers-org/couchers/pull/8334)]
* Fixed the mobile password reset flow so users are asked to log in again instead of being sent to a broken app state by [Nicole](https://couchers.org/user/unsettleddown) [[#8263](https://github.com/Couchers-org/couchers/pull/8263)]
* Add validation to display name input by Andy with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#7822](https://github.com/Couchers-org/couchers/pull/7822)]
* Fixed notification feed menu to show both title and body text, making notifications more informative and easier to understand by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7999](https://github.com/Couchers-org/couchers/pull/7999)]
* Fixed bottom navigation bar covering the message input box on mobile web view by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) and [Aapeli](https://couchers.org/user/aapeli) [[#7942](https://github.com/Couchers-org/couchers/pull/7942)]
* Fixed image upload to show a clear error message when files exceed 20MB, instead of failing silently by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7918](https://github.com/Couchers-org/couchers/pull/7918)]
* Implement signup intents by [Aapeli](https://couchers.org/user/aapeli) [[#7550](https://github.com/Couchers-org/couchers/pull/7550)]


### Localization

Our volunteer [Tristan](https://couchers.org/user/tristanlabelle) has been hard at work on the trickier aspects of localization, specifically date and time localization improvements.

* Frontend/i18n: Localize date/time picker formats by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#8309](https://github.com/Couchers-org/couchers/pull/8309)]
* Frontend/i18n: Localize dates and times by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#8019](https://github.com/Couchers-org/couchers/pull/8019)]
* Backend/i18n: Localize date/times with Babel by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7884](https://github.com/Couchers-org/couchers/pull/7884)]
* Localized event date and time formatting to display in users' preferred language instead of English-only by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#7985](https://github.com/Couchers-org/couchers/pull/7985)]


### Bug Fixes

There have been many bug fixes behind the scenes, too many to name here, see below!

* Fixed a bug that prevented cancelled host requests from being properly removed from Google Calendar by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from Christian [[#8646](https://github.com/Couchers-org/couchers/pull/8646)]
* Fixed a bug that could post the closed host request helper text into conversations as if it were a real message by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8604](https://github.com/Couchers-org/couchers/pull/8604)]
* Fixed a dashboard bug that kept reminding hosts to respond to a request even after they had already replied by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8515](https://github.com/Couchers-org/couchers/pull/8515)]
* Fixed the cookie and push notification banners so they no longer block important buttons and search controls by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8537](https://github.com/Couchers-org/couchers/pull/8537)]
* Fixed a bug that could create duplicate active friend requests between the same two users and cause broken friendship behavior by [Aapeli](https://couchers.org/user/aapeli) [[#8398](https://github.com/Couchers-org/couchers/pull/8398)]
* Fixed a bug that sent event reminder notifications for cancelled or deleted events by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8399](https://github.com/Couchers-org/couchers/pull/8399)]
* Fixed a bug that could show the wrong dates on host requests in some timezones by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8329](https://github.com/Couchers-org/couchers/pull/8329)]
* Fixed a bug that could show the wrong dates on host requests in some timezones by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8282](https://github.com/Couchers-org/couchers/pull/8282)]
* Fixed a bug that sent duplicate notifications for new host requests by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8248](https://github.com/Couchers-org/couchers/pull/8248)]
* Fixed missing Save button on profile edit page that prevented users from saving their changes by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#7951](https://github.com/Couchers-org/couchers/pull/7951)]
* Fixed a dashboard bug that kept reminding hosts to respond to a request even after they had already replied by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8515](https://github.com/Couchers-org/couchers/pull/8515)]
* Fixed the cookie and push notification banners so they no longer block important buttons and search controls by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Jesse](https://couchers.org/user/jesse) [[#8537](https://github.com/Couchers-org/couchers/pull/8537)]

### Preparation for future features

Not visible yet, but we're always working on the next features behind the scenes, laying the groundwork for what's next!

* Fixed a bug that prevented cancelled host requests from being properly removed from Google Calendar by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Alexey](https://couchers.org/user/ptz) [[#8635](https://github.com/Couchers-org/couchers/pull/8635)]
* Added calendar invite attachments to host request emails so accepted, confirmed, and cancelled stays can be easily added to calendar apps by [Tristan](https://couchers.org/user/tristanlabelle) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8471](https://github.com/Couchers-org/couchers/pull/8471)]
* Backend: Public trips visibility & prevent dupe offers by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) and [Aapeli](https://couchers.org/user/aapeli) [[#8414](https://github.com/Couchers-org/couchers/pull/8414)]
* Added the ability to reopen closed public trips as long as the trip has not started yet by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Aapeli](https://couchers.org/user/aapeli) [[#8393](https://github.com/Couchers-org/couchers/pull/8393)]
* Fixed public trip date validation to use the trip location's timezone so international trips are checked correctly. by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Nicole](https://couchers.org/user/unsettleddown) [[#8364](https://github.com/Couchers-org/couchers/pull/8364)]
* Added the ability to edit public trip dates and descriptions before a trip ends, and allowed posting public trips in more specific regional communities by [Nicole](https://couchers.org/user/unsettleddown) [[#8339](https://github.com/Couchers-org/couchers/pull/8339)]
* Added support for public trips, including creating and browsing trips and showing upcoming trips on user profiles by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8336](https://github.com/Couchers-org/couchers/pull/8336)]
* Add postcard sending by [Aapeli](https://couchers.org/user/aapeli) [[#8107](https://github.com/Couchers-org/couchers/pull/8107)]


### Backend Improvements

Our volunteers, especially [Tristan](https://couchers.org/user/tristanlabelle), [Aapeli](https://couchers.org/user/aapeli) and [Alexey](https://couchers.org/user/ptz) have worked behind the scenes to make sure Couchers security, speed and general infrastructure is on point!

* Improved login security by showing a generic error message for incorrect usernames, emails, or passwords by Kevin with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8602](https://github.com/Couchers-org/couchers/pull/8602)]
* Fixed a bug where the cookie banner could cover the profile save button while editing your profile by [Nicole](https://couchers.org/user/unsettleddown) [[#8575](https://github.com/Couchers-org/couchers/pull/8575)]
* Fixed profile travel maps not showing up when using Couchers in languages other than English by [Nicole](https://couchers.org/user/unsettleddown) with assistance from [Chris](https://couchers.org/user/chrisk) [[#8573](https://github.com/Couchers-org/couchers/pull/8573)]
* Improved site reliability by preventing unnecessary certificate renewals during deploys that could briefly take the site offline by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Alexey](https://couchers.org/user/ptz) [[#8517](https://github.com/Couchers-org/couchers/pull/8517)]
* Fixed an issue where the site could get stuck on a loading spinner if an external service was unavailable by [Aapeli](https://couchers.org/user/aapeli) [[#8247](https://github.com/Couchers-org/couchers/pull/8247)]
* Fixed a push notification issue that could cause delivery failures for some browsers by rejecting invalid notification subscriptions by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) and [Alexey](https://couchers.org/user/ptz) [[#8212](https://github.com/Couchers-org/couchers/pull/8212)]
* Backend speedups by [Aapeli](https://couchers.org/user/aapeli) [[#8203](https://github.com/Couchers-org/couchers/pull/8203)]

### Moderation

Our volunteers [Aapeli](https://couchers.org/user/aapeli) and [Jesse](https://couchers.org/user/jesse) have been working hard on moderation and safety systems to ensure we can sustainably scale to a higher user count. Moderation tooling has been improved. Our moderation system is able to catch an estimated 95% of scams before they even reach users.

### Donations
* Added IRS-required tax acknowledgment text to donation receipt emails so donors can use them for tax-deductible charitable contributions by [Aapeli](https://couchers.org/user/aapeli) with assistance from [Tristan](https://couchers.org/user/tristanlabelle) [[#8365](https://github.com/Couchers-org/couchers/pull/8365)]


### Translations

In the past 6 months the number of available languages increased from 4 to 12! Shoutout to our many amazing translators for this!

## Current Volunteer Needs at Couchers

Want to help us make Couchers thrive? We especially need:

* **Senior Mobile Developers with Expo and React Native experience** Now that the app is out, we could really use some support with bug fixes and refactoring away from webviews to more native features in React Native with Expo.
* **Mid and Senior Backend Python Developer** who are able to specifically do feature work, coding the backend of features to prepare for the frontend work. Some upcoming backend features you could work on: Improving message notification frequency, public events, recurring events, leading creation of a feature request board, overhauling our location architecture to prepare for more community features.
* **Mid and Senior Frontend Developers** with familiarity with Typescript and React. Especially people who feel capable of owning a whole feature and/or are willing to help with package upgrades so not only one volunteer gets stuck with them!
* **Journalists who can pitch us to relevant media outlets** If you understand the vibe of the couch surfing community and are interested in brainstorming ideas including Couchers and pitching to appropriate publications and media outlets, we'd love your help!
* **Marketers and Social Media people with couch surfing experience** If you understand the couch surfing ethos and have experience leading things like ad campaigns, coming up with social media post ideas on Instagram, TikTok, organizing couch crashes, improving our signup email flow, etc. we could really use help with this! We're specifically looking for people who have ideas and could lead these pushes.
* **Grant Writers** Do you have experience with grant writing for non-profits? We'd love to chat even if it's just a single call or a referral as we help orient ourselves with this process so we can grow and improve Couchers.org even faster with additional resources.
* **Translators** Especially French, but we can always use more translations in every language. [Check our translation progress page here](https://couchers.org/translate) to see where we stand, and where you can pitch in!

[Interested? Apply here!](/volunteer/form)

