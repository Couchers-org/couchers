<template>
  <div>
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h1 class="title is-1">
            OpenDoors
          </h1>
          <h2 class="subtitle">
            Some hipstery, catchy phrase or something.
          </h2>
        </div>
      </div>
    </section>
    <div class="container">
      <section class="section">
        <div class="container">
          <h2 class="title is-2">What's this all about?</h2>
          <p class="content">We are a group of couch-surfers who are commited to building a new online platform for the couch-surfing community. We aim to build you a product that is community focussed and non-profit, and with an emphasis on being useful, modern, well-built and able to evolve based on the community's needs. Our intention is to become the most popular hospitality exchange platform, scaling appropriately to introduce new members properly into the community.</p>
          <p class="content">This is version 0 of our platform. Here we will explain in detail what we believe is wrong with CouchSurfing as the biggest player, and our solutions for fixing it. We are actively looking for volunteers with a wide range of experience and expertise. If seeing this come to life interests you, you think you could contribute, or you just want to see it done right, please sign up.</p>
          <p><a class="button is-primary is-medium" href="/signup">Sign up</a></p>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <h2 class="title is-2">The key problems with CouchSurfing</h2>
          <p class="content">While CouchSurfing has brought us many positive experiences and we've stuck with it for years, it's no secret that it has its problems. Here are the main issues we think that it has, and our answers for how we could fix these through building something better.</p>
          <div class="tile is-ancestor">
            <div class="tile is-vertical">
              <div class="tile">
                <div class="tile is-parent">
                  <article class="tile is-child notification is-success">
                    <p class="subtitle">Our plan</p>
                    <h3 class="title is-3"><a href="/solutions/profit-and-incentives">Non-profit structure</a></h3>
                    <p class="content">We will be a non-profit and explore various revenue models. There are many successful non-profits. We do not need investors.</p>
                    <p class="subtitle">To fix</p>
                    <h3 class="title is-3"><a href="/issues/profit-and-incentives">Profit incentives</a></h3>
                    <p class="content">CouchSurfing needs to prioritise returns for investors at the expense of the community.</p>
                  </article>
                </div>
                <div class="tile is-parent">
                  <article class="tile is-child notification is-link">
                    <p class="subtitle">Our plan</p>
                    <h3 class="title is-3"><a href="/solutions/communities-and-trust">Community-first structure</a></h3>
                    <p class="content">Prioritise community at the foundation, improve trust with an improved verification and reference system.</p>
                    <p class="subtitle">To fix</p>
                    <h3 class="title is-3"><a href="/issues/communities-and-trust">Neglected communities</a></h3>
                    <p class="content">The community has been ignored, too many users pushed onto the platform, trust between members has been eroded.</p>
                  </article>
                </div>
                <div class="tile is-parent">
                  <article class="tile is-child notification is-danger">
                    <p class="subtitle">Our plan</p>
                    <h3 class="title is-3"><a href="/solutions/the-build">Build it right</a></h3>
                    <p class="content">Our platform is developer-led. We will build this right, make it scalable, and listen to the community to fix bugs.</p>
                    <p class="subtitle">To fix</p>
                    <h3 class="title is-3"><a href="/issues/the-build">The bugs and app issues</a></h3>
                    <p class="content">There are far too many bugs and problems with the CouchSurfing platform.</p>
                  </article>
                </div>
              </div>
              <div class="tile">
                <div class="tile is-parent">
                  <article class="tile is-child notification is-warning">
                    <p class="subtitle">Our plan</p>
                    <h3 class="title is-3"><a href="/solutions/creeps-and-freeloaders">Member accountability</a></h3>
                    <p class="content">Institute public accountability: members will know who they can trust, the community can filter out detrimental people.</p>
                    <p class="subtitle">To fix</p>
                    <h3 class="title is-3"><a href="/issues/creeps-and-freeloaders">Safety and freeloaders</a></h3>
                    <p class="content">There is a widespread safety issue, especially for women, with predatory users using the platfom for sex. Freeloaders abound.</p>
                  </article>
                </div>
                <div class="tile is-parent">
                  <article class="tile is-child notification is-danger">
                    <p class="subtitle">Our plan</p>
                    <h3 class="title is-3"><a href="/solutions/reviews">Improved review system</a></h3>
                    <p class="content">Anonymous reviews, destigmatise negative reviews, a new score that more reflects if people are trustworthy and good for the community.</p>
                    <p class="subtitle">To fix</p>
                    <h3 class="title is-3"><a href="/issues/reviews">Disfunctional reference system</a></h3>
                    <p class="content">The reference system doesn't work as a way to trust people.</p>
                  </article>
                </div>
                <div class="tile is-parent">
                  <article class="tile is-child notification is-success">
                    <p class="subtitle">Our plan</p>
                    <h3 class="title is-3"><a href="/solutions/host-matching">Better host finding</a></h3>
                    <p class="content">Incentivise spread out hosting in each city, remove the message cap.</p>
                    <p class="subtitle">To fix</p>
                    <h3 class="title is-3"><a href="/issues/host-matching">Super-host effect</a></h3>
                    <p class="content">Local communities have been shrinking to just small groups of super-hosts (it's not their fault).</p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <h2 class="title is-2">The team</h2>
          <p class="content">We aren't just a bunch of randos of the internet. We promise. <a href="/team">Read more about the team</a>.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>

<style>
.hero {
  background: no-repeat url("/img/hero.jpg");
  background-size: cover;

  padding-top: 14em;
  padding-bottom: 12em;
}
</style>
