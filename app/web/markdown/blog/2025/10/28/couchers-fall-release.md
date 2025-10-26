# Couchers.org Fall Release --- What's New?

We've released a number of new features, and fixed many bugs. We discuss more of what's next below. We also moved to roughly a quarterly release schedule, which helps us keep on track better with smaller releases.


## New Features for Fall Release

### Same gender only filter for strong verified users

* Added a filter that allows you to filter results by only your own gender if you have completed strong verification (it’s free). This has been requested by several users so we’re happy to offer it now 6955

[](../../../../../public/img/blog/20251028_show_same_gender_only.png)


### Map Search

* Add chick emoji for no references 6371
* Map style improvements and fixes 6492

### Host Request and Reference Flow Improvements

We were getting a lot of bug tickets from people confused with the reference flow. We added some improvements:

* Require reference scale rating and make scale empty by default  6569
* Add clearer error messages for references past 14 days, already written reference, need to be friends to write friend reference, etc; Differentiate on site better between friend and host reference; add pending host reference to that user’s reference tab page; remove 0 on the reference tab for people with 0 references 6814
* Improved rating slider color interpolation 6577
* Backend to add location where hosting happens 6379
* Context refactor + quick decline via email 6326
* Decline flow improvements (backend) 6556
* Add host request characters remaining 6729

### Events
* Allow users to add/remove event co-organizers 6599,6593

[](../../../../../public/img/blog/20251028_event_coorganizer.png)

* Fixed stretched community event image 6595
* Add comment count in Discover and Your Events tiles 6937
* Add boolean to turn community events/discussions off 6477
* Add upcoming event reminders with templates, migration, and tests 6236

### Invite friends feature

Added an “Invite friends” feature to the main dropdown menu. You can get a personalized link now to invite friends to Couchers and see how many people signed up via the link 6526,6767

[](../../../../../public/img/blog/20251028_invite_members.png)

### Host-Surfer Connection Improvements

* **Activeness probes**: Added a feature that emails users if they haven’t signed in for a year checking if they still want to host. If they don’t log in after that, we automatically change their status to “can’t host”. We hope this helps surfers more easily find active hosts 6369,6412,6478
* **Map search results ranking** Adjusted the ranking of search results for the map search. We realized new users were often showing low in search results and seasoned hosts were complaining of too many requests. We adjusted map search results to show a mix of new and seasoned users 6557
* **Search default filters to hide empty profile and can't host** #6359

[](../../../../../public/img/blog/20251028_filter_empty_profile.png)

* Adjust order and color of host request response buttons 6913

### Total Redesign of Edit Profile Page

We redesigned the Edit Profile Page as felt it was out of date, not very user friendly and didn’t highlight the most important aspects of the page. We added more guidance for users about what sections show in map search, made the hosting status more prominent and grouped the sections more intuitively

* Create What Is Couchsurfing Page 6494
* Web/UI changes edit profile 6852

[](../../../../../public/img/blog/20251028_editprofile_redesign_1.png)

[](../../../../../public/img//blog/20251028_editprofile_redesign_2.png)


### What is Couch Surfing Page

We recognize that there’s a whole new generation of couch surfers now so we wanted to provide some information about the concept and history for newbies. [Find that page here](https://couchers.org/what-is-couch-surfing) 6638.

### Moderation and Security
* Add duplicate accounts backend feature including api call to append, remove and get duplicated users 5967
* Rework report reasons 6235
* Implement warning emails and blocking limits on host requests/friend requests/chat initiations 6023
* Update sleeping arrangement meanings 6093

### Miscellaneous Changes
* Add expand all to notification settings 6508
* New volunteer table and team page 6539,6545,6641,6553
* Restrict ellipsis menu item types 6644
* Redirect authenticated users from index to dashboard 6643
* Increase envoy buffer size 6601
* Fixed docker services not working on Apple silicon 6598
* Request donation after strong verification 6564
* Increase client_max_body_size 6555
* Add newsletter signup link to footer 6766
* Start preparing unified moderation system 5977
* Update social share image 6280
* Reminders (backend) 6537
* Start work on mobile app 6880

### Bug Fixes
* Fix Brisbane, AUS missing maps search bug and add extended nomatim tests 6721
* Fix unread notif filter and switch spinner to skeleton 6932
* Fixed many bugs and missing translations 6745,6968,6981,6970,6956,6950,6949,6939,6625
* Cleaned up landing page after initial v1 release 6393

### Tech Debt
* Upgrade MUI to latest version 6685
* Adjust test_migrations for new postgres release 6684
* Fix build warnings and improve build time 6890
* Upgrade Sentry 6723
* Upgrade react-query from v3 to v5 6543
* Remove NextLink legacyBehavior 6525

## CouchOps (e.g. Operations) Updates

### Translations

We’ve done a big push in the area of translations to make Couchers more accessible to other parts of the world.

Shoutout to our Translation Manager Chris who completed our German translations, our Russian Language Lead Vas who completed our Russian translations and our Language Leads Dale (French), Marc (Catalan), Hakan (Turkish) and Henriëtte (Dutch) who contributed over the last quarter. A big thank you to our numerous other translators that submitted suggestions in various languages.

We also introduced some new translation features and structure.

* Now languages with less than 50% translations are filtered out of the language picker and those with less than 80% are greyed out #6971

[](../../../../../public/img/blog/20251028_language_picker.png)

* We also added a translation progress page where you can keep track of our progress in various languages.

[](../../../../../public/img/blog/20251028_translation_progress_page.png)


Shoutout to Chris for the idea of translation benchmarks and Nicole for making the translation progress page. [Find it here.](https://couchers.org/translate)

[Don’t see your language? Join our team of Couchers translations and contribute some translations!
](https://couchers.org/volunteer/translator)


### Proofread and update Couchers website pages
* Proofread and update FAQ 6725
* Update Open Source Page after proofreading 6749
* Text review for foundation, mission, plan pages 6912
* Update Other pages “roadmap” 6855
* Update donate page 6915

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

[Interested? Apply here!](https://forms.monday.com/forms/0354e14aa52a37757e9b5ecf2419fef9?r=use1)

