---
title: "Updates from the development team: August 1st, 2021"
description: "Read the latest updates from the Couchers.org development team."
date: 2021/08/01
author: Aapeli
share_image: https://couchers.org/img/share.jpg
---

We publish regular development updates to let you know what we have been working on, as well as what's coming soon.

## Roadmap

A quick overview of what the development team will be working on in the next few weeks.

### Events and community building

We've worked on some more events functionality in this release and will continue to wrap that up in the following releases.

We have started looking for Community Builders who would like to grow their local community on Couchers.org. If you're interested in this, please fill in the [Community Builder form](https://couchers.org/community-builder-form).

### Mobile applications for iOS and Android

We're looking for React Native developers to join our mobile development team. If you could help please fill in the [contributor form](https://app.couchers.org/contribute). We aim to have the Beta apps released by the end of the year.

## Latest features and bugfixes

In the past two weeks, we've spent a lot of time on cleaning up and refactoring some of the internals, so there are fewer big visible changes this time! But doing this kind of regular maintenance means our codebase stays healthy and we continue to add new features quickly. Here's a selection of some of the thigns we did in the past two weeks:

* Volunteering: added the contributor form back onto the dashboard and on a separate page [[#1695](https://github.com/Couchers-org/couchers/pull/1695), [#1747](https://github.com/Couchers-org/couchers/pull/1747)]
* Signup: made it possible to start signing up on the landing page, and made it easier to enter a valid username or email by lowercasing the input automatically [[#1709](https://github.com/Couchers-org/couchers/pull/1709), [#1745](https://github.com/Couchers-org/couchers/pull/1745)]
* Events: added event listing [[#1703](https://github.com/Couchers-org/couchers/pull/1703)]
* Friends: moved friend requests to the top of the connections page [[#1693](https://github.com/Couchers-org/couchers/pull/1693)]
* Communities: users are now added to their local communities on signup so the first page load includes this information [[#1622](https://github.com/Couchers-org/couchers/pull/1622)]
* Editor: added a button to upload images in the Markdown editor (only on community pages for now) [[#1700](https://github.com/Couchers-org/couchers/pull/1700)]
* Backend: fixed a long-term issue that would cause errors right after the platfrom had been updated [[#1696](https://github.com/Couchers-org/couchers/pull/1696)]
* Discussions: fixed wrapping issues and made cleared the comment when submitting it to a discussion [[#1707](https://github.com/Couchers-org/couchers/pull/1707)]

## Stats

Since the last update, 6 developers contributed to Couchers.org through 260 changes that changed 6.9 thousand lines of code. We welcome one new contributors who joined in the project and helped out on the codebase.

None of this would be possible without our 100+ volunteers working in all areas of the project. The development teams would like to thank the rest of the core contributors for making our work possible.

## Join the development team

You can join our development team on GitHub at [Couchers-org/couchers](https://github.com/couchers-org/couchers); or if you don't have time right now, give us a star to show your support! We work in the open and need as much help as we can get to build the next generation couch surfing platform!

*Written by Aapeli. Published on 2021/08/01.*

**Want to submit to our blog? [Sign up](/volunteer) and let us know.**
