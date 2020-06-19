<template>
  <v-content>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <h1>{{ title || 'Error' }}</h1>
        <v-alert type="error" prominent>
          {{ message || 'Something went wrong!' }}
        </v-alert>
        <p class="subtitle-1">If you think this is an error on our part, please let us know through the forums or by emailing us at <a href="mailto:bugs@couchers.org">bugs@couchers.org</a>!</p>
      </v-col>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  props: ['title', 'message']
})
</script>
