---
title: "Where we are and where we are going"
slug: where-we-are-and-where-we-are-going
description: Read some discussion on the state of the Couchers.org project and our plans for the future from Couchers.org co-founder Aapeli.
date: 2024/06/12
author: Aapeli
share_image: https://couchers.org/img/blog/20240612_baby-alpha-screenshot.jpg
---

I'm Aapeli, and I'm one of the co-founders of the Couchers project, along with Itsi. In this post, I want to take a moment to share with you some reflections on where the Couchers project is right now, and where we are going in the future.

I find it helpful to divide the chronology of Couchers into three phases:

1. the first phase of laying out our vision and plan for the platform and community;
2. the second phase of developing the core parts of the web platform; and
3. the third phase (that we are just now embarking on) of growing our active community.

In what follows, I will go through each of these phases and how that impacts us today.

## Phase 1: The beginnings: a Vision and a Plan for a better couch surfing platform

Couchers started in early 2020, at the very start of the COVID-19 pandemic. I had been couch surfing around the world and living in a van in North America for the past year but had had to evacuate back to Australia. I was stuck back in my childhood bedroom and was working a boring software engineering job. Itsi, whom I had met a few years earlier at the University of Melbourne where we both did a masters degree, was also stuck at home. We were in different cities in Australia, but we were both itching to do something. We'd discussed a few ideas, maybe a platform for reselling lightly used but still perfectly fine items, something like an Amazon but for used items; and a few other project ideas, but nothing had really hit us as *the* thing to work on. We were both wanting to do something that made an impact and mattered, not just make money for ourselves.

One day &mdash; on the 16th of May 2020, to be precise &mdash; Itsi was checking CouchSurfing.com™ just to see what they were doing during the pandemic, when he came across a paywall. We were both instantly dismayed and honestly couldn't believe they had added a paywall. It took us about a dozen messages and fifteen minutes of back and forth chatting to decide that this was *the* thing we were going to work on. It was almost too good an idea to come across.

We both were avid couch surfers, and we both saw many issues with CouchSurfing.com™. For instance, we agreed that a paywall on a platform like this would slowly kill the community. It's not that a few bucks a month is too much for something we loved and had had so many great experiences through, but I was worried about the new users. It's already a tough and scary concept, now you'd have to pull out a credit card and hand a platform money before even seeing what's inside! A couch surfing platform needs a constant trickle of new users to come and join the community, and without them, the platform slowly dies. The other big crowd that I saw this personally offending was the hardcore community members, who had given so much to the global couch surfing community: hosting strangers for years or organizing countless events, only to be told that they had to pay to continue giving to their community. These people form the backbone of the community, and the community cannot thrive without their incredible work. It was balantly obvious to us that CouchSurfing.com™ had abandoned the community that had built the platform and was the substance behind it, all for a quick buck.

We weren't arrogant enough to think that we knew everything, however. Our experiences were just two out of a world of couch surfers. So we decided to embark on a big exercise to interview as many couch surfers as we could. This had a dual purpose: we wanted to clearly define what we were aiming to do, but we also secretly wanted to convince these people to trust us, to join us, and to become the initial volunteers and members for what would eventually become Couchers.org.

