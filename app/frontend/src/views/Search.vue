<template>
  <v-content>
      You searched for "{{ query }}"
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  data: () => ({
    //
  }),

  computed: {
    query: function () {
      return this.$route.query.q
    },
  },

  methods: {
  },
})
</script>
