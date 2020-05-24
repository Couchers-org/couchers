<template>
  <div class="container">
    <section class="section">
      <div class="container">
        <h1 class="title is-1">{{ attributes.title }}</h1>
        <div class="content" v-html="html"></div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  async asyncData({params, error}) {
    try {
      let filename = params.pathMatch
      if (filename.substring(filename.length - 1) === "/") {
        filename = filename.substring(0, filename.length - 1)
      }
      return await import(`@/markdown/${filename}.md`)
    } catch (err) {
      error({ statusCode: 404, message: 'Page not found' })
    }
  }
}
</script>
