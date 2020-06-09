<template>
  <v-content>
    Logging out
  </v-content>
</template>

<script lang="ts">
  import Vue from 'vue'

  import auth from '../auth'

  export default Vue.extend({
    name: 'Logout',

    mounted () {
      auth.deauth()
    }
  })
</script>
