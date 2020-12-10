<template>
  <v-main>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <error-alert type="error" :error="error" />
        <loading-circular :loading="loading" />
      </v-col>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { authClient } from "../api"
import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import Store from "../store"
import Router from "../router"
import ErrorAlert from "../components/ErrorAlert.vue"
import LoadingCircular from "../components/LoadingCircular.vue"

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as Error | null,
  }),

  components: {
    ErrorAlert,
    LoadingCircular,
  },

  async mounted() {
    try {
      await authClient.deauthenticate(new Empty())
      Store.commit("deauth")
    } catch (err) {
      this.loading = false
      this.error = err
    }
  },
})
</script>
