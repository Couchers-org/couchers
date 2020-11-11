<template>
  <v-main>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <error-alert :error="error" />
        <loading-circular :loading="loading">Loading...</loading-circular>
      </v-col>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { SSOReq } from "../pb/sso_pb"
import { SSOclient } from "../api"

import Store from "../store"

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

  created() {
    this.doSSO()
  },

  methods: {
    async doSSO() {
      const req = new SSOReq()

      // these are nominally something like string | (null | string)[], but we can just pretend they're string
      req.setSso(this.$route.query.sso as string)
      req.setSig(this.$route.query.sig as string)

      try {
        const res = await SSOclient.sSO(req)
        window.location.href = res.getRedirectUrl()
      } catch (err) {
        this.error = err
      }
      this.loading = false
    },
  },
})
</script>
