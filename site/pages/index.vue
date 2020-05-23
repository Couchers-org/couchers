<template>
  <div class="container">
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
    <section class="section">
      <div class="container">
        <h2 class="title is-2">The problems with CS</h2>
        <div class="tile is-ancestor">
          <div class="tile is-vertical">
            <div class="tile">
              <div class="tile is-parent">
                <article class="tile is-child notification is-primary">
                  <p class="subtitle">Issue</p>
                  <p class="title">Profit and Incentives</p>
                  <p class="content">Short explanation of the problem</p>
                  <p class="subtitle">The solution</p>
                  <p class="title">Our solution to Profit and Incentives</p>
                  <p class="content">Short explanation of the solution</p>
                  <p><a class="button is-light is-link" href="/">Read our analysis</a></p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-link">
                  <p class="subtitle">Issue</p>
                  <p class="title">Communities and Trust</p>
                  <p class="content">Short explanation of the problem</p>
                  <p class="subtitle">The solution</p>
                  <p class="title">Our solution to Communities and Trust</p>
                  <p class="content">Short explanation of the solution</p>
                  <p><a class="button is-light is-link" href="/">Read our analysis</a></p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-warning">
                  <p class="subtitle">Issue</p>
                  <p class="title">Creeps and Freeloaders</p>
                  <p class="content">Short explanation of the problem</p>
                  <p class="subtitle">The solution</p>
                  <p class="title">Our solution to Creeps and Freeloaders</p>
                  <p class="content">Short explanation of the solution</p>
                  <p><a class="button is-light is-link" href="/">Read our analysis</a></p>
                </article>
              </div>
            </div>
            <div class="tile">
              <div class="tile is-parent">
                <article class="tile is-child notification is-success">
                  <p class="subtitle">Issue</p>
                  <p class="title">Host Matching</p>
                  <p class="content">Short explanation of the problem</p>
                  <p class="subtitle">The solution</p>
                  <p class="titleOur solution to ">Host Matching</p>
                  <p class="content">Short explanation of the solution</p>
                  <p><a class="button is-light is-link" href="/">Read our analysis</a></p>
                </article>
              </div>
              <div class="tile is-parent">
                <article class="tile is-child notification is-danger">
                  <p class="subtitle">Issue</p>
                  <p class="title">The Build</p>
                  <p class="content">Short explanation of the problem</p>
                  <p class="subtitle">The solution</p>
                  <p class="titleOur solution to ">The Build</p>
                  <p class="content">Short explanation of the solution</p>
                  <p><a class="button is-light is-link" href="/">Read our analysis</a></p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Logo from '~/components/Logo.vue'

export default Vue.extend({
  components: {
    Logo
  }
})
</script>

<style>
.hero {
  margin-top: 10em;
  margin-bottom: 10em;
}
</style>
