---
is_blog_post: true
title: "Couchers.org v1.4 Release: A New Inbox, a Smarter Dashboard and More"
slug: version-1.4.0-release
description: "One inbox for all your conversations, a smarter dashboard, better translations and dozens of fixes in Couchers v1.4."
date: 2026/10/07
author: Nicole
author_username: unsettleddown
has_custom_cta: true
---

*Quick summary: We've rebuilt the messages inbox, made the dashboard smarter, made connecting with people easier, and improved how Couchers works in your language and timezone.*

## Table of Contents

- [Messages and conversations](#messages-and-conversations)
- [Communities and discussions](#communities-and-discussions)
- [Events](#events)
- [Dashboard](#dashboard)
- [Profiles, connections, and verification](#profiles-connections-and-verification)
- [Host requests and stays](#host-requests-and-stays)
- [Language and localization](#language-and-localization)
- [Notifications and email](#notifications-and-email)
- [Moderation and safety](#moderation-and-safety)
- [Site improvements](#site-improvements)
- [Donations and Couchers information](#donations-and-couchers-information)
- [Bug fixes](#bug-fixes)
- [Performance and reliability](#performance-and-reliability)
- [Features in progress](#features-in-progress)

It's been a busy few months since the spring release! The mobile app has been out in the world, lots of new members have joined, and our volunteers have been hard at work making Couchers easier, safer and faster to use. Here's everything that's new in v1.4.

## Messages and conversations

Chats and host requests now live together in one inbox. You can switch between them with filter pills, show only unread conversations, archive the ones you're done with, and mark everything as read in one go. Chat bubbles have clearer alignment, spacing and timestamps, and conversations no longer stretch across the whole screen on wide monitors.

<div style="text-align: center">

![Messages inbox with filters](/img/blog/20261007-messages.png)

</div>

You can now send someone a first message straight from their profile. To cut down on spam, there's now a limit on how many brand-new conversations someone can start, but replying in existing chats isn't affected.

We also fixed a lot of small things in the inbox: unread badges now clear as soon as you read a message, group chat counts stay right after you leave or rejoin a chat, and the helper text on closed host requests no longer shows up as if it were a real message.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Nicole](https://couchers.org/user/unsettleddown), [Darren](https://couchers.org/user/darren), [Jesse](https://couchers.org/user/jesse) and [Alexey](https://couchers.org/user/ptz) for these improvements!

## Communities and discussions

The Communities page has a new "My communities" section showing the communities you've joined, and community lists now show your most local communities first. On any community page, a searchable dropdown takes you straight to a more specific community, such as a country, city or neighborhood. The list of recently created communities is also more accurate.

You can now edit or delete your own discussions, comments and replies. When you delete something, the rest of the conversation stays.

**Thanks to** [Nicole](https://couchers.org/user/unsettleddown), [Kevin](https://couchers.org/user/kevinortiz43), [Aapeli](https://couchers.org/user/aapeli), [Tristan](https://couchers.org/user/tristanlabelle), [Jesse](https://couchers.org/user/jesse) and [Alexey](https://couchers.org/user/ptz)!

## Events

Event pages look better with lots of attendees: the attendee list wraps across the page, you can page through it, and the counts are clearer. There's a new copy link button to make sharing easier, the edit and manage options are simpler, and when you create an event the end date and time fill in for you.

<div style="text-align: center">

![Event page with attendee list](/img/blog/20261007-event.png)

</div>

Couchers is about meeting people in person, so we've removed online events. All community events are now in-person.

Event search can now hide events you're already going to or organizing, and those events won't show up again in your suggestions or get you a duplicate invite. Event times are now saved and shown in the event's own timezone, even if you created it from somewhere else. We also fixed pages skipping or repeating events.

**Thanks to** [Valeria](https://couchers.org/user/waleria), [Christian](https://couchers.org/user/chris_saavedra), [Nick](https://couchers.org/user/bknicholas), [Nicole](https://couchers.org/user/unsettleddown), [Tristan](https://couchers.org/user/tristanlabelle), [Aapeli](https://couchers.org/user/aapeli), [Jesse](https://couchers.org/user/jesse) and [Alexey](https://couchers.org/user/ptz)!

## Dashboard

The dashboard now shows your upcoming stays and guests. Events are split into the ones you're going to and the ones happening in your communities, and there's a new widget with recent discussions from your communities. The "Your communities" section has a cleaner card design, loads faster, and is easier to scroll through.

<div style="text-align: center">

![Dashboard with upcoming stays and events](/img/blog/20261007-dashboard.png)

</div>

Reminders are more useful too. They now remind surfers to confirm a stay once a host accepts, and remind hosts to fill in their My Home section so guests know what to expect. You can hide a reminder for a week. We removed the strong verification reminder and fixed one that kept asking hosts to respond to requests they'd already answered.

**Thanks to** [Nicole](https://couchers.org/user/unsettleddown), [Kevin](https://couchers.org/user/kevinortiz43), [Darren](https://couchers.org/user/darren), [Aapeli](https://couchers.org/user/aapeli), [Tristan](https://couchers.org/user/tristanlabelle), [Jesse](https://couchers.org/user/jesse) and [Chris](https://couchers.org/user/chrisk)!

## Profiles, connections, and verification

The connections page has been redesigned so friends, friend requests, sent requests and blocked users are easier to manage. Clicking a pending friend request button now takes you straight to that request. To cut down on unwanted friend requests, you now need to finish your profile before sending one, and you'll be asked to confirm before it's sent.

<div style="text-align: center">

![Redesigned connections page](/img/blog/20261007-connections.png)

</div>

Profiles got some love too. Pronouns are now a free-text field, profile placeholders are simpler and translated, and name checks accept many more real names from different languages and writing systems. Users who aren't verified can now add 2 gallery photos, and strongly verified users can add 5. Search results show strong verification badges correctly, and the strong verification instructions are clearer, with tips for scanning your passport with NFC. New members are asked during signup what brings them to Couchers, which helps us understand what to build next.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Nicole](https://couchers.org/user/unsettleddown), [Tristan](https://couchers.org/user/tristanlabelle), [Andy](https://couchers.org/user/andym), [Darren](https://couchers.org/user/darren), [Jesse](https://couchers.org/user/jesse) and [Valeria](https://couchers.org/user/waleria)!

## Host requests and stays

Host request emails now include a calendar invite, so accepted, confirmed and cancelled stays show up in your calendar app and are removed when a stay is cancelled. Dates in these emails are easier to read, with the day of the week and no year.

Request dates are now checked and displayed correctly across timezones. If sending a request fails, your message is saved, and tapping Send several times on a slow connection no longer sends duplicate requests.

**Thanks to** [Tristan](https://couchers.org/user/tristanlabelle), [Aapeli](https://couchers.org/user/aapeli), [Nicole](https://couchers.org/user/unsettleddown), [Alexey](https://couchers.org/user/ptz) and [Christian](https://couchers.org/user/chris_saavedra)!

## Language and localization

Couchers is used all over the world, and this release does a much better job of speaking your language. Dates and times across the site, events, notifications and signup now follow your language and date format, hide the year when it isn't needed, and avoid common timezone mistakes. Local times on profiles now show the timezone.

The language picker now lists each language by its own name instead of a flag, which makes variants like Brazilian Portuguese and Traditional Chinese easier to tell apart. Your browser's language is also detected more accurately. Region and language names are translated, lists are sorted in the right order for your language (including Chinese), and Māori, Krio and Tok Pisin are now available as profile languages. Signup and email-change emails now arrive in your chosen language, and we fixed missing or broken translations in several places, including web push notifications.

<div style="text-align: center">

![Language picker showing language names](/img/blog/20261007-language.png)

</div>

As always, a huge thank you to our volunteer translators. [See where your language stands and help out on our translation page](https://couchers.org/translate)!

**Thanks to** [Tristan](https://couchers.org/user/tristanlabelle), [Kevin](https://couchers.org/user/kevinortiz43), [Aapeli](https://couchers.org/user/aapeli), [Nicole](https://couchers.org/user/unsettleddown), [Han](https://couchers.org/user/aviatorhan), [Jesse](https://couchers.org/user/jesse) and [Alexey](https://couchers.org/user/ptz)!

## Notifications and email

This release cuts down on notification noise. If push notifications are on, we now wait a bit before emailing you about a missed message, so you don't get the same message twice. Very large global and regional communities no longer send event emails. You also won't get notified about your own event changes or reminded about cancelled events.

Notifications are clearer, too. Email previews in your inbox show part of the actual message instead of repeating the subject. Group chat push notifications include the group name, and event update emails show what changed in your language. The notification menu now shows both the title and the details.

Behind the scenes, we fixed duplicate host request notifications and emails that were sent without translations, and made push notifications more reliable on more browsers.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Tristan](https://couchers.org/user/tristanlabelle), [Nicole](https://couchers.org/user/unsettleddown) and [Alexey](https://couchers.org/user/ptz)!

## Moderation and safety

As Couchers grows, we want new features to stay safe from day one. Discussion and event pages now have a report button, and you need to finish your profile before posting in community discussions. Moderators also have better tools for keeping notes and tracking their work.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Kevin](https://couchers.org/user/kevinortiz43), [Tristan](https://couchers.org/user/tristanlabelle) and [Alexey](https://couchers.org/user/ptz)!

## Site improvements

User cards across the site have a cleaner layout, work better on small screens, show locations more clearly, and show verification badges in more places. Profile photos in emails now link to the person's profile. Password fields have a show/hide button. The cookie and notification banners no longer cover buttons, and the bottom navigation bar no longer covers the message box on mobile web.

**Thanks to** [Kevin](https://couchers.org/user/kevinortiz43), [Valeria](https://couchers.org/user/waleria), [Nicole](https://couchers.org/user/unsettleddown), [Tristan](https://couchers.org/user/tristanlabelle), [Aapeli](https://couchers.org/user/aapeli), [Jesse](https://couchers.org/user/jesse) and [Keigo](https://couchers.org/user/keigo)!

## Donations and Couchers press page

You can now [donate](https://couchers.org/donate) yearly, with suggested amounts, and anyone can view the donation page without logging in. Donation receipt emails now include the text US donors need to claim the donation as a tax-deductible gift.

We also have a new [Press & Media page](https://couchers.org/press) with key facts, downloadable logos and images, and team information for journalists. The landing page and footer now link to the app in the App Store and Google Play.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Darren](https://couchers.org/user/darren), [Valeria](https://couchers.org/user/waleria), [Nicole](https://couchers.org/user/unsettleddown), [Tristan](https://couchers.org/user/tristanlabelle) and [Jesse](https://couchers.org/user/jesse)!

## Bug fixes

Some smaller improvements: you're now logged in automatically after resetting your password, and you can correct a mistyped email address during signup. Login errors no longer reveal whether an account exists. Photo upload errors are clearer, including for files over 20MB. Merch shop buyers who were missing their swagster badge now have it, and searches near the International Date Line show nearby people and events.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Nicole](https://couchers.org/user/unsettleddown), [Kevin](https://couchers.org/user/kevinortiz43), [Nick](https://couchers.org/user/bknicholas), [Noah](https://couchers.org/user/njelich), [Olivier](https://couchers.org/user/gwened) and [Tristan](https://couchers.org/user/tristanlabelle)!

## Performance and reliability

A lot of work went into making Couchers faster and more stable. The backend now runs across more processes and handles heavy traffic better, the website caches files so pages load faster, and background tasks like emails and notifications run more on time. We've also improved the backend to help protect the site from abuse. Deploys cause less downtime, and the site keeps working when an outside service such as translations or feature settings is down. We also fixed the search page freezing when there were lots of results.

**Thanks to** [Aapeli](https://couchers.org/user/aapeli), [Tristan](https://couchers.org/user/tristanlabelle), [William](https://couchers.org/user/wbruntra), [Alexey](https://couchers.org/user/ptz), [Darren](https://couchers.org/user/darren), [Nicole](https://couchers.org/user/unsettleddown), [Kevin](https://couchers.org/user/kevinortiz43) and [Keigo](https://couchers.org/user/keigo)!

## Features in progress

A couple of big features are in the final round of testing and getting their finishing touches. We're doing a lot of work on them behind the scenes. Here's a sneak peek.

**Public trips.** Instead of sending request after request, you'll be able to post where you're going and when. Your trip will show up in that city's community, in the regional communities around it, so local hosts can find you and offer to host you directly. We're testing it now and will let you know when it's ready.

**Postal address verification.** This is a new way to build trust. We'll mail you a postcard with a code, and once you enter it you'll get a Verified Address badge on your profile.

**Thanks to** [Nicole](https://couchers.org/user/unsettleddown), [Aapeli](https://couchers.org/user/aapeli), [Tristan](https://couchers.org/user/tristanlabelle) and [Alexey](https://couchers.org/user/ptz) for working on these!

## Want to help?

Every feature in this release was built by volunteers. If you'd like to join them as a developer, translator, writer or community organizer, [we'd love to hear from you](https://couchers.org/volunteer). And if Couchers has helped you find a couch, a host or a friend, please consider [making a donation](https://couchers.org/donate) to keep the servers running.

Thank you for being part of Couchers!
