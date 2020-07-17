<template>
  <v-content>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <error-alert type="error" :error="error" />
        <loading-circular :loading="loading" />
      </v-col>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from "vue"

import { authClient } from "../api"
import { DeAuthReq } from "../pb/auth_pb"

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

  mounted() {
    const req = new DeAuthReq()
    req.setToken(Store.state.authToken!)
    authClient
      .deauthenticate(req)
      .then(() => {
        Store.commit("deauth")
        Router.push({ name: "Login" })
      })
      .catch((err) => {
        this.loading = false
        this.error = err
      })
  },
})
</script>
