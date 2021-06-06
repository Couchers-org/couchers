<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Sign up to contribute to Couchers.org</h2>
          <p class="subtitle is-4">The contributor form has been integrated into the app. You should be redirected soon, otherwise click the button below to go to the form.</p>
          <p><a class="button is-primary" href="https://app.couchers.org/contribute">Contribute to Couchers.org</a></p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  async asyncData({redirect}) {
    redirect("https://app.couchers.org/contribute")
  },
  head () {
    return {
      title: 'Sign up',
      meta: [
        { hid: 'og:title', name: 'og:title', content: 'Sign up' },
        { hid: 'twitter:title', name: 'twitter:title', content: 'Sign up' },
      ]
    }
  }
}
</script>
