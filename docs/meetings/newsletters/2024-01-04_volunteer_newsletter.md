# 🌟 Couchers.org Volunteer Newsletter

## 🎉 Welcome to Our First Edition!

Hello, amazing Couchers volunteers!  
If you’re reading this, you’ve volunteered with Couchers in some capacity in the past or are doing so now. With the New Year underway, we have some resolutions of our own and big goals going forward. We’ve had a surge of volunteer activity, so we wanted to share with you what we’ve been working on, as well as what we plan to do, and what we could use your help with in case this stirs any FOMO 😉.

We'll be sending out this volunteer newsletter intermittently, maybe once a quarter or so. It probably won't be very frequent since we are a bit lousy at writing newsletters (if you want to help, let us know). We appreciate all of your amazing contributions and want to share some more details with you and let you know of any opportunities to jump back in.

That said, if you don't want to receive these newsletters, please click on the big button below and we'll unsubscribe you, no dramas!

[[UNSUB BUTTON]]

## Table of Contents
- [How to Get Involved](#-how-to-get-involved)
- [Engineering Accomplishments](#-engineering-updates)
- [Help Wanted: Engineering](#-help-wanted-engineering)
- [Design and Operations Accomplishments](#-design--operations-accomplishments)
- [Help Wanted: Design](#️-help-wanted-design)
- [Help Wanted: Operations](#️-help-wanted-operations)
- [Help Wanted: Marketing, Branding and Outreach](#help-wanted-marketing-branding-and-outreach)
- [Big Picture Goals](#-big-picture-goals)


[[[[ PHOTO OF VOLUNTEERS CALL - SOMEONE SEND IT TO ME PLZZZ ]]]]

This could be you. ;-).
---

## 🤖 [How to get involved](#-how-to-get-involved)

Interested in jumping back in, but not sure how? You can:

* Join our weekly zoom meeting Tuesdays at 21:00 UTC at http://couchers.org/zoom
* Pop into our Slack channel and say hi. Email us at volunteers@couchers.org if you need an invite.
* Tag @nabramow, @aapeliv or @jesseallhands on Github in a ticket you'd like to pick up and assign yourself to it. Check out our [Couchers Engineering Task Board](https://github.com/Couchers-org/couchers/projects) for what’s in progress or ready to tackle. See Help Wanted for [Engineering](#-help-wanted-engineering), [Design](#️-help-wanted-design) and [Operations](#️-help-wanted-operations)


## 💻 [Engineering Updates](#-engineering-updates)

Since the last public newsletter went out, we've put our heads down and mostly been grinding out feature updates and bugfixes for the web platform. We also have an ongoing effort to build a mobile app in React Native. Here's a short list of some engineering accomplishments:

* 👤 **Complete Profiles**: Incomplete profiles can now be filtered out on the map. Users with incomplete profiles won’t be able to send messages, host requests, or create events until they upload a photo and fill in their details.
* 🛡️ **Strong Verification**: Users can now verify gender and age using their passports for enhanced safety. Shoutout to [Aapeli](https://github.com/aapeliv) for setting this up and upgrading it recently!
* 🔔 **Push Notifications**: Notifications are in Feature Preview, with a notification settings page complete. Backend work is mostly done, and frontend updates are in progress. Care to help? [View the issue here](https://github.com/Couchers-org/couchers/issues/5006).
* 🗺️ **More Map Filters**: Filters for gender, meetup status, and excluding empty profiles are live! Shoutout to [David](https://github.com/bakeiro) for all his work on the map!
* 🎨 **Events Page Revamp**: The events page has been totally redesigned! Users can now cancel events as well, with more improvements planned for the future.
* 📱 **Mobile Improvements**:
    * **Standalone Mobile App**: Shoutout to [Ivan](https://github.com/polemius), who has been working solo on this!
    * **Mobile Web Enhancements**: Progress continues (though we still need more hands).
* ⚙️ **Frontend Upgrades**: We’ve upgraded React to v18, Material-UI, and Next.js to v13. Shoutout to [Nicole](https://github.com/nabramow), your author, for this!

---

## 🚀 [Help Wanted: Engineering](#-help-wanted-engineering)

Tickets we could use help with:

* **Notifications feed**: [Frontend to implement a feed of recent notifications](https://github.com/Couchers-org/couchers/issues/5434).
** **Move notifications out of Feature Preview** [We're ready to move push notification enabling out of its experimental phase](https://github.com/Couchers-org/couchers/issues/5006)
* **Public events**: [Grab a frontend or backend ticket from this epic](https://github.com/Couchers-org/couchers/issues/5339)
* **Private feedback for references**: [Frontend to add private feedback during reference process](https://github.com/Couchers-org/couchers/issues/4121)
* **Map user pagination**: [Add user pagination to backend map search result](https://github.com/Couchers-org/couchers/issues/5323).
* **Moderation tool for support to delete comments** [Option to delete comments on events or discussions for support team in Couchers console](https://github.com/Couchers-org/couchers/issues/5203)
* **Event page improvements** [Don't show join/leave event buttons for past events](https://github.com/Couchers-org/couchers/issues/4174)
* **Don't receive messages from empty accounts** [Add a setting for users to not receive messages from empty accounts](https://github.com/Couchers-org/couchers/issues/4089)
* **Feedback slider defaults to negative** [Change it to default to positive to prevent accidenta negative ratings](https://github.com/Couchers-org/couchers/issues/3443)
* **Profile image upload issues** [Clicking save while uploading terminate upload](https://github.com/Couchers-org/couchers/issues/5184)
* **Add number of comments to events** [Add number of comments to event tiles](https://github.com/Couchers-org/couchers/issues/5217)
* **Show user community events on dashboard** [Add events from city communities user belongs to on dashboard](https://github.com/Couchers-org/couchers/issues/5273)
* **Upgrade bug reporting to include screenshot/video** [Upgrade bug reporting with sentry to include more context, photo, etc](https://github.com/Couchers-org/couchers/issues/5291)
* **Frontend Package Upgrades**: Help us stay current by upgrading to [React v19](https://github.com/Couchers-org/couchers/issues/5381), [Material-UI v6](https://github.com/Couchers-org/couchers/issues/5376), and [react-query from v3 to latest](https://github.com/Couchers-org/couchers/issues/5263), among others.
* 📱 **React Native Mobile App**: We could use more hands here. Help [Ivan](https://github.com/polemius) tackle the standalone app! We don't have a specific ticket for this as we're making it from scratch, see [how to get involved](#-how-to-get-involved) to help.

Check out our [Couchers Engineering Task Board](https://github.com/Couchers-org/couchers/projects) for more and see [How To Get Involved](#-how-to-get-involved).

---

## 🎨 [Design & Operations Accomplishments](#-design-and-operations-accomplishments)

* 📧 **Graphic Email Notifications**: We’ve moved from plain text emails to a polished, graphic design for notifications.
* 📝 **Private Feedback Flow**: We’ve designed improvements for private feedback during the reference process (implementation pending). 

Shoutout to [Jesse](https://couchers.org/user/jesse), who’s been doing design and support solo! Any Figma whizzes among you? Come help him!

* ❓ **Couchers 2024 User Survey**: We conducted a survey among all Couchers.org users to gain insight into the main issues and priorities of our users. Improvements to the map search and filtering of inactive/incomplete profiles were the most requested feautures in the survey. Shoutout to [Yannic](https://github.com/spreeni) who had the main role in this!

### ✍️ [Help Wanted: Design](#️-help-wanted-design)

1. 🗺️ **Map Redesign**: Our top focus. We've talked about it a lot, but we need someone with design thinking to help us make a decision! Want to help?
2. 🛡️ **Strong Verification Design**: We could use help with the design for this feature to move it out of Feature Preview. 
3. 🚀 **Signup Flow & Landing Page**: Needs a major overhaul for better user experience.  
4. 📱 **Native App Design**: We need designs for the standalone mobile app.
5. 💻 **Logo for Couchers Engineering**: We'd like to design a logo specific for the Couchers Engineering group.
6. 🎨 **Couchers stickers**: Help us design some Couchers stickers to spread the word!
7. 📮 **Mail verification postcard**: We want to make a snazzy postcard for users who complete mail verification.

Want to help? See [How To Get Involved](#-how-to-get-involved)

---

## 🛠️ [Help Wanted: Operations](#️-help-wanted-operations)

We could use a hand with:

* 🌍 **Translation Lead Organizer**: With the new feature updates and changes to the platform, we've fallen behind on translating the app. If you're interested in helping organize this effort to translate the new parts, please get in touch!
* 🗣️ **Translators**: Just want to help us translate the app into your language? Please get in touch! We could especially use help translating into Chinese (Traditional), Czech, Dutch, French, French (Canadian), Hindi, Italian, Japanese, Japanese (Kansai), Norwegian Bokmål, Polish, Portuguese (Brazil), Portuguese(Portugal), Russian, Spanish, and Spanish (Latin America).
* 👋 **Support People**: Answering support and help requests. Help your fellow Couchers out!

Want to help? See [How To Get Involved](#-how-to-get-involved)

---

## 📝 [Help Wanted: Marketing, Branding, and Outreach](#help-wanted-marketing-branding-and-outreach)

* 📰 **Newsletters**: These are some of the most prominent ways in which we get the word out, and we'd like to send one out four times a year to communicate the latest updates and our latest strategy. Please come help us write some!
* 🌐 **Website rebranding**: We want to change our branding from being simply an alternative to CouchSurfing.com™ into standing on our own two feet as the safest and coolest couch surfing platform. Come help us rewrite and redesign our landing pages for this new angle!
* 📢 **Marketing Lead**: We are looking for someone to help us get the word out about Couchers to the right people. This person would handle the strategic thinking for marketing campaigns, social media strategy, community outreach and may recruit other volunteers as needed.
* 🪽 **Social Media Community Managers**: Take the reigns and help us create content for Instagram, TikTok, Facebook, Bluesky, Facebook, LinkedIn or wherever the cool travel kids are hanging out these days.
* ✍🏽 **Writers**: We want to create more newbie-friendly content to bring more people into couch surfing, including a section on the website for "what is couch surfing" to explain to those who've never thought about it what it is. Come help in this effort!

Want to help? See [How To Get Involved](#-how-to-get-involved)

---

## 🌟 [Big Picture Goals](#-big-picture-goals)

We’re moving away from “better than Couchsurfing” branding to establish our own identity as a modern, safe, and active travel community. Key focuses include:

* 🛡️ **Safety Features**: Strong verification and user blocking.  
* 📝 **Active Users**: Highlighting users with complete profiles.  
* 🔍 **Better Filters**: Making it easier to find users like you.  

To leave beta, we’re tackling critical map and mobile issues, launching the app, and improving usability.


## 💙 Thank You!

That’s it for now! If anything sparks your interest, we’d love for you to jump back in. Know someone who might want to help? Send 'em our way! Whether you’re coding, designing, translating, or simply cheering us on, thank you for being part of this community.  

Here’s to making Couchers.org even better in 2025!  

💙 The Couchers.org Team
