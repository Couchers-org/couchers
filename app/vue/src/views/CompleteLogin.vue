<template>
  <v-main>
    <v-container fluid>
      <error-alert :error="error" />
      <loading-circular :loading="loading">Logging you in...</loading-circular>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { authClient } from "../api"
import { CompleteTokenLoginReq } from "../pb/auth_pb"

import Store from "../store"
import Router from "../router"
import ErrorAlert from "../components/ErrorAlert.vue"
import LoadingCircular from "../components/LoadingCircular.vue"

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as Error | null,
    successMessages: [] as Array<string>,
  }),

  components: {
    ErrorAlert,
    LoadingCircular,
  },

  created() {
    this.fetchData()
  },

  methods: {
    async fetchData() {
      const req = new CompleteTokenLoginReq()
      req.setLoginToken(this.$route.params.token)
      try {
        const res = await authClient.completeTokenLogin(req)
        this.successMessages = ["Success."]
        Store.dispatch("auth", res)
        Router.push("/")
      } catch (err) {
        Router.push({ name: "Login", params: { reason: err.message } })
      }
      this.loading = false
    },
  },
})
</script>
