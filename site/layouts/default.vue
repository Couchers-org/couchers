<template>
  <div>
    <nav class="navbar is-fixed-top" role="navigation" aria-label="main navigation">
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
              <a href="/" class="navbar-item">
                Profit and Incentives
              </a>
              <a href="/" class="navbar-item">
                Communities and Trust
              </a>
              <a href="/" class="navbar-item">
                Creeps and Freeloaders
              </a>
              <a href="/" class="navbar-item">
                Host Matching
              </a>
              <a href="/" class="navbar-item">
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
              <a class="button is-primary">
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

<style>
html {
  font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  margin: 0;
}

.button--green {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #3b8070;
  color: #3b8070;
  text-decoration: none;
  padding: 10px 30px;
}

.button--green:hover {
  color: #fff;
  background-color: #3b8070;
}

.button--grey {
  display: inline-block;
  border-radius: 4px;
  border: 1px solid #35495e;
  color: #35495e;
  text-decoration: none;
  padding: 10px 30px;
  margin-left: 15px;
}

.button--grey:hover {
  color: #fff;
  background-color: #35495e;
}
</style>
