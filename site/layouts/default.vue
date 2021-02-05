<template>
  <div>
    <Nav />
    <Nuxt />
    <Footer />
  </div>
</template>

<script>
export default {
  head () {
    const description = "The new platform for couch-surfers. Non-profit. Community-focused. Well built."
    return {
      title: "Home",
      titleTemplate: '%s | Couchers.org',
      meta: [
        {
          property: 'og:title',
          template: chunk => (chunk ? chunk + ' | ' : '') + 'Couchers.org',
          hid: 'og:title'
        },

        {
          property: 'twitter:title',
          template: chunk => (chunk ? chunk + ' | ' : '') + 'Couchers.org',
          hid: 'twitter:title'
        },

        { hid: 'description', name: 'description', content: description },
        { hid: 'og:description', property: 'og:description', content: description },
        { hid: 'twitter:description', name: 'twitter:description', content: description },

        { hid: 'og:image', property: 'og:image', content: 'https://couchers.org/img/share.jpg' },
        { hid: 'twitter:image', name: 'twitter:image', content: 'https://couchers.org/img/share.jpg' },

        { hid: 'og:url', property: 'og:url', content: 'https://couchers.org' },
        { hid: 'og:type', property: 'og:type', content: 'website' },
        { hid: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' }
      ]
    }
  }
}
</script>

<style>
@import url("node_modules/@mdi/font/css/materialdesignicons.css");
</style>
