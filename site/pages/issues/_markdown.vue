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
    async asyncData({params}) {
        console.log(`${params.markdown}`)
        let thingo = await import(`@/markdown/issues/${params.markdown}.md`)
        console.log(thingo)
        return thingo
    }
}
</script>