So in the next four weeks, we interviewed dozens of people. Among many others were [Emily](https://couchers.org/user/emily), [Jesse](https://couchers.org/user/jesse), [Natalia](https://couchers.org/user/natalia), and [Paul](https://couchers.org/user/paul), who now all sit on the Board of Couchers, Inc. the non-profit we founded to support the project. I would love to go through all the incredible people we got a chance to talk to in those four weeks as well as since then, and the huge contributions many of them ended up making &mdash; and continue to make &mdash; to the project, but there is not enough space for that in this post.

Out of these discussions with the community at large, we slowly started developing a clearer vision and plan for what we thought the next iteration of a couch surfing platform should look like. We spent many days poring over this feedback, trying our best to understand what had to change structurally for the community to thrive. The product of this was twelve essays: six about the main [issues with CouchSurfing.com™](/issues), and six about our [proposed solutions, one for each issue](/plan). We further divided these up into categories of Governance ([non-profit structure](/plan/profit-and-incentives), [community-first](/plan/communities-and-trust)), Design ([member accountability](/plan/creeps-and-freeloaders), [an improved reference system](/plan/reviews), [better host matching](/plan/host-matching)), and Technology ([building it right](/plan/the-build)).

After an arduous process of us coming up with an acceptable name (for a while we called it [CribCrash](https://github.com/aapeliv/CribCrash), but on the 26th of May we settled on Couchers.org and registered the domain), and me trying to design something web-worthy, we launched the Couchers.org website. For now, only a static landing page with a signup form to join our mailing list.

And it worked! Crowds of people found us and believed in our idea and vision. They read what we'd written, and they agreed with our analysis of the current state of the world of couch surfing. Signups started pouring in, and people started joining the volunteering organization. We started creating designs, planning features, and building community. We also started an active [Community Forum](https://community.couchers.org) for the global couch surfing community to hang out and discuss issues and solutions with, and since then, this community has been an invaluable source of advice, ideas, accountability, and energy for the project.

![A screenshot of the "Baby Alpha"](/img/blog/20240612_baby-alpha-screenshot.jpg)

The rest of the first phase was a combination of growing the group of volunteers, and building out the first barebones prototype for what would eventually become the platform. This first phase culminated in teh release of what we affectionately called the "Baby Alpha" in August of 2020 on our [forum](https://community.couchers.org/t/couchers-org-platform-alpha/254).


## Phase 2: The build: developing a platform

The second phase began in April of 2021, with the [launch of the Couchers.org Beta](https://community.couchers.org/t/soft-beta-launch/1053). By this time, over 1300 users had signed up for our mailing list.

The dev team had initially hacked together a frontend in a framework called Vue.js; it was something I had felt comfortable with and something I could quickly build with. But as our frontend development team grew, it became more and more obvious that Vue.js was not that well known and not what most frontend developers were familiar with. As a volunteer-run project, we can't expect people to learn an esoteric framework or programming language. Sure, some people will happily join and learn something new, but most people don't have the time and energy to do that before getting to the impactful work. This led to us making the decision to re-build the entire frontend in the most popular frontend framework out there called React. This was an important lesson for us on the constraints we face as a volunteer project. The Baby Alpha was the Vue.js-based frontend, and the Couchers.org Beta was the React-based one.

This was a major milestone for us, and as we moved over to the Beta, we saw this as the real start of the platform. We had publicly said that the data on the Alpha would be wiped as we worked on the database (though we ended up never doing this). With the Beta however, we made the promise that that data would be kept, migrated, and upgraded as we went along.

We built many features in this phase. Back in the Baby Alpha we let users pick a "profile color" (that you can see in the screenshot above), in Beta we upgraded this to actually being able to upload a picture. Many new features were built, and bugs were ironed out. We started publishing regular dev notes on the forum and blog to update the community on what had changed and what had been added.

I spent my evenings and weekends (and on occasion even the time I was supposed to work on my PhD) on building the backend and development infrastructure for the platform. We launched countless features, onboarded over a hundred volunteers, and welcomed tens of thousands of new members to our worldwide community.

Just before we launched the Beta, we also had the Graphic Design team come up with three alternate logo ideas, and had held a vote. The Beta launched with our new "Couch with Pins" logo, which was an instant favorite. People loved the symbology: a couch, waypoints, and a happy smile.

In January of 2022, with the help of Paul, we [incorporated Couchers, Inc.](https://couchers.org/blog/2022/01/20/couchers-becomes-501c3-nonprofit), a 501(c)(3) non-profit organization, to support the project. We had already incorporated a not-for-profit organization called the Couchers.org Foundation in Australia, but the Australian Charities and Not-for-profits Commission (ACNC) didn't approve our charity status because we didn't neatly fit into any of thier standard charity categories. This meant that we missed out on many benefits of being a charity as well as some legal safeguards we wanted. Having legal protection and shelter for the project had been important from the beginning given the paywall saga of Couchsurfing.com™, so this was another major milestone for us.

The second phase was defined by high volunteer activity, rapid and significant progress on development of the platform, and fast growth of the member base. But all these things put great strain on the founders.

When we started the platform, we looked at some of the other non-profit alternatives, and we saw what we thought were big issues with governance and leadership: the projects either had no real framework for decision making, or they devolved into large committees that ended up taking too much energy to come to a consensus and so did not end up progressing quickly enough. So when we started, we decided we would have clear leadership: with a well defined vision and plan, and take a more structured approach. Our philosophy was that decision making is just another task, and most times it's more important to make a decent decision and keep moving forward than it is to spend forever coming to a full consensus and figuring out the absolute best decision. With limited information, one often finds in hindisght that the best decision rarely turns out to be all that much better than the obvious decent ones.

In practice, this structure meant that the founders, Aapeli and Itsi, formed the leadership of the project. We tried to delegate and create self-contained independent teams, but we always struggled with this. It meant that we often ended up being involved in every project and got spread increasingly thin.

In my non-Couchers life, I had moved to New York in September of 2020 to start a PhD at Columbia University. With Itsi being in Sydney, and given how much we were collaborating (often Zoomin together for more than 20 hours a week), working from different timezones became increasingly tough. This was one of many reasons why Itsi eventually made the decision to move to New York at the end of 2021.

Housing is hard to find in New York, and when Itsi arrived, he ended up "couch surfing" at my place for 6 weeks. This was much longer than we had planned, and it put serious strain on our relationship. This, combined with some other factors around our working styles, as well as the stress Itsi was under when moving to a new continent, eventually led to bigger issues.

To simplify a very long story, we ended up having a falling out, and Couchers was wedged in the middle of it all.

I eventually ended up taking a step back to concentrate on my PhD. We formed a proper Board of Directors for the Couchers, Inc. non-profit, and tried to rework our structure around the Board and Itsi as our first Executive Director.

We slowly found out that the structure we had had &mdash; of two founder-leaders &mdash; was not robust for this kind of shock, and reworking our organizational structure in a moment of crisis at short notice did not fix these issues.

My taking a step back left Itsi unsupported, and the remnants of our interpersonal issues continued to cause strain in our working relationship. This meant that the project slowly fell into decay, and volunteering activity slowed. For a while we had some new people step up and make changes to the development workflows, but slowly that too fell into decline.

I think the biggest takeaway for the project from this period is the importance of having a more robust leadership structure, and not simply relying on two individuals to keep the project alive.

Another exacerbating factor was that the world slowly came out of COVID-19 around this time, and fewer people were stuck inside staring at screens, and people (especially couch surfers!) were more excited about getting out in the world and hanging out with people again rather than developing software. This meant that we had some uptick in platform usage, but it also translated to a reduction in volunteering activity.

The combination of these factors lead to a lull of activity from around June 2022 until about March 2024, which I see as bringing the second phase to a close.

## Phase 3: The future: fostering an active couch surfing community

The third phase of the project began around the end of March of this year. Some volunteers had come around and were interested in working on the platform again. In particular, [David](https://couchers.org/user/bakeiro) pulled me back into looking at the code sometime in March, and I ended up adding some small features to the platform (like the cute little map on profile pages!).

Delving back into the code felt great, and I was reminded of what a monumental effort we had already put into building this platform, and how important and good Couchers is for the community. I was also reminded of how much fun it was to work on the project and with the amazing community of volunteers we have. I was determined to get the project back on track, so with the help of many others, we have gotten a small group of volunteers back into action.

Coming back to the project now, and seeing things from a renewed perspective is helping me more clearly see what worked and what needs to be switched up this time around.

In order to get things back on track and avoid the pitfalls we fell into last time, we are making some changes with how the project is run. We are properly moving away from the founder-leader duo to a more resilient structure with more diversity in leadership and a larger Board of Directors. You can read more about the new Board [in a blog post I wrote to introduce the changes](/blog/2024/04/30/new-board-members). We are also doubling down on our commitment to the community as the source of direction for the project. To further this end, we will be doing a user survey later this year to better understand what Couchers should be doing for the community. Finally, we are experimenting with some other leadership changes, and will update you on how things go later in the year when the volunteering activity comes more back to life.

In the past, we have always been product-focussed. We have always started by asking ourselves what we should work on next on the platform: which features we should prioritize, and which bugs we should fix. Yet Couchers is not just about a platform, it's about the community. The two feed each other and neither must be neglected. We always acknowledged this, but the community side always lagged the product. In the past, we focussed too narrowly on what systems and mechanisms we could build permanently into the platform, instead of what we could do to foster an active community here and now.

What we need to do, and what we will be focussing on in this new phase of the project, is to take a community-focussed approach to advancing the project. This means figuring out what we can do to help grow the community and support our members in the core activities of surfing and hosting, as well as in community building via events and other activities. We need to do this in a hands-on way, not just by building mechanisms into the platform. Those are important, but we need to iterate and be much more dynamic in community building.

For now, our community growth has been *linear*: this means that people sporadically come across the project, find the message compelling, and join the platform. But in order to grow more sustainably and realize the world-wide community that we want to build, we need to get onto a trend of *exponential* growth. This means that members of the community are inviting their friends and the people they meet on their travels onto Couchers. When every member invites some number of new members, we will reach a point of stable and healthy growth. Of course we need to make sure that this growth is proportionate and that we manage to propagate the values and ideals of the community, but we have from the get go always wanted to sustainably reach more and more people and bring them into the couch surfing community. We need to work on reaching more people and making the platform and community more approachable.

In the next few weeks, the Board will be continuing discussing the strategy of the project in more detail, and we will be communicating the results of these discussions with you through the blog and by other means. We have some exciting ideas and plans, and we are looking forward to sharing these with you and the whole community!

So to summarize: in this new phase of the project, we have made changes to our governance and leadership structures. We have doubled down on our community-first mission as the foundation to sustainably grow the platform, and we have begun the process of figuring out what this all means in practice.

## Wrapping up

I hope that this blog post has been an interesting read! One reason for writing this post was to help you understand why there has been a lull in development, and to explain what we are doing to remedy this situation and stop it from happening in the future. So I hope this post has given you a better understanding on where the project is, and where we are heading into.

_Written by [Aapeli](/user/aapeli), reviewed by Itsi and Jesse. Published on 2024/06/12_

**Want to help write our blog or volunteer? [Sign up](/volunteer) and let us know. Volunteers and [donations](/donate) are what make Couchers.org possible!**
