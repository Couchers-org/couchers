<template>
  <v-content>
    <v-container fill-height>
      <v-col class="mx-auto" cols="12" sm="10" md="8" lg="6" xl="4">
        <v-alert v-for="error in errorMessages" type="error" :key="error">
          {{ error }}
        </v-alert>
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

export default Vue.extend({
  data: () => ({
    loading: true,
    errorMessages: []
  }),

  created () {
    if (Store.getters.authenticated) {
      this.doSSO()
    } else {
      this.loading = false
      this.errorMessages = ['Please log in.']
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
        this.errorMessages = [err.message]
      })
    },
  },
})
</script>
