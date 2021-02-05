<template>
  <nav class="navbar is-fixed-top is-primary" role="navigation" aria-label="main navigation">
    <div class="navbar-brand">
      <a class="navbar-item brand" href="/">Couchers.org</a>

      <a role="button" class="navbar-burger burger" v-bind:class="{ 'is-active': burger_active }" v-on:click="toggle_burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div id="navbarBasicExample" class="navbar-menu" v-bind:class="{ 'is-active': burger_active }">
      <div class="navbar-start">

        <div class="navbar-item has-dropdown is-hoverable">
          <a href="/solutions" class="navbar-link">
            Our plan
          </a>

          <div class="navbar-dropdown">
            <a href="/solutions/profit-and-incentives" class="navbar-item">
              Non-Profit Structure
            </a>
            <a href="/solutions/communities-and-trust" class="navbar-item">
              Community-First Framework
            </a>
            <a href="/solutions/creeps-and-freeloaders" class="navbar-item">
              Member Accountability
            </a>
            <a href="/solutions/reviews" class="navbar-item">
              Improved Review System
            </a>
            <a href="/solutions/host-matching" class="navbar-item">
              Better Host Finding
            </a>
            <a href="/solutions/the-build" class="navbar-item">
              Building it Right
            </a>
          </div>
        </div>

        <div class="navbar-item has-dropdown is-hoverable">
          <a href="/issues" class="navbar-link">
            Couchsurfing&#8482; issues
          </a>

          <div class="navbar-dropdown">
            <a href="/issues/profit-and-incentives" class="navbar-item">
              Profit and Incentives
            </a>
            <a href="/issues/communities-and-trust" class="navbar-item">
              Neglected Communities
            </a>
            <a href="/issues/creeps-and-freeloaders" class="navbar-item">
              Safety and Freeloaders
            </a>
            <a href="/issues/reviews" class="navbar-item">
              The Reference System
            </a>
            <a href="/issues/host-matching" class="navbar-item">
              The Super-Host Effect
            </a>
            <a href="/issues/the-build" class="navbar-item">
              The Bugs and App Issues
            </a>
          </div>
        </div>

        <a class="navbar-item" href="/foundation">
          Foundation
        </a>

        <a class="navbar-item" href="/faq">
          FAQ
        </a>

        <a class="navbar-item" href="/team">
          Our team &ndash; positions available
        </a>
      </div>

      <div class="navbar-end">
        <div class="navbar-item">
          <div class="buttons">
            <a class="button is-light" href="https://community.couchers.org/">
              <strong>Community Forum</strong>
            </a>
          </div>
        </div>
        <div class="navbar-item">
          <div class="buttons">
            <a class="button is-light" href="/signup">
              <strong>Sign up!</strong>
            </a>
          </div>
        </div>

        <a class="navbar-item" href="https://github.com/couchers-org/couchers">
          <span class="icon is-large"><i class="mdi mdi-github mdi-36px" aria-label="Couchers.org GitHub"></i></span>
        </a>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  data: () => {
    return {
      burger_active: false
    }
  },
  methods: {
    toggle_burger: function () {
      this.burger_active = !this.burger_active
    }
  }
}
</script>

<style>
.brand {
  font-weight: 700;
}
</style>
