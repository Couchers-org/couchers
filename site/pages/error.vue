<template>
  <div class="container">
    <section class="hero">
      <div class="hero-body">
        <div class="container">
          <h2 class="title is-2">Page not found</h2>
          <p class="subtitle is-4">That page was not found.</p>
          <p class="content">If you're certain that a page should be here, please let us know.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  head () {
    return {
      title: 'Page not found',
      meta: [
        { hid: 'og:title', name: 'og:title', content: 'Page not found' },
        { hid: 'twitter:title', name: 'twitter:title', content: 'Page not found' },
      ]
    }
  }
}
</script>
