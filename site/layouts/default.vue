<template>
  <div>
    <nav class="navbar is-fixed-top is-primary" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item" href="/">
          OpenDoors
        </a>

        <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navbarBasicExample" class="navbar-menu">
        <div class="navbar-start">
          <a class="navbar-item" href="/">
            Home
          </a>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">
              Why OpenDoors?
            </a>

            <div class="navbar-dropdown">
              <a href="/issues/profit-and-incentives" class="navbar-item">
                Profit and Incentives
              </a>
              <a href="/issues/communities-and-trust" class="navbar-item">
                Communities and Trust
              </a>
              <a href="/issues/reviews" class="navbar-item">
                The Review System
              </a>
              <a href="/issues/creeps-and-freeloaders" class="navbar-item">
                Creeps and Freeloaders
              </a>
              <a href="/issues/host-matching" class="navbar-item">
                Host Matching
              </a>
              <a href="/issues/the-build" class="navbar-item">
                The Build
              </a>
            </div>
          </div>

          <div class="navbar-item has-dropdown is-hoverable">
            <a class="navbar-link">
              Our solutions
            </a>

            <div class="navbar-dropdown">
              <a href="/solutions/profit-and-incentives" class="navbar-item">
                Profit and Incentives
              </a>
              <a href="/solutions/communities-and-trust" class="navbar-item">
                Communities and Trust
              </a>
              <a href="/solutions/reviews" class="navbar-item">
                The Review System
              </a>
              <a href="/solutions/creeps-and-freeloaders" class="navbar-item">
                Creeps and Freeloaders
              </a>
              <a href="/solutions/host-matching" class="navbar-item">
                Host Matching
              </a>
              <a href="/solutions/the-build" class="navbar-item">
                The Build
              </a>
            </div>
          </div>

          <a class="navbar-item" href="/team">
            Our team
          </a>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">
              <a class="button is-light">
                <strong>Sign up</strong>
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
          <strong>OpenDoors</strong> by <a href="/team">the <b>OpenDoors team</b></a>. The next iteration in couch-surfing.
        </p>
      </div>
    </footer>
  </div>
</template>
