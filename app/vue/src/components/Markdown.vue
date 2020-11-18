<template>
  <v-container v-html="rendered"></v-container>
</template>

<script lang="ts">
import Vue from "vue"
import markdown from "markdown-it"

const md = new markdown().disable("image")

export default Vue.extend({
  props: {
    source: {
      type: String,
    },
  },

  computed: {
    rendered() {
      return md.render(this.source)
    },
  },
})
</script>
