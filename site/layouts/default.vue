<template>
  <div>
    <nav class="navbar is-fixed-top is-primary" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item" href="/">
          $SiteName
        </a>

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
                Community-First Structure
              </a>
              <a href="/solutions/the-build" class="navbar-item">
                Building it Right
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
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a href="/issues" class="navbar-link">
              CouchSurfing issues
            </a>

            <div class="navbar-dropdown">
              <a href="/issues/profit-and-incentives" class="navbar-item">
                Profit Incentives
              </a>
              <a href="/issues/communities-and-trust" class="navbar-item">
                Damaged Communities
              </a>
              <a href="/issues/the-build" class="navbar-item">
                The Bugs and App Issues
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
            </div>
          </div>

          <a class="navbar-item" href="/faq">
            FAQ
          </a>

          <a class="navbar-item" href="/team">
            Our team
          </a>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">
              <a class="button is-light" href = "/signup">
                <strong>Join the team</strong>
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <nuxt />
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong>$SiteName</strong> by <a href="/team">the <b>$SiteName team</b></a>. The next iteration in couch-surfing.
        </p>
      </div>
    </footer>
  </div>
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