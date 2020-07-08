<template>
  <v-col v-if="loading" class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
    <v-container>
      <p><slot></slot></p>
      <v-progress-circular color="primary" indeterminate> </v-progress-circular>
    </v-container>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    loading: {
      type: [Boolean],
    },
  },
})
</script>
