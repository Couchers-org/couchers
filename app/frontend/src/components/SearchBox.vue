<template>
  <v-text-field v-model="searchText" flat solo-inverted hide-details prepend-inner-icon="mdi-magnify" label="Search"></v-text-field>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data: () => ({
    searchText: ""
  }),

  methods: {
    search() {
      this.$emit('search', this.searchText)
    }
  }
})
</script>
