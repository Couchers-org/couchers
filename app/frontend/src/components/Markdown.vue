<template>
  <vue-simple-markdown :source="source" :image="false"></vue-simple-markdown>
</template>

<script lang="ts">
import Vue from "vue"
import VueSimpleMarkdown from "vue-simple-markdown"
import "vue-simple-markdown/dist/vue-simple-markdown.css"

Vue.use(VueSimpleMarkdown)

export default Vue.extend({
  props: {
    source: {
      type: String,
    },
  },
})
</script>
