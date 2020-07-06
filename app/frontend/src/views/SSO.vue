<template>
  <v-content>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <error-alert :error="error"/>
        <div v-if="loading">
          <p class="subtitle-1 text-center">Loading...</p>
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </div>
      </v-col>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import { SSOReq } from '../pb/api_pb'
import { client } from '../api'

import Store, { AuthenticationState } from '../store'

import Router from '../router'
import ErrorAlert from '../components/ErrorAlert.vue'

export default Vue.extend({
  data: () => ({
    loading: true,
    error: null as (Error | null)
  }),

  components: {
    'error-alert': ErrorAlert
  },

  created () {
    if (Store.getters.authenticated) {
      this.doSSO()
    } else {
      this.loading = false
      this.error = new Error('Please log in.')
    }
  },

  methods: {
    doSSO() {
      const req = new SSOReq()

      req.setSso(this.$route.query.sso)
      req.setSig(this.$route.query.sig)

      client.sSO(req, null).then(res => {
        window.location.href = res.getRedirectUrl()
      }).catch(err => {
        this.loading = false
        this.error = err
      })
    },
  },
})
</script>
