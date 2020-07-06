<template>
  <v-text-field v-model="query" flat solo-inverted hide-details prepend-inner-icon="mdi-magnify" label="Search" v-on:keyup.enter="search"></v-text-field>
</template>

<script lang="ts">
import Vue from 'vue'

import Router from '../router'

export default Vue.extend({
  data: () => ({
    query: ""
  }),

  methods: {
    search() {
      Router.push({ name: 'Search', query: { q: this.query } })
    }
  }
})
</script>
